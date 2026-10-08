import type { CartLine, CoffeeProduct, ProductSize } from '@/types/coffee'

/** Add a coffee without modifying the current basket or product. */
export function addCartProduct(items: readonly CartLine[], product: CoffeeProduct, size: ProductSize): CartLine[] {
  const existing = items.some((item) => item.name === product.name && item.size === size)
  if (!existing) return [...items, { ...product, size, quantity: 1 }]
  return items.map((item) => item.name === product.name && item.size === size
    ? { ...item, quantity: item.quantity + 1 }
    : item)
}
