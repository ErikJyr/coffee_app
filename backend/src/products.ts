import type { Static } from '@sinclair/typebox'
import { type Connection, selectOne, selectAll } from './database.js'
import { Product, ProductRow, type ProductRecord } from './models.js'
import { httpError } from './errors.js'

export function getProduct(db: Connection, productId: string): ProductRecord {
  const product = selectOne(db, ProductRow, 'SELECT * FROM products WHERE id = ?', [productId])
  if (!product) throw httpError(404, 'PRODUCT_NOT_FOUND', `Coffee ${productId} does not exist.`)
  return product
}

export function publicProduct(product: ProductRecord): Static<typeof Product> {
  return {
    id: product.id, name: product.name, description: product.description, type: product.type, category: product.category,
    imageKey: product.image_key, prices: { S: product.price_s, M: product.price_m, L: product.price_l },
    available: product.available === 1, currency: 'EUR',
  }
}

export function listProducts(db: Connection): Static<typeof Product>[] {
  return selectAll(db, ProductRow, 'SELECT * FROM products ORDER BY rowid', []).map(publicProduct)
}
