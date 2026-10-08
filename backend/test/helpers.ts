import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { Value } from '@sinclair/typebox/value'
import type { Static, TSchema } from '@sinclair/typebox'
import { buildApp } from '../src/app.js'
import type { Api } from '../src/api.js'
import type { Config } from '../src/config.js'
import { AuthResponse, Quote, type AccountData, type CheckoutData, type JsonValue } from '../src/models.js'

export const testPassword = 'test-only-long-passphrase-42'
export type Client = { cookie: string; csrfToken: string; userId: string }
type Response = { statusCode: number; body: string }

export function responseModel<T extends TSchema>(response: Response, schema: T): Static<T> {
  const value: JsonValue = JSON.parse(response.body)
  if (!Value.Check(schema, value)) throw new Error(`Response does not match its schema: ${response.body}`)
  return value
}

export async function fixture(context: TestContext): Promise<{ app: Api; config: Config }> {
  const directory = mkdtempSync(join(tmpdir(), 'coffee-backend-'))
  const config: Config = { environment: 'test', host: '127.0.0.1', port: 3001, appOrigin: 'http://localhost:5173', databasePath: join(directory, 'coffee.sqlite') }
  const app = await buildApp(config)
  context.after(async () => { await app.close(); rmSync(directory, { recursive: true, force: true }) })
  return { app, config }
}

export function headers(client: Client): Record<string, string> {
  return { cookie: client.cookie, origin: 'http://localhost:5173', 'x-csrf-token': client.csrfToken }
}

export async function registerCustomer(app: Api, account: AccountData): Promise<Client> {
  const response = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin: 'http://localhost:5173' }, payload: account })
  assert.equal(response.statusCode, 201, response.body)
  const result = responseModel(response, AuthResponse)
  const cookie = response.cookies.find((item) => item.name === 'coffee_session')
  assert.ok(cookie)
  return { cookie: `${cookie.name}=${cookie.value}`, csrfToken: result.csrfToken, userId: result.user.id }
}

export async function addCoffee(app: Api, client: Client, productId: string): Promise<void> {
  const response = await app.inject({ method: 'PUT', url: `/api/cart/items/${productId}/M`, headers: headers(client), payload: { quantity: 1, unitPriceCents: 1 } })
  assert.equal(response.statusCode, 204, response.body)
}

export async function getQuote(app: Api, client: Client): Promise<Static<typeof Quote>> {
  const response = await app.inject({ method: 'GET', url: '/api/cart?deliveryMode=Deliver&discountApplied=true', headers: headers(client) })
  assert.equal(response.statusCode, 200, response.body)
  return responseModel(response, Quote)
}

export function checkoutInput(version: number): CheckoutData {
  return { cartVersion: version, deliveryMode: 'Deliver', paymentMethod: 'Cash', deliveryAddress: 'Demo street, Kuressaare', note: 'Test delivery', discountApplied: true }
}
