import type { AppScreen, CoffeeProduct, ProductSize } from '@/types/coffee'
import onboardingImage from '@/assets/coffee/onboarding.png'
import productImage from '@/assets/coffee/product.png'
import mapImage from '@/assets/coffee/map.png'
import courierImage from '@/assets/coffee/courier.png'
import routeImage from '@/assets/coffee/route.svg'
import locationImage from '@/assets/coffee/location.svg'
import motorbikeImage from '@/assets/coffee/motorbike.png'
import beanImage from '@/assets/coffee/bean.png'
import packageImage from '@/assets/coffee/package.png'
import starImage from '@/assets/coffee/star.svg'
import heartImage from '@/assets/coffee/heart.svg'
import backImage from '@/assets/coffee/back.svg'
import bannerImage from '@/assets/coffee/banner.png'
import catalogStarImage from '@/assets/coffee/catalog-star.svg'
import plusImage from '@/assets/coffee/plus.svg'
import arrowDownImage from '@/assets/coffee/arrow-down.svg'
import filterImage from '@/assets/coffee/filter.svg'
import homeImage from '@/assets/coffee/home.svg'
import catalogHeartImage from '@/assets/coffee/catalog-heart.svg'
import bagImage from '@/assets/coffee/bag.svg'
import notificationImage from '@/assets/coffee/notification.svg'
import caffeMochaImage from '@/assets/coffee/caffe-mocha.png'
import flatWhiteImage from '@/assets/coffee/flat-white.png'
import caffePannaImage from '@/assets/coffee/caffe-panna.png'
import mochaFusiImage from '@/assets/coffee/mocha-fusi.png'

export const appScreens: readonly AppScreen[] = [
  'onboarding',
  'home',
  'detail',
  'order',
  'delivery',
]

export const productSizes: readonly ProductSize[] = ['S', 'M', 'L']

export const appAssets = {
  onboarding: onboardingImage,
  product: productImage,
  map: mapImage,
  courier: courierImage,
  route: routeImage,
  location: locationImage,
  motorbike: motorbikeImage,
  bean: beanImage,
  package: packageImage,
  star: starImage,
  heart: heartImage,
  back: backImage,
} as const

export const catalogAssets = {
  banner: bannerImage,
  star: catalogStarImage,
  plus: plusImage,
  arrowDown: arrowDownImage,
  filter: filterImage,
  home: homeImage,
  heart: catalogHeartImage,
  bag: bagImage,
  notification: notificationImage,
} as const

export const categories = ['All Coffee', 'Machiato', 'Latte', 'Americano'] as const

export const products: readonly CoffeeProduct[] = [
  {
    name: 'Caffe Mocha',
    description: 'Espresso meets smooth chocolate and steamed milk, finished with a soft layer of foam. A rich, comforting cup for a little pause in your day.',
    type: 'Deep Foam',
    price: '4.69€',
    category: 'All Coffee',
    image: caffeMochaImage,
  },
  {
    name: 'Flat White',
    description: 'A smooth espresso base with velvety steamed milk and a delicate layer of microfoam. Balanced and mellow, with the coffee flavor taking center stage.',
    type: 'Espresso',
    price: '3.69€',
    category: 'Latte',
    image: flatWhiteImage,
  },
  {
    name: 'Caffe Panna',
    description: 'A full-bodied espresso topped with a soft swirl of cream. A small, indulgent coffee with a smooth finish, made for a slow and satisfying sip.',
    type: 'Ice/Hot',
    price: '5.69€',
    category: 'Machiato',
    image: caffePannaImage,
  },
  {
    name: 'Mocha Fusi',
    description: 'Chocolate and espresso come together in a creamy, satisfying cup. Enjoy it hot for a cozy moment or over ice when your day calls for something cool.',
    type: 'Ice/Hot',
    price: '7.69€',
    category: 'Americano',
    image: mochaFusiImage,
  },
]

export function getPriceForSize(price: string, size: ProductSize): string {
  const basePrice = Number.parseFloat(price.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(basePrice)) throw new TypeError(`Invalid coffee price: ${price}`)

  const adjustment = size === 'S' ? -0.5 : size === 'L' ? 0.5 : 0
  return `${(basePrice + adjustment).toFixed(2)}€`
}

export const defaultProduct: CoffeeProduct = {
  name: 'Caffe Mocha',
  description: products[0]!.description,
  type: 'Ice/Hot',
  price: '4.53€',
  category: 'All Coffee',
  image: appAssets.product,
}
