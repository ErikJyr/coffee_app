export type CoffeeProduct = {
  name: string
  type: string
  price: string
  category: string
  image: string
}

export type CartLine = CoffeeProduct & {
  quantity: number
}

export type AppScreen = 'onboarding' | 'home' | 'detail' | 'order' | 'delivery'
export type ProductSize = 'S' | 'M' | 'L'
export type DeliveryMode = 'Deliver' | 'Pick Up'
export type PaymentMethod = 'Cash' | 'Wallet'
