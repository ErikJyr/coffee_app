import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Static } from '@sinclair/typebox'
import type { Config } from './config.js'
import { type Connection, selectOne } from './database.js'
import { getUser } from './accounts.js'
import { SessionRow, type UserRecord } from './models.js'
import { httpError } from './errors.js'

const lifetime = 7 * 24 * 60 * 60 * 1000
type Session = Static<typeof SessionRow>
export type Authentication = { user: UserRecord; session: Session }

function cookieName(config: Config): string {
  return config.environment === 'production' ? '__Host-coffee_session' : 'coffee_session'
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Rotate opaque session tokens; SQLite stores only their hashes. */
export function startSession(db: Connection, config: Config, userId: string, request: FastifyRequest, reply: FastifyReply): string {
  const token = randomBytes(32).toString('base64url')
  const csrfToken = randomBytes(32).toString('base64url')
  const now = Date.now()
  db.transaction(() => {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
    const previous = request.cookies[cookieName(config)]
    if (previous) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(previous))
    db.prepare(`DELETE FROM sessions WHERE user_id = ? AND token_hash NOT IN
      (SELECT token_hash FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 4)`).run(userId, userId)
    db.prepare('INSERT INTO sessions (token_hash,csrf_token,user_id,expires_at) VALUES (?,?,?,?)')
      .run(hashToken(token), csrfToken, userId, now + lifetime)
  }).immediate()
  reply.setCookie(cookieName(config), token, {
    path: '/', httpOnly: true, secure: config.environment === 'production', sameSite: 'strict', maxAge: lifetime / 1000,
  })
  return csrfToken
}

/** Require a live account-owned session and a CSRF token for every authenticated write. */
export function authenticate(db: Connection, config: Config, request: FastifyRequest): Authentication {
  const token = request.cookies[cookieName(config)]
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw httpError(401, 'AUTH_REQUIRED', 'Sign in to access this resource.')
  }
  const session = selectOne(db, SessionRow, 'SELECT * FROM sessions WHERE token_hash = ?', [hashToken(token)])
  if (!session || session.expires_at <= Date.now()) {
    throw httpError(401, 'SESSION_EXPIRED', 'Your session has expired or been revoked. Sign in again.')
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrf = request.headers['x-csrf-token']
    if (typeof csrf !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(csrf) || !timingSafeEqual(Buffer.from(csrf), Buffer.from(session.csrf_token))) {
      throw httpError(403, 'CSRF_REJECTED', 'Send the X-CSRF-Token from your sign-in response or GET /api/auth/me.')
    }
  }
  return { user: getUser(db, session.user_id), session }
}

export function requireAdmin(authentication: Authentication): void {
  if (authentication.user.role !== 'admin') throw httpError(403, 'STAFF_REQUIRED', 'This action requires a staff account.')
}

export function clearSessionCookie(config: Config, reply: FastifyReply): void {
  reply.clearCookie(cookieName(config), { path: '/', httpOnly: true, secure: config.environment === 'production', sameSite: 'strict' })
}
