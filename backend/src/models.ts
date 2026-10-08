import { Type, type Static } from '@sinclair/typebox'

export const ProductId = Type.String({ pattern: '^[a-z][a-z0-9-]{1,63}$' })
export const Uuid = Type.String({ pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' })
export const Size = Type.Union([Type.Literal('S'), Type.Literal('M'), Type.Literal('L')])
export const DeliveryMode = Type.Union([Type.Literal('Deliver'), Type.Literal('Pick Up')])
export const PaymentMethod = Type.Union([Type.Literal('Cash'), Type.Literal('Wallet')])
export const OrderStatus = Type.Union([
  Type.Literal('queued'), Type.Literal('preparing'), Type.Literal('out_for_delivery'),
  Type.Literal('delivered'), Type.Literal('ready_for_pickup'), Type.Literal('collected'), Type.Literal('cancelled'),
])
export const Text = Type.String({ minLength: 1, maxLength: 500, pattern: '\\S' })
export const NullableAddress = Type.Union([Text, Type.Null()])
export const Note = Type.String({ maxLength: 500 })
export const AccountInput = Type.Object({
  email: Type.String({ pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', maxLength: 254 }),
  password: Type.String({ minLength: 12, maxLength: 128 }),
  name: Type.String({ minLength: 2, maxLength: 80, pattern: '\\S' }),
}, { additionalProperties: false })
export const LoginInput = Type.Pick(AccountInput, ['email', 'password'])
export const PasswordInput = Type.Object({
  currentPassword: Type.String({ minLength: 12, maxLength: 128 }),
  newPassword: Type.String({ minLength: 12, maxLength: 128 }),
}, { additionalProperties: false })
export const ProfileInput = Type.Object({
  name: AccountInput.properties.name,
  deliveryAddress: NullableAddress,
  deliveryNote: Note,
}, { additionalProperties: false })
export const UserRow = Type.Object({
  id: Uuid, email: Type.String(), name: Type.String(), password_hash: Type.String(),
  role: Type.Union([Type.Literal('customer'), Type.Literal('admin')]),
  delivery_address: NullableAddress, delivery_note: Note,
  cart_version: Type.Integer({ minimum: 0 }), created_at: Type.Integer(),
})
export const User = Type.Object({
  id: Uuid, email: Type.String(), name: Type.String(),
  role: UserRow.properties.role, deliveryAddress: NullableAddress, deliveryNote: Note,
})
export const AuthResponse = Type.Object({ user: User, csrfToken: Type.String() })
export const SessionRow = Type.Object({ token_hash: Type.String(), csrf_token: Type.String(), user_id: Uuid, expires_at: Type.Integer() })
export const ProductRow = Type.Object({
  id: ProductId, name: Type.String(), description: Type.String(), type: Type.String(), category: Type.String(),
  image_key: Type.String(), price_s: Type.Integer({ minimum: 0 }), price_m: Type.Integer({ minimum: 0 }),
  price_l: Type.Integer({ minimum: 0 }), available: Type.Union([Type.Literal(0), Type.Literal(1)]),
})
export const Product = Type.Object({
  id: ProductId, name: Type.String(), description: Type.String(), type: Type.String(), category: Type.String(),
  imageKey: Type.String(), prices: Type.Object({ S: Type.Integer(), M: Type.Integer(), L: Type.Integer() }),
  available: Type.Boolean(), currency: Type.Literal('EUR'),
})
export const ProductUpdate = Type.Object({
  prices: Type.Object({ S: Type.Integer({ minimum: 1, maximum: 10000 }), M: Type.Integer({ minimum: 1, maximum: 10000 }), L: Type.Integer({ minimum: 1, maximum: 10000 }) }),
  available: Type.Boolean(),
}, { additionalProperties: false })
export const CartRow = Type.Object({ product_id: ProductId, size: Size, quantity: Type.Integer({ minimum: 1, maximum: 20 }) })
export const CartItem = Type.Object({
  product: Product, size: Size, quantity: Type.Integer(), unitPriceCents: Type.Integer(), lineTotalCents: Type.Integer(),
})
export const Quote = Type.Object({
  version: Type.Integer(), items: Type.Array(CartItem), currency: Type.Literal('EUR'),
  subtotalCents: Type.Integer(), deliveryFeeCents: Type.Integer(), discountCents: Type.Integer(), totalCents: Type.Integer(),
})
export const CheckoutInput = Type.Object({
  cartVersion: Type.Integer({ minimum: 0 }), deliveryMode: DeliveryMode, paymentMethod: PaymentMethod,
  deliveryAddress: NullableAddress, note: Note, discountApplied: Type.Boolean(),
}, { additionalProperties: false })
export const PaymentStatus = Type.Union([Type.Literal('pending'), Type.Literal('paid')])
export const OrderRow = Type.Object({
  id: Uuid, user_id: Uuid, status: OrderStatus, delivery_mode: DeliveryMode,
  payment_method: Type.Literal('Cash'), payment_status: PaymentStatus,
  delivery_address: NullableAddress, note: Note, subtotal_cents: Type.Integer(),
  delivery_fee_cents: Type.Integer(), discount_cents: Type.Integer(), total_cents: Type.Integer(),
  created_at: Type.Integer(), updated_at: Type.Integer(),
  idempotency_key: Type.String(), request_hash: Type.String(),
})
export const OrderItemRow = Type.Object({
  product_id: ProductId, name: Type.String(), size: Size, quantity: Type.Integer(), unit_price_cents: Type.Integer(),
})
export const Order = Type.Object({
  id: Uuid, status: OrderStatus, deliveryMode: DeliveryMode, paymentMethod: Type.Literal('Cash'),
  paymentStatus: PaymentStatus, deliveryAddress: NullableAddress, note: Note, currency: Type.Literal('EUR'),
  subtotalCents: Type.Integer(), deliveryFeeCents: Type.Integer(), discountCents: Type.Integer(), totalCents: Type.Integer(),
  createdAt: Type.Integer(), updatedAt: Type.Integer(), items: Type.Array(Type.Object({
    productId: ProductId, name: Type.String(), size: Size, quantity: Type.Integer(), unitPriceCents: Type.Integer(),
  })),
})
export const Pagination = Type.Object({
  limit: Type.String({ pattern: '^([1-9]|[1-4][0-9]|50)$' }), offset: Type.String({ pattern: '^(0|[1-9][0-9]{0,3}|10000)$' }),
}, { additionalProperties: false })
export const ProductParams = Type.Object({ productId: ProductId }, { additionalProperties: false })
export const OrderParams = Type.Object({ orderId: Uuid }, { additionalProperties: false })
export const ApiError = Type.Object({ code: Type.String(), message: Type.String(), requestId: Type.String() })

export type AccountData = Static<typeof AccountInput>
export type UserRecord = Static<typeof UserRow>
export type ProductRecord = Static<typeof ProductRow>
export type OrderRecord = Static<typeof OrderRow>
export type CheckoutData = Static<typeof CheckoutInput>
export type CoffeeSize = Static<typeof Size>
export type OrderState = Static<typeof OrderStatus>
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
