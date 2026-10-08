import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import { Type } from '@sinclair/typebox'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { randomBytes } from 'node:crypto'
import type { Config } from './config.js'
import type { Api } from './api.js'
import { openDatabase } from './database.js'
import { hashPassword } from './passwords.js'
import { httpError } from './errors.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerCatalogRoutes } from './routes/catalog.js'
import { registerCartRoutes } from './routes/cart.js'
import { registerOrderRoutes } from './routes/orders.js'

/** Single-instance API: private SQLite storage, exact CORS, CSRF, bounded requests, and revocable sessions. */
export async function buildApp(config: Config): Promise<Api> {
  const app = Fastify({
    logger: config.environment === 'test' ? false : {
      level: 'info',
      redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]', 'res.headers["set-cookie"]'],
    },
    trustProxy: false, bodyLimit: 16 * 1024, requestTimeout: 10000, connectionTimeout: 10000,
    ajv: { customOptions: { coerceTypes: false, useDefaults: false, removeAdditional: true } },
    return503OnClosing: true,
  }).withTypeProvider<TypeBoxTypeProvider>()
  const db = openDatabase(config.databasePath)
  app.addHook('onClose', () => { db.close() })

  await app.register(cookie)
  await app.register(cors, {
    origin: config.appOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Idempotency-Key'],
  })
  await app.register(helmet)
  await app.register(rateLimit, { max: 120, timeWindow: 60000, skipOnError: false })
  await app.register(swagger, {
    openapi: {
      info: { title: 'Coffee Corner API', version: '1.0.0', description: 'Customer accounts, persistent baskets, cash orders, staff workflows, and explicitly simulated courier tracking. All money fields are euro cents.' },
      components: { securitySchemes: {
        session: { type: 'apiKey', in: 'cookie', name: config.environment === 'production' ? '__Host-coffee_session' : 'coffee_session' },
        csrf: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token', description: 'Required with session cookies on authenticated writes; obtained from sign-in or GET /api/auth/me.' },
      } },
    },
  })

  app.addHook('onRequest', async (request) => {
    const origin = request.headers.origin
    if (origin !== undefined && origin !== config.appOrigin) {
      throw httpError(403, 'ORIGIN_REJECTED', 'This request origin is not allowed by APP_ORIGIN.')
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (origin !== config.appOrigin) throw httpError(403, 'ORIGIN_REQUIRED', 'State-changing requests must send the configured APP_ORIGIN in the Origin header.')
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && !/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')) {
        throw httpError(415, 'JSON_REQUIRED', 'Send Content-Type: application/json and a JSON request body; send {} for actions without fields.')
      }
    }
  })
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store')
    return payload
  })
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500
    if (statusCode === 500) request.log.error({ err: error, route: request.routeOptions.url }, 'Backend request failed')
    const message = statusCode === 500 ? 'The server could not complete this request. Contact support with the requestId.' : error.message
    reply.code(statusCode).send({ code: statusCode === 500 ? 'INTERNAL_ERROR' : error.code ?? 'REQUEST_REJECTED', message, requestId: request.id })
  })
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ code: 'ROUTE_NOT_FOUND', message: 'This API route does not exist. See GET /api/openapi.json.', requestId: request.id })
  })

  app.get('/api/health', { schema: { response: { 200: Type.Object({ status: Type.Literal('ok') }) } } }, () => {
    db.prepare('SELECT 1').get()
    return { status: 'ok' as const }
  })
  app.get('/api/openapi.json', { schema: { hide: true } }, () => app.swagger())
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'))
  registerAuthRoutes(app, db, config, dummyHash)
  registerCatalogRoutes(app, db, config)
  registerCartRoutes(app, db, config)
  registerOrderRoutes(app, db, config)
  await app.ready()
  return app
}
