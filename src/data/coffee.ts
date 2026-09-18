import type { AppScreen, CoffeeProduct, ProductSize } from '@/types/coffee'

export const appScreens: readonly AppScreen[] = [
  'onboarding',
  'home',
  'detail',
  'order',
  'delivery',
]

export const productSizes: readonly ProductSize[] = ['S', 'M', 'L']

export const appAssets = {
  onboarding: 'https://www.figma.com/api/mcp/asset/fac22a61-5157-43ba-bfe7-25f4f65d8250.png',
  product: 'https://www.figma.com/api/mcp/asset/d3b20185-7b86-45eb-bd7b-d5d7df6d60b2.png',
  map: 'https://www.figma.com/api/mcp/asset/62673539-c9e0-424f-841f-efe3e14ee41e.png',
  courier: 'https://www.figma.com/api/mcp/asset/92695c59-b474-4cf9-bf39-89ec967601c8.png',
  route: 'https://www.figma.com/api/mcp/asset/454fb1d0-5b94-485c-b74d-e53f61efd88f.svg',
  location: 'https://www.figma.com/api/mcp/asset/5c968888-82d9-4a1c-99f9-c6a462146da6.svg',
  motorbike: 'https://www.figma.com/api/mcp/asset/499af42e-c56c-4313-9130-ab0501c8fb96.png',
  bean: 'https://www.figma.com/api/mcp/asset/9bdc0796-9156-4c55-a625-2391cdced2f6.png',
  package: 'https://www.figma.com/api/mcp/asset/0c32234c-c0da-402f-959c-8975e50470df.png',
  star: 'https://www.figma.com/api/mcp/asset/8f73944d-d1d5-4e43-8a96-4e624c524187.svg',
  heart: 'https://www.figma.com/api/mcp/asset/a98be3e0-a1a5-45ba-95c7-c22d3e762c53.svg',
  back: 'https://www.figma.com/api/mcp/asset/b19cefbd-8e2a-4a15-bf59-3dbc053a23af.svg',
} as const

export const catalogAssets = {
  banner: 'https://www.figma.com/api/mcp/asset/7f3fda68-a204-497e-9f35-4f99798e11d5.png',
  star: 'https://www.figma.com/api/mcp/asset/b4edec5e-8d65-456e-b4b0-a7ba7ae2b8a7.svg',
  plus: 'https://www.figma.com/api/mcp/asset/9f1035c3-39cd-4c18-af46-7b026143bec2.svg',
  arrowDown: 'https://www.figma.com/api/mcp/asset/327fc650-6a35-4b9c-a1f4-278e039b50fa.svg',
  filter: 'https://www.figma.com/api/mcp/asset/d42147f6-06d7-4ff1-9bde-f870718671fa.svg',
  home: 'https://www.figma.com/api/mcp/asset/e04dd923-6cbf-4d1c-b25b-b24dca753989.svg',
  heart: 'https://www.figma.com/api/mcp/asset/8efe51a4-847a-4792-937b-028978a3461a.svg',
  bag: 'https://www.figma.com/api/mcp/asset/e8cfea80-dd60-48e9-a44d-dfad3b5600a2.svg',
  notification: 'https://www.figma.com/api/mcp/asset/f754a3e9-3bc5-4aee-bd59-4e403a72ce6c.svg',
} as const

export const categories = ['All Coffee', 'Machiato', 'Latte', 'Americano'] as const

export const products: readonly CoffeeProduct[] = [
  {
    name: 'Caffe Mocha',
    type: 'Deep Foam',
    price: '4.53€',
    category: 'All Coffee',
    image: 'https://www.figma.com/api/mcp/asset/20e69cc5-11bd-4cc1-9ed2-527012e2508b.png',
  },
  {
    name: 'Flat White',
    type: 'Espresso',
    price: '3.53€',
    category: 'Latte',
    image: 'https://www.figma.com/api/mcp/asset/78dcb04c-4656-4bd6-8ace-e555f83e15ef.png',
  },
  {
    name: 'Caffe Panna',
    type: 'Ice/Hot',
    price: '5.53€',
    category: 'Machiato',
    image: 'https://www.figma.com/api/mcp/asset/a0e142c3-1dc9-4099-a2f5-b77e0e287d13.png',
  },
  {
    name: 'Mocha Fusi',
    type: 'Ice/Hot',
    price: '7.53€',
    category: 'Americano',
    image: 'https://www.figma.com/api/mcp/asset/909b84fd-4c26-4681-a4b3-0b9175cb442c.png',
  },
]

export const defaultProduct: CoffeeProduct = {
  name: 'Caffe Mocha',
  type: 'Ice/Hot',
  price: '4.53€',
  category: 'All Coffee',
  image: appAssets.product,
}
