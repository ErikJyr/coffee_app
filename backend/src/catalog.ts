export type CatalogSeed = {
  id: string; name: string; description: string; type: string; category: string; imageKey: string; priceCents: number
}

/** Stable IDs and image keys match the Vue catalog; prices are integer euro cents. */
export const catalog: readonly CatalogSeed[] = [
  { id: 'caffe-mocha', name: 'Caffe Mocha', description: 'Espresso meets smooth chocolate and steamed milk, finished with a soft layer of foam. A rich, comforting cup for a little pause in your day.', type: 'Deep Foam', category: 'All Coffee', imageKey: 'caffe-mocha', priceCents: 453 },
  { id: 'flat-white', name: 'Flat White', description: 'A smooth espresso base with velvety steamed milk and a delicate layer of microfoam. Balanced and mellow, with the coffee flavor taking center stage.', type: 'Espresso', category: 'Latte', imageKey: 'flat-white', priceCents: 353 },
  { id: 'caffe-panna', name: 'Caffe Panna', description: 'A full-bodied espresso topped with a soft swirl of cream. A small, indulgent coffee with a smooth finish, made for a slow and satisfying sip.', type: 'Ice/Hot', category: 'Machiato', imageKey: 'caffe-panna', priceCents: 553 },
  { id: 'mocha-fusi', name: 'Mocha Fusi', description: 'Chocolate and espresso come together in a creamy, satisfying cup. Enjoy it hot for a cozy moment or over ice when your day calls for something cool.', type: 'Ice/Hot', category: 'Americano', imageKey: 'mocha-fusi', priceCents: 753 },
]
