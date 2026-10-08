import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

/** OWASP's 32 MiB scrypt setting, with three passes and a unique salt per password. */
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)
  return `scrypt-32768-8-3:${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt-32768-8-3' || !/^[a-f0-9]{32}$/.test(parts[1]!) || !/^[a-f0-9]{128}$/.test(parts[2]!)) {
    throw new Error('The stored password hash is malformed. Restore the account record from a trusted backup.')
  }
  const key = await deriveKey(password, Buffer.from(parts[1]!, 'hex'))
  return timingSafeEqual(key, Buffer.from(parts[2]!, 'hex'))
}
