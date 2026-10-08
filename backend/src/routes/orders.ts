import { Type } from '@sinclair/typebox'
import { type Api, errorResponses, cookieSecurity, csrfSecurity } from '../api.js'
import type { Config } from '../config.js'
import { type Connection, selectAll } from '../database.js'
import { CheckoutInput, Order, OrderRow, OrderParams, Pagination, OrderStatus } from '../models.js'
import { authenticate, requireAdmin } from '../sessions.js'
import { checkout, getOrder, publicOrder, cancelOrder, advanceOrder, recordCashPayment } from '../orders.js'
import { demoTracking, Tracking } from '../tracking.js'
import { httpError } from '../errors.js'

export function registerOrderRoutes(app: Api, db: Connection, config: Config): void {
  app.post('/api/orders', {
    config: { rateLimit: { max: 10, timeWindow: 60000 } },
    schema: {
      tags: ['Orders'], summary: 'Checkout the saved basket atomically with idempotency protection', security: csrfSecurity,
      headers: Type.Object({ 'idempotency-key': Type.String({ minLength: 16, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' }) }),
      body: CheckoutInput, response: { 200: Order, 201: Order, ...errorResponses },
    },
  }, (request, reply) => {
    const { user } = authenticate(db, config, request)
    const result = checkout(db, user.id, request.body, request.headers['idempotency-key'])
    reply.code(result.created ? 201 : 200).send(result.order)
  })

  app.get('/api/orders', {
    schema: { tags: ['Orders'], security: cookieSecurity, querystring: Pagination, response: { 200: Type.Array(Order), ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    return selectAll(db, OrderRow, 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC,id LIMIT ? OFFSET ?',
      [user.id, Number(request.query.limit), Number(request.query.offset)]).map((order) => publicOrder(db, order))
  })

  app.get('/api/orders/:orderId', {
    schema: { tags: ['Orders'], security: cookieSecurity, params: OrderParams, response: { 200: Order, ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    return publicOrder(db, getOrder(db, request.params.orderId, user.id))
  })

  app.post('/api/orders/:orderId/cancel', {
    schema: { tags: ['Orders'], security: csrfSecurity, params: OrderParams, body: Type.Object({}, { additionalProperties: false }), response: { 200: Order, ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    return cancelOrder(db, request.params.orderId, user.id)
  })

  app.get('/api/orders/:orderId/tracking', {
    schema: { tags: ['Orders'], summary: 'Get explicitly simulated courier movement; never marks an order delivered', security: cookieSecurity, params: OrderParams, response: { 200: Tracking, ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    const order = getOrder(db, request.params.orderId, user.id)
    if (order.delivery_mode !== 'Deliver' || order.status === 'cancelled') {
      throw httpError(409, 'TRACKING_UNAVAILABLE', 'Demo tracking is available only for delivery orders that have not been cancelled.')
    }
    return demoTracking(order.created_at, Date.now())
  })

  app.get('/api/admin/orders', {
    schema: { tags: ['Staff'], security: cookieSecurity, querystring: Pagination, response: { 200: Type.Array(Order), ...errorResponses } },
  }, (request) => {
    requireAdmin(authenticate(db, config, request))
    return selectAll(db, OrderRow, 'SELECT * FROM orders ORDER BY created_at DESC,id LIMIT ? OFFSET ?',
      [Number(request.query.limit), Number(request.query.offset)]).map((order) => publicOrder(db, order))
  })

  app.patch('/api/admin/orders/:orderId/status', {
    schema: {
      tags: ['Staff'], summary: 'Advance a delivery or pickup order through its legal states', security: csrfSecurity,
      params: OrderParams, body: Type.Object({ status: OrderStatus }, { additionalProperties: false }),
      response: { 200: Order, ...errorResponses },
    },
  }, (request) => {
    requireAdmin(authenticate(db, config, request))
    return advanceOrder(db, request.params.orderId, request.body.status)
  })

  app.post('/api/admin/orders/:orderId/cash-payment', {
    schema: { tags: ['Staff'], summary: 'Record cash collected after handover; customers cannot mark payments paid', security: csrfSecurity, params: OrderParams, body: Type.Object({}, { additionalProperties: false }), response: { 200: Order, ...errorResponses } },
  }, (request) => {
    requireAdmin(authenticate(db, config, request))
    return recordCashPayment(db, request.params.orderId)
  })
}
