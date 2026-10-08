import { createHash, randomUUID } from 'node:crypto'
import type { Static } from '@sinclair/typebox'
import { type Connection, selectOne, selectAll } from './database.js'
import { quoteCart } from './cart.js'
import { httpError } from './errors.js'
import { Order, OrderRow, OrderItemRow, type CheckoutData, type OrderRecord, type OrderState } from './models.js'

export function getOrder(db: Connection, orderId: string, userId: string): OrderRecord {
  const order = selectOne(db, OrderRow, 'SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId])
  if (!order) throw httpError(404, 'ORDER_NOT_FOUND', 'This order does not exist or does not belong to your account.')
  return order
}

export function publicOrder(db: Connection, order: OrderRecord): Static<typeof Order> {
  const items = selectAll(db, OrderItemRow, 'SELECT product_id,name,size,quantity,unit_price_cents FROM order_items WHERE order_id = ? ORDER BY product_id,size', [order.id])
  return {
    id: order.id, status: order.status, deliveryMode: order.delivery_mode, paymentMethod: order.payment_method,
    paymentStatus: order.payment_status, deliveryAddress: order.delivery_address, note: order.note, currency: 'EUR',
    subtotalCents: order.subtotal_cents, deliveryFeeCents: order.delivery_fee_cents, discountCents: order.discount_cents,
    totalCents: order.total_cents, createdAt: order.created_at, updatedAt: order.updated_at,
    items: items.map((item) => ({ productId: item.product_id, name: item.name, size: item.size, quantity: item.quantity, unitPriceCents: item.unit_price_cents })),
  }
}

/** One transaction snapshots prices, creates the order, and clears the basket. */
export function checkout(db: Connection, userId: string, input: CheckoutData, idempotencyKey: string): { order: Static<typeof Order>; created: boolean } {
  const requestHash = createHash('sha256').update(JSON.stringify({
    cartVersion: input.cartVersion, deliveryMode: input.deliveryMode, paymentMethod: input.paymentMethod,
    deliveryAddress: input.deliveryAddress, note: input.note, discountApplied: input.discountApplied,
  })).digest('hex')
  return db.transaction(() => {
    const previous = selectOne(db, OrderRow, 'SELECT * FROM orders WHERE user_id = ? AND idempotency_key = ?', [userId, idempotencyKey])
    if (previous) {
      if (previous.request_hash !== requestHash) throw httpError(409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used for a different checkout request. Use a new key.')
      return { order: publicOrder(db, previous), created: false }
    }
    if (input.paymentMethod !== 'Cash') {
      throw httpError(409, 'PAYMENT_NOT_CONFIGURED', 'Wallet checkout requires a payment provider. Choose Cash; this API never simulates successful payment.')
    }
    if (input.deliveryMode === 'Deliver' && !input.deliveryAddress?.trim()) {
      throw httpError(400, 'ADDRESS_REQUIRED', 'A non-empty delivery address is required for delivery orders.')
    }
    const quote = quoteCart(db, userId, input)
    if (quote.version !== input.cartVersion) throw httpError(409, 'CART_CHANGED', 'Your basket changed. Fetch GET /api/cart with your delivery options and review the new quote before checking out.')
    if (quote.items.length === 0) throw httpError(400, 'CART_EMPTY', 'Add a coffee to your basket before checking out.')
    const unavailable = quote.items.find((item) => !item.product.available)
    if (unavailable) throw httpError(409, 'COFFEE_UNAVAILABLE', `Coffee ${unavailable.product.name} is no longer available. Remove it from your basket.`)
    const id = randomUUID()
    const now = Date.now()
    db.prepare(`INSERT INTO orders (id,user_id,status,delivery_mode,payment_method,payment_status,delivery_address,note,
      subtotal_cents,delivery_fee_cents,discount_cents,total_cents,created_at,updated_at,idempotency_key,request_hash)
      VALUES (?,?,'queued',?,'Cash','pending',?,?,?,?,?,?,?,?,?,?)`)
      .run(id, userId, input.deliveryMode, input.deliveryMode === 'Deliver' ? input.deliveryAddress!.trim() : null,
        input.note.trim(), quote.subtotalCents, quote.deliveryFeeCents, quote.discountCents, quote.totalCents, now, now, idempotencyKey, requestHash)
    const insert = db.prepare('INSERT INTO order_items (order_id,product_id,name,size,quantity,unit_price_cents) VALUES (?,?,?,?,?,?)')
    quote.items.forEach((item) => insert.run(id, item.product.id, item.product.name, item.size, item.quantity, item.unitPriceCents))
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId)
    db.prepare('UPDATE users SET cart_version = cart_version + 1 WHERE id = ?').run(userId)
    return { order: publicOrder(db, getOrder(db, id, userId)), created: true }
  }).immediate()
}

/** Staff can advance an order only along the delivery or pickup workflow. */
export function advanceOrder(db: Connection, orderId: string, nextStatus: OrderState): Static<typeof Order> {
  return db.transaction(() => {
    const order = selectOne(db, OrderRow, 'SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) throw httpError(404, 'ORDER_NOT_FOUND', 'This order does not exist.')
    const transitions: Record<OrderState, readonly OrderState[]> = {
      queued: ['preparing', 'cancelled'],
      preparing: order.delivery_mode === 'Deliver' ? ['out_for_delivery', 'cancelled'] : ['ready_for_pickup', 'cancelled'],
      out_for_delivery: ['delivered'], ready_for_pickup: ['collected'],
      delivered: [], collected: [], cancelled: [],
    }
    if (!transitions[order.status].includes(nextStatus)) {
      throw httpError(409, 'ORDER_TRANSITION_REJECTED', `Cannot change a ${order.delivery_mode} order from ${order.status} to ${nextStatus}.`)
    }
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, Date.now(), orderId)
    return publicOrder(db, getOrder(db, orderId, order.user_id))
  }).immediate()
}

export function cancelOrder(db: Connection, orderId: string, userId: string): Static<typeof Order> {
  return db.transaction(() => {
    const order = getOrder(db, orderId, userId)
    if (order.status !== 'queued') throw httpError(409, 'ORDER_CANNOT_CANCEL', 'You can cancel only before staff begin preparing the order.')
    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(Date.now(), orderId)
    return publicOrder(db, getOrder(db, orderId, userId))
  }).immediate()
}

/** Staff record cash collection only after the order has been handed over. */
export function recordCashPayment(db: Connection, orderId: string): Static<typeof Order> {
  return db.transaction(() => {
    const order = selectOne(db, OrderRow, 'SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) throw httpError(404, 'ORDER_NOT_FOUND', 'This order does not exist.')
    if (!['delivered', 'collected'].includes(order.status)) {
      throw httpError(409, 'PAYMENT_STATE_REJECTED', 'Cash collection can be recorded only after delivery or pickup handover.')
    }
    db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = ? WHERE id = ?").run(Date.now(), orderId)
    return publicOrder(db, getOrder(db, orderId, order.user_id))
  }).immediate()
}
