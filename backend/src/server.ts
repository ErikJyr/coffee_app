/**
 * Run from backend/: npm ci; cp .env.example .env; npm run build; npm start.
 * API schemas: GET /api/openapi.json. No Vue integration is enabled by this server.
 * Writes require Origin: APP_ORIGIN, JSON bodies, and (after sign-in) X-CSRF-Token.
 * Checkout additionally requires a unique Idempotency-Key and the latest cartVersion.
 * Production: use NODE_ENV=production, an HTTPS APP_ORIGIN, and a same-site HTTPS
 * reverse proxy. Bind this process privately; forwarded IP headers are not trusted.
 * SQLite and in-memory rate limits support one instance. Protect/back up data/ and
 * use encrypted persistent storage; take online backups through SQLite's backup API.
 * Email verification/reset and wallet payments require external providers and are
 * intentionally not represented as available or successful.
 */
import { buildApp } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig(process.env)
const app = await buildApp(config)
process.once('SIGTERM', () => { void app.close() })
process.once('SIGINT', () => { void app.close() })
await app.listen({ host: config.host, port: config.port })
