<script setup lang="ts">
import { computed, ref } from 'vue'
import { appAssets } from '@/data/coffee'
import type { CartLine, DeliveryMode, PaymentMethod } from '@/types/coffee'

const props = defineProps<{
  cartItems: CartLine[]
}>()

defineEmits<{
  back: []
  submit: []
  browse: []
  changeQuantity: [index: number, delta: number]
}>()

const deliveryMode = defineModel<DeliveryMode>('deliveryMode', { required: true })
const discountApplied = defineModel<boolean>('discountApplied', { required: true })
const addressEditing = defineModel<boolean>('addressEditing', { required: true })
const noteOpen = defineModel<boolean>('noteOpen', { required: true })
const paymentOpen = defineModel<boolean>('paymentOpen', { required: true })
const paymentMethod = defineModel<PaymentMethod>('paymentMethod', { required: true })
const deliveryAddress = defineModel<string>('deliveryAddress', { required: true })
const deliveryNote = defineModel<string>('deliveryNote', { required: true })
const pickupConfirmed = ref<boolean>(false)

function getPriceValue(price: string): number {
  const value = Number.parseFloat(price.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(value)) throw new TypeError(`Invalid coffee price: ${price}`)
  return value
}

const cartSubtotal = computed(() =>
  props.cartItems.reduce(
    (subtotal, item) => subtotal + getPriceValue(item.price) * item.quantity,
    0,
  ),
)

const deliveryFee = computed(() => (deliveryMode.value === 'Deliver' && props.cartItems.length > 0 ? 1 : 0))
const discountAmount = computed(() => (discountApplied.value && props.cartItems.length > 0 ? 0.5 : 0))
const total = computed(() =>
  Math.max(0, cartSubtotal.value + deliveryFee.value - discountAmount.value).toFixed(2),
)
</script>

<template>
  <section class="order-screen">
    <header class="screen-header">
      <button class="icon-button" type="button" data-testid="order-back" aria-label="Back to shopping" @click="$emit('back')">
        <img class="back-icon" :src="appAssets.back" alt="" />
      </button>
      <strong>Your order</strong>
      <span class="header-spacer"></span>
    </header>

    <div class="delivery-type">
      <button
        type="button"
        data-testid="delivery-mode-deliver"
        :aria-pressed="deliveryMode === 'Deliver'"
        :class="{ selected: deliveryMode === 'Deliver' }"
        @click="deliveryMode = 'Deliver'"
      >
        Deliver
      </button>
      <button
        type="button"
        data-testid="delivery-mode-pickup"
        :aria-pressed="deliveryMode === 'Pick Up'"
        :class="{ selected: deliveryMode === 'Pick Up' }"
        @click="deliveryMode = 'Pick Up'"
      >
        Pick Up
      </button>
    </div>

    <section v-if="deliveryMode === 'Deliver'" class="address-section">
      <h2>Delivery Address</h2>
      <strong>Erik Jürgenstein</strong>
      <p data-testid="delivery-address-summary">{{ deliveryAddress }}</p>

      <div class="small-actions">
        <button type="button" data-testid="edit-address" :aria-expanded="addressEditing" @click="addressEditing = !addressEditing">
          {{ addressEditing ? 'Save address' : 'Edit address' }}
        </button>
        <button type="button" data-testid="edit-note" :aria-expanded="noteOpen" @click="noteOpen = !noteOpen">
          {{ noteOpen ? 'Save note' : deliveryNote ? 'Edit note' : 'Add note' }}
        </button>
      </div>

      <input
        v-if="addressEditing"
        class="order-input"
        v-model="deliveryAddress"
        data-testid="delivery-address"
        aria-label="Edit delivery address"
      />
      <textarea
        v-if="noteOpen"
        class="order-input note-input"
        v-model="deliveryNote"
        data-testid="delivery-note"
        placeholder="Add a delivery note"
        aria-label="Delivery note"
      ></textarea>
    </section>

    <section v-else class="address-section pickup-info">
      <h2>Pick up at Coffee Corner</h2>
      <p>Kuressaare · Your demo order will be ready in 10 minutes.</p>
    </section>

    <div class="order-divider"></div>
    <div v-if="cartItems.length === 0" class="empty-bag" data-testid="empty-bag">
      <h2>Your bag is waiting for a coffee</h2>
      <p>Explore the menu and find your next favorite.</p>
      <button class="primary-button" type="button" data-testid="empty-bag-browse" @click="$emit('browse')">Explore coffees</button>
    </div>

    <section
      v-for="(item, index) in cartItems"
      :key="`${item.name}-${item.size}`"
      class="checkout-product"
    >
      <img :src="item.image" :alt="item.name" />

      <div class="checkout-product-copy">
        <strong>{{ item.name }}</strong>
        <span>{{ item.size }} · {{ item.type }}</span>
      </div>

      <div class="quantity-control">
        <button
          type="button"
          :data-testid="`decrease-${item.name}-${item.size}`"
          :aria-label="item.quantity === 1 ? `Remove ${item.name}` : `Decrease ${item.name} quantity`"
          @click="$emit('changeQuantity', index, -1)"
        >
          −
        </button>
        <strong>{{ item.quantity }}</strong>
        <button
          type="button"
          :data-testid="`increase-${item.name}-${item.size}`"
          :aria-label="`Increase ${item.name} quantity`"
          @click="$emit('changeQuantity', index, 1)"
        >
          +
        </button>
      </div>
    </section>

    <button
      v-if="cartItems.length > 0"
      class="discount-row"
      :aria-pressed="discountApplied"
      data-testid="order-discount"
      type="button"
      @click="discountApplied = !discountApplied"
    >
      <span>✧</span>
      {{ discountApplied ? '1 Discount Applied' : 'Add discount' }}
      <strong>›</strong>
    </button>

    <section class="payment-summary">
      <h2>Payment Summary</h2>

      <div>
        <span>Price</span>
        <strong>{{ cartSubtotal.toFixed(2) }}€</strong>
      </div>
      <div>
        <span>{{ deliveryMode === 'Deliver' ? 'Delivery Fee' : 'Pickup Fee' }}</span>
        <strong>{{ deliveryFee }}€</strong>
      </div>
      <div v-if="discountApplied">
        <span>Discount</span>
        <strong>-{{ discountAmount.toFixed(2) }}€</strong>
      </div>
      <div class="summary-total" data-testid="order-total">
        <span>Total</span>
        <strong>{{ total }}€</strong>
      </div>
    </section>

    <footer class="payment-bar">
      <button class="payment-method" type="button" data-testid="payment-method" :aria-expanded="paymentOpen" @click="paymentOpen = !paymentOpen">
        <span class="wallet-icon">▱</span>
        <span class="payment-method-copy">
          <strong>{{ paymentMethod }}</strong>
          <b data-testid="payment-total">{{ total }}€ total</b>
        </span>
        <span>{{ paymentOpen ? '⌃' : '⌄' }}</span>
      </button>

      <div v-if="paymentOpen" class="payment-options">
        <button
          type="button"
          data-testid="payment-cash"
          :aria-pressed="paymentMethod === 'Cash'"
          :class="{ selected: paymentMethod === 'Cash' }"
          @click="paymentMethod = 'Cash'"
        >
          Cash
        </button>
        <button
          type="button"
          data-testid="payment-wallet"
          :aria-pressed="paymentMethod === 'Wallet'"
          :class="{ selected: paymentMethod === 'Wallet' }"
          @click="paymentMethod = 'Wallet'"
        >
          Wallet
        </button>
      </div>

      <div v-if="pickupConfirmed && deliveryMode === 'Pick Up'" class="pickup-confirmation" role="status" data-testid="pickup-confirmation">
        <strong>Pickup confirmed</strong>
        <p>Your demo coffee will be ready in 10 minutes.</p>
        <button class="primary-button" type="button" @click="$emit('browse')">Back to coffee</button>
      </div>
      <button v-else-if="deliveryMode === 'Pick Up'" class="primary-button" type="button" data-testid="confirm-pickup" :disabled="cartItems.length === 0" @click="pickupConfirmed = true">
        Confirm pickup · {{ total }}€
      </button>
      <button v-else class="primary-button" type="button" data-testid="place-order" :disabled="cartItems.length === 0 || !deliveryAddress.trim()" @click="$emit('submit')">
        Order · {{ total }}€
      </button>
    </footer>
  </section>
</template>

<style scoped>
.order-screen {
  width: min(100%, var(--size-screen-width));
  min-height: 100dvh;
  margin: auto;
  padding: 28px 24px 280px;
  position: relative;
  background: var(--color-coffee-night);
}

.header-spacer {
  width: 44px;
}

.delivery-type {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.delivery-type button {
  height: 48px;
  flex: 1;
  border: 0;
  border-radius: 8px;
  color: var(--color-coffee-muted);
  background: var(--color-coffee-surface);
  font-size: 16px;
}

.delivery-type button.selected {
  color: #fff;
  background: var(--color-coffee-primary);
  font-weight: 600;
}

.address-section h2,
.payment-summary h2 {
  margin-bottom: 8px;
  font-size: 16px;
}

.address-section > strong {
  display: block;
  margin-top: 20px;
  font-size: 14px;
}

.address-section p {
  margin: 4px 0;
  font-size: 12px;
}

.small-actions {
  display: flex;
  gap: 8px;
}

.small-actions button {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid var(--color-coffee-border);
  border-radius: 16px;
  color: #fff;
  background: var(--color-coffee-surface);
  font-size: 12px;
}

.order-input {
  width: 100%;
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px solid #777;
  border-radius: 8px;
  color: #fff;
  background: #242424;
  font-size: 16px;
}

.note-input {
  min-height: 48px;
  resize: vertical;
}

.order-divider {
  height: 1px;
  margin: 24px 0;
  background: var(--color-coffee-border);
}

.checkout-product {
  display: flex;
  align-items: center;
  gap: 16px;
}

.checkout-product + .checkout-product {
  margin-top: 16px;
}

.checkout-product > img {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  object-fit: cover;
}

.checkout-product-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.checkout-product-copy span {
  font-size: 12px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-control button {
  display: grid;
  width: 40px;
  height: 44px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: var(--color-coffee-surface);
  font-size: 18px;
  line-height: 1;
}

.discount-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding: 16px;
  border: 1px solid var(--color-coffee-border);
  border-radius: 16px;
  color: #fff;
  background: transparent;
  text-align: left;
}

.discount-row span {
  color: var(--color-coffee-primary);
  font-size: 22px;
}

.discount-row strong {
  margin-left: auto;
  font-size: 24px;
  font-weight: 400;
}

.payment-summary {
  margin-top: 26px;
}

.payment-summary > div {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
}

.summary-total {
  padding-top: 12px;
  border-top: 1px solid #3a3a3a;
  font-weight: 600;
}

.payment-bar {
  display: block;
  padding: 16px 24px calc(20px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  position: fixed;
  right: max(0px, calc((100vw - var(--size-screen-width)) / 2));
  bottom: 0;
  left: max(0px, calc((100vw - var(--size-screen-width)) / 2));
  z-index: 10;
  border-top: 1px solid var(--color-coffee-border);
  background: #1b1b24f5;
  backdrop-filter: blur(16px);
}

.payment-method {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 0 0 16px;
  border: 0;
  color: #fff;
  background: transparent;
  text-align: left;
}

.payment-method-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.payment-method b {
  color: var(--color-coffee-primary);
  font-size: 12px;
}

.wallet-icon {
  color: var(--color-coffee-primary);
  font-size: 24px;
}

.payment-options {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
}

.payment-options button {
  flex: 1;
  min-height: 44px;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 8px;
  color: #fff;
  background: #242424;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.payment-options button.selected {
  border-color: var(--color-coffee-primary);
  background: var(--color-coffee-primary);
}

.payment-bar .primary-button {
  width: 100%;
}

.empty-bag, .pickup-info { padding: 20px 0; }
.empty-bag p, .pickup-confirmation p { margin: 8px 0 16px; color: var(--color-coffee-muted); font-size: 13px; }
.empty-bag h2 { font-size: 18px; }
.checkout-product-copy { min-width: 0; }
.checkout-product-copy span, .address-section p { color: var(--color-coffee-muted); }
.quantity-control { flex-shrink: 0; }
.checkout-product { gap: 10px; }
.checkout-product > img { width: 48px; height: 48px; }
.summary-total strong { color: #b3b5ff; font-size: 18px; }
@media (max-width: 350px) { .checkout-product { flex-wrap: wrap; } .quantity-control { margin-left: auto; } }

@media (prefers-reduced-motion: reduce) {
  .payment-options button {
    transition: none;
  }
}
</style>
