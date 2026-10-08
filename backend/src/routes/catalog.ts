import { Type } from '@sinclair/typebox'
import { type Api, errorResponses, cookieSecurity, csrfSecurity } from '../api.js'
import type { Config } from '../config.js'
import { type Connection, selectAll } from '../database.js'
import { Product, ProductRow, ProductParams, ProductUpdate } from '../models.js'
import { getProduct, publicProduct, listProducts } from '../products.js'
import { authenticate, requireAdmin } from '../sessions.js'

export function registerCatalogRoutes(app: Api, db: Connection, config: Config): void {
  app.get('/api/products', {
    schema: { tags: ['Catalog'], summary: 'List coffees with server-owned prices in euro cents', response: { 200: Type.Array(Product), ...errorResponses } },
  }, () => listProducts(db))

  app.get('/api/products/:productId', {
    schema: { tags: ['Catalog'], params: ProductParams, response: { 200: Product, ...errorResponses } },
  }, (request) => publicProduct(getProduct(db, request.params.productId)))

  app.get('/api/favorites', {
    schema: { tags: ['Favorites'], security: cookieSecurity, response: { 200: Type.Array(Product), ...errorResponses } },
  }, (request) => {
    const { user } = authenticate(db, config, request)
    return selectAll(db, ProductRow, 'SELECT p.* FROM products p JOIN favorites f ON f.product_id = p.id WHERE f.user_id = ? ORDER BY p.id', [user.id]).map(publicProduct)
  })

  app.put('/api/favorites/:productId', {
    schema: { tags: ['Favorites'], security: csrfSecurity, params: ProductParams, body: Type.Object({}, { additionalProperties: false }), response: { 204: Type.Null(), ...errorResponses } },
  }, (request, reply) => {
    const { user } = authenticate(db, config, request)
    getProduct(db, request.params.productId)
    db.prepare('INSERT INTO favorites (user_id,product_id) VALUES (?,?) ON CONFLICT DO NOTHING').run(user.id, request.params.productId)
    reply.code(204).send(null)
  })

  app.delete('/api/favorites/:productId', {
    schema: { tags: ['Favorites'], security: csrfSecurity, params: ProductParams, response: { 204: Type.Null(), ...errorResponses } },
  }, (request, reply) => {
    const { user } = authenticate(db, config, request)
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(user.id, request.params.productId)
    reply.code(204).send(null)
  })

  app.patch('/api/admin/products/:productId', {
    schema: { tags: ['Staff'], summary: 'Update size prices or mark a coffee unavailable', security: csrfSecurity, params: ProductParams, body: ProductUpdate, response: { 200: Product, ...errorResponses } },
  }, (request) => {
    requireAdmin(authenticate(db, config, request))
    return db.transaction(() => {
      getProduct(db, request.params.productId)
      db.prepare('UPDATE products SET price_s = ?, price_m = ?, price_l = ?, available = ? WHERE id = ?')
        .run(request.body.prices.S, request.body.prices.M, request.body.prices.L, request.body.available ? 1 : 0, request.params.productId)
      db.prepare(`UPDATE users SET cart_version = cart_version + 1 WHERE id IN
        (SELECT user_id FROM cart_items WHERE product_id = ?)`).run(request.params.productId)
      return publicProduct(getProduct(db, request.params.productId))
    }).immediate()
  })
}
