/**
 * Bootstrap staff locally: pipe a JSON object containing email, password, and name
 * to npm run create-admin from backend/. Use a private input file or a secret manager;
 * never place passwords in command arguments or source control. No HTTP endpoint
 * allows customers to choose or elevate their role.
 */
import { readFileSync } from 'node:fs'
import { Value } from '@sinclair/typebox/value'
import { AccountInput, type JsonValue } from './models.js'
import { loadConfig } from './config.js'
import { openDatabase } from './database.js'
import { hashPassword } from './passwords.js'
import { createAccount, publicUser } from './accounts.js'

const input: JsonValue = JSON.parse(readFileSync(0, 'utf8'))
if (!Value.Check(AccountInput, input)) {
  const error = Value.Errors(AccountInput, input).First()
  throw new Error(`Invalid staff account input: ${error?.path} ${error?.message}`)
}
const config = loadConfig(process.env)
const passwordHash = await hashPassword(input.password)
const db = openDatabase(config.databasePath)
try {
  const user = createAccount(db, input, passwordHash, 'admin')
  process.stdout.write(`${JSON.stringify(publicUser(user))}\n`)
} finally {
  db.close()
}
