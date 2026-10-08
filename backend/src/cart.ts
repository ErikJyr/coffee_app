import type { Static } from '@sinclair/typebox'
import { type Connection, selectAll } from './database.js'
import { getUser } from './accounts.js'
import { getProduct, publicProduct } from './products.js'
import { CartRow, Quote, type CoffeeSize, type CheckoutData } from './models.js'
import { httpError } from './errors.js'

/** Quotes use current database prices, never prices supplied by the browser. */
export function quoteCart(db: Connection, userId: string, selection: Pick<CheckoutData, 'deliveryMode' | 'discountApplied'>): Static<typeof Quote> {
  const user = getUser(db, userId)
  const items = selectAll(db, CartRow, 'SELECT product_id,size,quantity FROM cart_items WHERE user_id = ? ORDER BY product_id,size', [userId])
    .map((item) => {
      const product = publicProduct(getProduct(db, item.product_id))
      return { product, size: item.size, quantity: item.quantity, unitPriceCents: product.prices[item.size], lineTotalCents: product.prices[item.size] * item.quantity }
    })
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0)
  const deliveryFeeCents = items.length > 0 && selection.deliveryMode === 'Deliver' ? 100 : 0
  const discountCents = items.length > 0 && selection.discountApplied ? 50 : 0
  return { version: user.cart_version, items, currency: 'EUR', subtotalCents, deliveryFeeCents, discountCents, totalCents: subtotalCents + deliveryFeeCents - discountCents }
}

export function setCartItem(db: Connection, userId: string, productId: string, size: CoffeeSize, quantity: number): void {
  db.transaction(() => {
    if (getProduct(db, productId).available !== 1) throw httpError(409, 'COFFEE_UNAVAILABLE', `Coffee ${productId} is currently unavailable.`)
    const current = selectAll(db, CartRow, 'SELECT product_id,size,quantity FROM cart_items WHERE user_id = ?', [userId])
    const count = current.filter((item) => item.product_id !== productId || item.size !== size).reduce((sum, item) => sum + item.quantity, 0) + quantity
    if (count > 100) throw httpError(400, 'CART_LIMIT', 'A basket can contain at most 100 coffees, with at most 20 of each size.')
    db.prepare(`INSERT INTO cart_items (user_id,product_id,size,quantity) VALUES (?,?,?,?)
      ON CONFLICT (user_id,product_id,size) DO UPDATE SET quantity = excluded.quantity`).run(userId, productId, size, quantity)
    db.prepare('UPDATE users SET cart_version = cart_version + 1 WHERE id = ?').run(userId)
  }).immediate()
}

export function removeCartItem(db: Connection, userId: string, productId: string, size: CoffeeSize): void {
  db.transaction(() => {
    const result = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?').run(userId, productId, size)
    if (result.changes > 0) db.prepare('UPDATE users SET cart_version = cart_version + 1 WHERE id = ?').run(userId)
  }).immediate()
}
