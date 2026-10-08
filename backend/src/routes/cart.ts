import { Type } from '@sinclair/typebox'
import { type Api, errorResponses, cookieSecurity, csrfSecurity } from '../api.js'
import type { Config } from '../config.js'
import type { Connection } from '../database.js'
import { ProductId, Size, DeliveryMode, Quote } from '../models.js'
import { authenticate } from '../sessions.js'
import { quoteCart, setCartItem, removeCartItem } from '../cart.js'

export function registerCartRoutes(app: Api, db: Connection, config: Config): void {
  app.get('/api/cart', {
    schema: {
      tags: ['Basket'], summary: 'Quote the basket; pass deliveryMode and discountApplied explicitly', security: cookieSecurity,
      querystring: Type.Object({ deliveryMode: DeliveryMode, discountApplied: Type.Union([Type.Literal('true'), Type.Literal('false')]) }, { additionalProperties: false }),
      response: { 200: Quote, ...errorResponses },
    },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    return quoteCart(db, user.id, { deliveryMode: request.query.deliveryMode, discountApplied: request.query.discountApplied === 'true' })
  })

  app.put('/api/cart/items/:productId/:size', {
    schema: {
      tags: ['Basket'], summary: 'Set an item quantity; client price fields are ignored', security: csrfSecurity,
      params: Type.Object({ productId: ProductId, size: Size }, { additionalProperties: false }),
      body: Type.Object({ quantity: Type.Integer({ minimum: 1, maximum: 20 }) }, { additionalProperties: false }),
      response: { 204: Type.Null(), ...errorResponses },
    },
  }, (request, reply) => {
    const { user } = authenticate(db, config, request)
    setCartItem(db, user.id, request.params.productId, request.params.size, request.body.quantity)
    reply.code(204).send(null)
  })

  app.delete('/api/cart/items/:productId/:size', {
    schema: {
      tags: ['Basket'], security: csrfSecurity,
      params: Type.Object({ productId: ProductId, size: Size }, { additionalProperties: false }),
      response: { 204: Type.Null(), ...errorResponses },
    },
  }, (request, reply) => {
    const { user } = authenticate(db, config, request)
    removeCartItem(db, user.id, request.params.productId, request.params.size)
    reply.code(204).send(null)
  })
}
