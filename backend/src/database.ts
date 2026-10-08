import Database from 'better-sqlite3'
import { chmodSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import type { Static, TSchema } from '@sinclair/typebox'
import { catalog } from './catalog.js'

export type Connection = Database.Database
export type SqlValue = string | number | bigint | Buffer | null
export type SqlRow = Record<string, SqlValue>

/** Validate records read from SQLite before using them as domain objects. */
export function readRow<T extends TSchema>(schema: T, row: SqlRow): Static<T> {
  if (!Value.Check(schema, row)) {
    const error = Value.Errors(schema, row).First()
    throw new Error(`Database record failed validation at ${error?.path}: ${error?.message}`)
  }
  return row
}

/** Prepared statements are the only path for dynamic values in database queries. */
export function selectOne<T extends TSchema>(db: Connection, schema: T, sql: string, parameters: SqlValue[]): Static<T> | undefined {
  const row = db.prepare<SqlValue[], SqlRow>(sql).get(...parameters)
  return row ? readRow(schema, row) : undefined
}

export function selectAll<T extends TSchema>(db: Connection, schema: T, sql: string, parameters: SqlValue[]): Static<T>[] {
  return db.prepare<SqlValue[], SqlRow>(sql).all(...parameters).map((row) => readRow(schema, row))
}

/** Create a private, durable SQLite database for a single backend instance. */
export function openDatabase(databasePath: string): Connection {
  const path = resolve(databasePath)
  const directory = dirname(path)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  if ((statSync(directory).mode & 0o077) !== 0) {
    throw new Error(`Database directory ${directory} must have private permissions. Run chmod 700 on that directory.`)
  }
  const db = new Database(path)
  chmodSync(path, 0o600)
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = FULL')
  db.pragma('busy_timeout = 5000')
  const version = db.pragma('user_version', { simple: true })
  if (version !== 0 && version !== 1) {
    db.close()
    throw new Error(`Unsupported database schema version ${String(version)}; expected 0 or 1.`)
  }
  if (version === 0) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
          password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('customer','admin')),
          delivery_address TEXT, delivery_note TEXT NOT NULL DEFAULT '',
          cart_version INTEGER NOT NULL DEFAULT 0 CHECK (cart_version >= 0), created_at INTEGER NOT NULL
        ) STRICT;
        CREATE TABLE sessions (
          token_hash TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        ) STRICT;
        CREATE INDEX sessions_user ON sessions(user_id);
        CREATE INDEX sessions_expiry ON sessions(expires_at);
        CREATE TABLE products (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, type TEXT NOT NULL,
          category TEXT NOT NULL, image_key TEXT NOT NULL,
          price_s INTEGER NOT NULL CHECK (price_s BETWEEN 1 AND 10000),
          price_m INTEGER NOT NULL CHECK (price_m BETWEEN 1 AND 10000),
          price_l INTEGER NOT NULL CHECK (price_l BETWEEN 1 AND 10000),
          available INTEGER NOT NULL CHECK (available IN (0,1))
        ) STRICT;
        CREATE TABLE favorites (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, product_id)
        ) STRICT;
        CREATE TABLE cart_items (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL REFERENCES products(id),
          size TEXT NOT NULL CHECK (size IN ('S','M','L')),
          quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
          PRIMARY KEY (user_id, product_id, size)
        ) STRICT;
        CREATE TABLE orders (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
          status TEXT NOT NULL CHECK (status IN ('queued','preparing','out_for_delivery','delivered','ready_for_pickup','collected','cancelled')),
          delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('Deliver','Pick Up')),
          payment_method TEXT NOT NULL CHECK (payment_method = 'Cash'),
          payment_status TEXT NOT NULL CHECK (payment_status IN ('pending','paid')),
          delivery_address TEXT, note TEXT NOT NULL,
          subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
          delivery_fee_cents INTEGER NOT NULL CHECK (delivery_fee_cents >= 0),
          discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0),
          total_cents INTEGER NOT NULL CHECK (total_cents = subtotal_cents + delivery_fee_cents - discount_cents AND total_cents >= 0),
          created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
          idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL,
          UNIQUE (user_id, idempotency_key)
        ) STRICT;
        CREATE INDEX orders_user_created ON orders(user_id, created_at DESC);
        CREATE INDEX orders_status_created ON orders(status, created_at DESC);
        CREATE TABLE order_items (
          order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL,
          name TEXT NOT NULL, size TEXT NOT NULL CHECK (size IN ('S','M','L')),
          quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
          unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
          PRIMARY KEY (order_id, product_id, size)
        ) STRICT;
        PRAGMA user_version = 1;
      `)
      const insert = db.prepare(`INSERT INTO products (id,name,description,type,category,image_key,price_s,price_m,price_l,available)
        VALUES (@id,@name,@description,@type,@category,@imageKey,@priceCents,@priceCents,@priceCents,1)`)
      catalog.forEach((product) => insert.run(product))
    }).immediate()
  }
  return db
}
