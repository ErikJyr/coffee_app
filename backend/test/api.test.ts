import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { statSync } from 'node:fs'
import { Type } from '@sinclair/typebox'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { openDatabase, selectOne } from '../src/database.js'
import { createAccount } from '../src/accounts.js'
import { hashPassword } from '../src/passwords.js'
import { ApiError, AuthResponse, Order, Product, UserRow } from '../src/models.js'
import { Tracking, demoTracking } from '../src/tracking.js'
import { fixture, registerCustomer, addCoffee, getQuote, checkoutInput, headers, responseModel, testPassword, type Client } from './helpers.js'

const account = { email: 'customer@example.test', name: 'Demo Customer', password: testPassword }

test('catalog, health, OpenAPI, security headers, and private database storage', async (context) => {
  const { app, config } = await fixture(context)
  const response = await app.inject('/api/products')
  assert.equal(response.statusCode, 200)
  const products = responseModel(response, Type.Array(Product))
  assert.equal(products.length, 4)
  assert.equal(products[0]!.prices.M, 453)
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal((statSync(config.databasePath).mode & 0o777), 0o600)
  assert.equal((await app.inject('/api/health')).statusCode, 200)
  const documentation = await app.inject('/api/openapi.json')
  assert.equal(documentation.statusCode, 200)
  assert.ok(documentation.body.includes('/api/orders'))
})

test('accounts ignore role overposting, hash passwords, and revoke logout sessions', async (context) => {
  const { app, config } = await fixture(context)
  const response = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin: config.appOrigin }, payload: { ...account, role: 'admin' } })
  assert.equal(response.statusCode, 201, response.body)
  const auth = responseModel(response, AuthResponse)
  assert.equal(auth.user.role, 'customer')
  assert.ok(!response.body.includes('password'))
  assert.ok(response.headers['set-cookie']?.includes('HttpOnly'))
  assert.ok(response.headers['set-cookie']?.includes('SameSite=Strict'))
  const cookie = response.cookies[0]!
  const client: Client = { cookie: `${cookie.name}=${cookie.value}`, csrfToken: auth.csrfToken, userId: auth.user.id }
  const db = openDatabase(config.databasePath)
  try {
    const row = selectOne(db, UserRow, 'SELECT * FROM users WHERE id = ?', [client.userId])!
    assert.ok(row.password_hash.startsWith('scrypt-32768-8-3:'))
    assert.ok(!row.password_hash.includes(account.password))
    const tokens = db.prepare('SELECT token_hash FROM sessions').all()
    assert.ok(!JSON.stringify(tokens).includes(cookie.value))
  } finally { db.close() }
  assert.equal((await app.inject({ url: '/api/admin/orders?limit=10&offset=0', headers: headers(client) })).statusCode, 403)
  assert.equal((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: headers(client), payload: {} })).statusCode, 204)
  assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(client) })).statusCode, 401)
})

test('exact-origin and CSRF checks reject unauthorized writes, including malformed tokens', async (context) => {
  const { app } = await fixture(context)
  const client = await registerCustomer(app, account)
  const url = '/api/cart/items/caffe-mocha/M'
  const payload = { quantity: 1 }
  assert.equal((await app.inject({ method: 'PUT', url, headers: { ...headers(client), origin: 'https://attacker.test' }, payload })).statusCode, 403)
  assert.equal((await app.inject({ method: 'PUT', url, headers: { cookie: client.cookie, origin: 'http://localhost:5173' }, payload })).statusCode, 403)
  assert.equal((await app.inject({ method: 'PUT', url, headers: { ...headers(client), 'x-csrf-token': 'é'.repeat(43) }, payload })).statusCode, 403)
  assert.equal((await app.inject({ method: 'PUT', url, headers: { cookie: client.cookie, 'x-csrf-token': client.csrfToken }, payload })).statusCode, 403)
  const rejected = await app.inject({ method: 'PATCH', url: '/api/profile', headers: headers(client), payload: { name: 'Only a name' } })
  assert.equal(rejected.statusCode, 400)
  const quote = await getQuote(app, client)
  assert.equal(quote.items.length, 0)
})

test('schema validation, server-owned prices, and basket quantity bounds', async (context) => {
  const { app } = await fixture(context)
  const client = await registerCustomer(app, account)
  for (const quantity of [0, 21, -1, 1.5, '2']) {
    const response = await app.inject({ method: 'PUT', url: '/api/cart/items/caffe-mocha/M', headers: headers(client), payload: { quantity } })
    assert.equal(response.statusCode, 400, response.body)
  }
  await addCoffee(app, client, 'caffe-mocha')
  const quote = await getQuote(app, client)
  assert.equal(quote.subtotalCents, 453)
  assert.equal(quote.totalCents, 503)
  assert.equal((await app.inject({ method: 'PUT', url: '/api/cart/items/missing-coffee/M', headers: headers(client), payload: { quantity: 1 } })).statusCode, 404)
  assert.equal((await app.inject({ url: '/api/orders?limit=100000&offset=0', headers: headers(client) })).statusCode, 400)
  assert.equal((await app.inject({ url: '/api/products/%27%20OR%201%3D1--' })).statusCode, 400)
})

test('atomic checkout resists price tampering and concurrent duplicate submissions', async (context) => {
  const { app } = await fixture(context)
  const client = await registerCustomer(app, account)
  await addCoffee(app, client, 'caffe-mocha')
  const quote = await getQuote(app, client)
  const idempotencyKey = randomUUID()
  const input = checkoutInput(quote.version)
  const request = { method: 'POST' as const, url: '/api/orders', headers: { ...headers(client), 'idempotency-key': idempotencyKey }, payload: { ...input, totalCents: 1, status: 'delivered', paymentStatus: 'paid' } }
  const responses = await Promise.all([app.inject(request), app.inject(request)])
  assert.deepEqual(responses.map((response) => response.statusCode).sort(), [200, 201])
  const orders = responses.map((response) => responseModel(response, Order))
  assert.equal(orders[0]!.id, orders[1]!.id)
  assert.equal(orders[0]!.totalCents, 503)
  assert.equal(orders[0]!.status, 'queued')
  assert.equal(orders[0]!.paymentStatus, 'pending')
  assert.equal((await getQuote(app, client)).items.length, 0)
  const conflict = await app.inject({ ...request, payload: { ...input, note: 'Different request' } })
  assert.equal(conflict.statusCode, 409)
  const stale = await app.inject({ ...request, headers: { ...headers(client), 'idempotency-key': randomUUID() } })
  assert.equal(stale.statusCode, 409)
})

test('customer ownership isolates profiles, baskets, favorites, orders, and tracking', async (context) => {
  const { app } = await fixture(context)
  const first = await registerCustomer(app, account)
  const second = await registerCustomer(app, { ...account, email: 'another@example.test' })
  await addCoffee(app, first, 'flat-white')
  assert.equal((await getQuote(app, second)).items.length, 0)
  assert.equal((await app.inject({ method: 'PUT', url: '/api/favorites/flat-white', headers: headers(first), payload: {} })).statusCode, 204)
  assert.deepEqual(responseModel(await app.inject({ url: '/api/favorites', headers: headers(second) }), Type.Array(Product)), [])
  const quote = await getQuote(app, first)
  const result = await app.inject({ method: 'POST', url: '/api/orders', headers: { ...headers(first), 'idempotency-key': randomUUID() }, payload: checkoutInput(quote.version) })
  const order = responseModel(result, Order)
  for (const url of [`/api/orders/${order.id}`, `/api/orders/${order.id}/tracking`]) {
    assert.equal((await app.inject({ url, headers: headers(second) })).statusCode, 404)
    assert.equal((await app.inject({ url })).statusCode, 401)
  }
  assert.equal((await app.inject({ method: 'POST', url: `/api/orders/${order.id}/cancel`, headers: headers(second), payload: {} })).statusCode, 404)
  const tracking = await app.inject({ url: `/api/orders/${order.id}/tracking`, headers: headers(first) })
  assert.equal(responseModel(tracking, Tracking).kind, 'simulation')
  const completed = demoTracking(0, 60000)
  assert.equal(completed.arrived, true)
  assert.equal(responseModel(await app.inject({ url: `/api/orders/${order.id}`, headers: headers(first) }), Order).status, 'queued')
})

test('failed persistence rolls back the order, idempotency key, and basket deletion', async (context) => {
  const { app, config } = await fixture(context)
  const client = await registerCustomer(app, account)
  await addCoffee(app, client, 'caffe-mocha')
  const quote = await getQuote(app, client)
  const request = { method: 'POST' as const, url: '/api/orders', headers: { ...headers(client), 'idempotency-key': randomUUID() }, payload: checkoutInput(quote.version) }
  const db = openDatabase(config.databasePath)
  try {
    db.exec("CREATE TRIGGER reject_item BEFORE INSERT ON order_items BEGIN SELECT RAISE(ABORT, 'test database failure'); END;")
    const failed = await app.inject(request)
    assert.equal(failed.statusCode, 500)
    assert.equal(responseModel(failed, ApiError).code, 'INTERNAL_ERROR')
    assert.ok(!failed.body.includes('test database failure'))
    assert.equal((await getQuote(app, client)).items.length, 1)
    assert.deepEqual(responseModel(await app.inject({ url: '/api/orders?limit=10&offset=0', headers: headers(client) }), Type.Array(Order)), [])
    db.exec('DROP TRIGGER reject_item')
    assert.equal((await app.inject(request)).statusCode, 201)
  } finally { db.close() }
})

test('staff price changes invalidate quotes and staff-only workflows enforce legal transitions', async (context) => {
  const { app, config } = await fixture(context)
  const client = await registerCustomer(app, account)
  const db = openDatabase(config.databasePath)
  try { createAccount(db, { ...account, email: 'staff@example.test' }, await hashPassword(testPassword), 'admin') } finally { db.close() }
  const signIn = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: config.appOrigin }, payload: { email: 'staff@example.test', password: testPassword } })
  assert.equal(signIn.statusCode, 200, signIn.body)
  const staffAuth = responseModel(signIn, AuthResponse)
  const staffCookie = signIn.cookies[0]!
  const staff: Client = { cookie: `${staffCookie.name}=${staffCookie.value}`, csrfToken: staffAuth.csrfToken, userId: staffAuth.user.id }
  await addCoffee(app, client, 'caffe-mocha')
  const oldQuote = await getQuote(app, client)
  const change = { method: 'PATCH' as const, url: '/api/admin/products/caffe-mocha', payload: { prices: { S: 500, M: 600, L: 700 }, available: true } }
  assert.equal((await app.inject({ ...change, headers: headers(client) })).statusCode, 403)
  assert.equal((await app.inject({ ...change, headers: headers(staff) })).statusCode, 200)
  assert.equal((await app.inject({ method: 'POST', url: '/api/orders', headers: { ...headers(client), 'idempotency-key': randomUUID() }, payload: checkoutInput(oldQuote.version) })).statusCode, 409)
  const quote = await getQuote(app, client)
  assert.equal(quote.totalCents, 650)
  const placed = await app.inject({ method: 'POST', url: '/api/orders', headers: { ...headers(client), 'idempotency-key': randomUUID() }, payload: checkoutInput(quote.version) })
  const order = responseModel(placed, Order)
  const statusUrl = `/api/admin/orders/${order.id}/status`
  assert.equal((await app.inject({ method: 'PATCH', url: statusUrl, headers: headers(client), payload: { status: 'delivered' } })).statusCode, 403)
  assert.equal((await app.inject({ method: 'PATCH', url: statusUrl, headers: headers(staff), payload: { status: 'delivered' } })).statusCode, 409)
  for (const status of ['preparing', 'out_for_delivery', 'delivered']) {
    assert.equal((await app.inject({ method: 'PATCH', url: statusUrl, headers: headers(staff), payload: { status } })).statusCode, 200)
  }
  const cashUrl = `/api/admin/orders/${order.id}/cash-payment`
  assert.equal((await app.inject({ method: 'POST', url: cashUrl, headers: headers(client), payload: {} })).statusCode, 403)
  const cash = await app.inject({ method: 'POST', url: cashUrl, headers: headers(staff), payload: {} })
  assert.equal(responseModel(cash, Order).paymentStatus, 'paid')
  const snapshot = responseModel(await app.inject({ url: `/api/orders/${order.id}`, headers: headers(client) }), Order)
  assert.equal(snapshot.items[0]!.unitPriceCents, 600)
})

test('pickup has no delivery fee, unavailable wallet fails explicitly, and cancellation stops tracking', async (context) => {
  const { app } = await fixture(context)
  const client = await registerCustomer(app, account)
  await addCoffee(app, client, 'flat-white')
  const quote = await getQuote(app, client)
  const checkout = { method: 'POST' as const, url: '/api/orders', headers: { ...headers(client), 'idempotency-key': randomUUID() }, payload: { ...checkoutInput(quote.version), paymentMethod: 'Wallet' } }
  const wallet = await app.inject(checkout)
  assert.equal(wallet.statusCode, 409)
  assert.equal(responseModel(wallet, ApiError).code, 'PAYMENT_NOT_CONFIGURED')
  assert.equal((await getQuote(app, client)).items.length, 1)
  const pickup = await app.inject({ ...checkout, payload: { ...checkoutInput(quote.version), deliveryMode: 'Pick Up', deliveryAddress: null } })
  const order = responseModel(pickup, Order)
  assert.equal(order.deliveryFeeCents, 0)
  assert.equal(order.deliveryAddress, null)
  assert.equal((await app.inject({ url: `/api/orders/${order.id}/tracking`, headers: headers(client) })).statusCode, 409)
  assert.equal((await app.inject({ method: 'POST', url: `/api/orders/${order.id}/cancel`, headers: headers(client), payload: {} })).statusCode, 200)
})

test('password changes invalidate every session and preserve generic sign-in errors', async (context) => {
  const { app, config } = await fixture(context)
  const client = await registerCustomer(app, account)
  const login = { method: 'POST' as const, url: '/api/auth/login', headers: { origin: config.appOrigin }, payload: { email: account.email, password: testPassword } }
  const signedIn = await app.inject(login)
  const secondCookie = signedIn.cookies[0]!
  const changed = await app.inject({ method: 'POST', url: '/api/auth/password', headers: headers(client), payload: { currentPassword: testPassword, newPassword: 'different-test-only-passphrase-43' } })
  assert.equal(changed.statusCode, 204, changed.body)
  assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(client) })).statusCode, 401)
  assert.equal((await app.inject({ url: '/api/auth/me', headers: { cookie: `${secondCookie.name}=${secondCookie.value}` } })).statusCode, 401)
  const wrong = await app.inject(login)
  const unknown = await app.inject({ ...login, payload: { ...login.payload, email: 'missing@example.test' } })
  assert.equal(wrong.statusCode, 401)
  assert.equal(responseModel(wrong, ApiError).message, responseModel(unknown, ApiError).message)
  assert.equal((await app.inject({ ...login, payload: { email: account.email, password: 'different-test-only-passphrase-43' } })).statusCode, 200)
})

test('rate limits and request-size limits fail closed', async (context) => {
  const { app, config } = await fixture(context)
  const request = { method: 'POST' as const, url: '/api/auth/login', headers: { origin: config.appOrigin }, payload: { email: 'missing@example.test', password: testPassword } }
  for (let attempt = 0; attempt < 5; attempt++) assert.equal((await app.inject(request)).statusCode, 401)
  const limited = await app.inject(request)
  assert.equal(limited.statusCode, 429)
  assert.ok(limited.headers['retry-after'])
  const oversized = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin: config.appOrigin }, payload: { ...account, name: 'x'.repeat(17000) } })
  assert.equal(oversized.statusCode, 413)
})

test('persistent sessions survive restart, production cookies are secure, and invalid production config fails', async (context) => {
  const { app, config } = await fixture(context)
  const client = await registerCustomer(app, account)
  await addCoffee(app, client, 'caffe-mocha')
  await app.close()
  const reopened = await buildApp(config)
  try {
    assert.equal((await reopened.inject({ url: '/api/auth/me', headers: headers(client) })).statusCode, 200)
    assert.equal((await getQuote(reopened, client)).items.length, 1)
  } finally { await reopened.close() }
  assert.throws(() => loadConfig({ NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3001', APP_ORIGIN: 'http://example.test', DATABASE_PATH: config.databasePath }), /HTTPS/)
  const production = await buildApp({ ...config, environment: 'production', appOrigin: 'https://coffee.example.test' })
  try {
    const response = await production.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: 'https://coffee.example.test' }, payload: { email: account.email, password: testPassword } })
    assert.equal(response.statusCode, 200)
    const cookie = response.headers['set-cookie']
    assert.ok(typeof cookie === 'string' && cookie.includes('__Host-coffee_session') && cookie.includes('Secure') && cookie.includes('HttpOnly'))
  } finally { await production.close() }
})
