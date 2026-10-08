import { randomUUID } from 'node:crypto'
import type { Static } from '@sinclair/typebox'
import { type Connection, selectOne } from './database.js'
import { User, UserRow, type AccountData, type UserRecord } from './models.js'
import { httpError } from './errors.js'

export function getUser(db: Connection, userId: string): UserRecord {
  const user = selectOne(db, UserRow, 'SELECT * FROM users WHERE id = ?', [userId])
  if (!user) throw httpError(401, 'AUTH_REQUIRED', 'The account no longer exists. Sign in again.')
  return user
}

export function getUserByEmail(db: Connection, email: string): UserRecord | undefined {
  return selectOne(db, UserRow, 'SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
}

export function publicUser(user: UserRecord): Static<typeof User> {
  return { id: user.id, email: user.email, name: user.name, role: user.role, deliveryAddress: user.delivery_address, deliveryNote: user.delivery_note }
}

/** Role is supplied by trusted server code, never by the registration request. */
export function createAccount(db: Connection, account: AccountData, passwordHash: string, role: UserRecord['role']): UserRecord {
  return db.transaction(() => {
    if (getUserByEmail(db, account.email)) {
      throw httpError(409, 'ACCOUNT_CONFLICT', 'An account cannot be created with these details. Sign in or use another email.')
    }
    const id = randomUUID()
    db.prepare('INSERT INTO users (id,email,name,password_hash,role,created_at) VALUES (?,?,?,?,?,?)')
      .run(id, account.email.trim().toLowerCase(), account.name.trim(), passwordHash, role, Date.now())
    return getUser(db, id)
  }).immediate()
}
