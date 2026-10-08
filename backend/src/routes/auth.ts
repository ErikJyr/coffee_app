import { Type } from '@sinclair/typebox'
import { type Api, errorResponses, cookieSecurity, csrfSecurity } from '../api.js'
import type { Config } from '../config.js'
import type { Connection } from '../database.js'
import { AccountInput, LoginInput, AuthResponse, User, ProfileInput, PasswordInput } from '../models.js'
import { createAccount, getUserByEmail, getUser, publicUser } from '../accounts.js'
import { authenticate, startSession, clearSessionCookie } from '../sessions.js'
import { hashPassword, verifyPassword } from '../passwords.js'
import { httpError } from '../errors.js'

const authLimit = { max: 5, timeWindow: 60000 }
const emptyBody = Type.Object({}, { additionalProperties: false })

export function registerAuthRoutes(app: Api, db: Connection, config: Config, dummyHash: string): void {
  app.post('/api/auth/register', {
    config: { rateLimit: authLimit },
    schema: { tags: ['Accounts'], summary: 'Create a customer account and session', body: AccountInput, response: { 201: AuthResponse, ...errorResponses } },
  }, async (request, reply) => {
    const passwordHash = await hashPassword(request.body.password)
    const result = db.transaction(() => {
      const user = createAccount(db, request.body, passwordHash, 'customer')
      const csrfToken = startSession(db, config, user.id, request, reply)
      return { user: publicUser(user), csrfToken }
    }).immediate()
    return reply.code(201).send(result)
  })

  app.post('/api/auth/login', {
    config: { rateLimit: authLimit },
    schema: { tags: ['Accounts'], summary: 'Sign in with an opaque cookie session', body: LoginInput, response: { 200: AuthResponse, ...errorResponses } },
  }, async (request, reply) => {
    const user = getUserByEmail(db, request.body.email)
    const valid = await verifyPassword(request.body.password, user ? user.password_hash : dummyHash)
    if (!user || !valid) throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    const current = getUser(db, user.id)
    if (current.password_hash !== user.password_hash) throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    return { user: publicUser(current), csrfToken: startSession(db, config, current.id, request, reply) }
  })

  app.get('/api/auth/me', {
    schema: { tags: ['Accounts'], summary: 'Get the current profile and CSRF token', security: cookieSecurity, response: { 200: AuthResponse, ...errorResponses } },
  }, (request) => {
    const authentication = authenticate(db, config, request)
    return { user: publicUser(authentication.user), csrfToken: authentication.session.csrf_token }
  })

  app.post('/api/auth/logout', {
    schema: { tags: ['Accounts'], summary: 'Revoke the current session', security: csrfSecurity, body: emptyBody, response: { 204: Type.Null(), ...errorResponses } },
  }, (request, reply) => {
    const authentication = authenticate(db, config, request)
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(authentication.session.token_hash)
    clearSessionCookie(config, reply)
    reply.code(204).send(null)
  })

  app.patch('/api/profile', {
    schema: { tags: ['Accounts'], summary: 'Save name, delivery address, and note', security: csrfSecurity, body: ProfileInput, response: { 200: User, ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    db.prepare('UPDATE users SET name = ?, delivery_address = ?, delivery_note = ? WHERE id = ?')
      .run(request.body.name.trim(), request.body.deliveryAddress?.trim() ?? null, request.body.deliveryNote.trim(), user.id)
    return publicUser(getUser(db, user.id))
  })

  app.post('/api/auth/password', {
    config: { rateLimit: authLimit },
    schema: { tags: ['Accounts'], summary: 'Change password and revoke every session', security: csrfSecurity, body: PasswordInput, response: { 204: Type.Null(), ...errorResponses } },
  }, async (request, reply) => {
    const { user } = authenticate(db, config, request)
    if (!await verifyPassword(request.body.currentPassword, user.password_hash)) throw httpError(401, 'INVALID_CREDENTIALS', 'The current password is incorrect.')
    const nextHash = await hashPassword(request.body.newPassword)
    db.transaction(() => {
      authenticate(db, config, request)
      const result = db.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?').run(nextHash, user.id, user.password_hash)
      if (result.changes !== 1) throw httpError(409, 'PASSWORD_CHANGED', 'The password changed during this request. Sign in again.')
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
    }).immediate()
    clearSessionCookie(config, reply)
    reply.code(204).send(null)
  })
}
