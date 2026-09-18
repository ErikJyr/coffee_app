<script setup lang="ts">
import { computed } from 'vue'
import { appAssets } from '@/data/coffee'
import type { CartLine, DeliveryMode, PaymentMethod } from '@/types/coffee'

const props = defineProps<{
  cartItems: CartLine[]
}>()

defineEmits<{
  back: []
  submit: []
  changeQuantity: [index: number, delta: number]
}>()

const deliveryMode = defineModel<DeliveryMode>('deliveryMode', { required: true })
const discountApplied = defineModel<boolean>('discountApplied', { required: true })
const addressEditing = defineModel<boolean>('addressEditing', { required: true })
const noteOpen = defineModel<boolean>('noteOpen', { required: true })
const paymentOpen = defineModel<boolean>('paymentOpen', { required: true })
const paymentMethod = defineModel<PaymentMethod>('paymentMethod', { required: true })

function getPriceValue(price: string) {
  return Number.parseFloat(price.replace(/[^0-9.]/g, '')) || 0
}

const cartSubtotal = computed(() =>
  props.cartItems.reduce(
    (subtotal, item) => subtotal + getPriceValue(item.price) * item.quantity,
    0,
  ),
)

const deliveryFee = computed(() => (deliveryMode.value === 'Deliver' ? 1 : 0))
const discountAmount = computed(() => (discountApplied.value ? 0.5 : 0))
const total = computed(() =>
  Math.max(0, cartSubtotal.value + deliveryFee.value - discountAmount.value).toFixed(2),
)
</script>

<template>
  <section class="order-screen">
    <header class="screen-header">
      <button class="icon-button" type="button" aria-label="Back to detail" @click="$emit('back')">
        <img class="back-icon" :src="appAssets.back" alt="" />
      </button>
      <strong>Order</strong>
      <span class="header-spacer"></span>
    </header>

    <div class="delivery-type">
      <button
        type="button"
        :class="{ selected: deliveryMode === 'Deliver' }"
        @click="deliveryMode = 'Deliver'"
      >
        Deliver
      </button>
      <button
        type="button"
        :class="{ selected: deliveryMode === 'Pick Up' }"
        @click="deliveryMode = 'Pick Up'"
      >
        Pick Up
      </button>
    </div>

    <section class="address-section">
      <h2>Delivery Address</h2>
      <strong>Erik Jürgenstein</strong>
      <p>
        Kohtu tn 22, Kuressaare, 93812 Saare maakond,<br />
        Estonia
      </p>

      <div class="small-actions">
        <button type="button" @click="addressEditing = !addressEditing">
          ⌑ {{ addressEditing ? 'Close Address' : 'Edit Address' }}
        </button>
        <button type="button" @click="noteOpen = !noteOpen">
          ▣ {{ noteOpen ? 'Close Note' : 'Add Note' }}
        </button>
      </div>

      <input
        v-if="addressEditing"
        class="order-input"
        value="Kohtu tn 22, Kuressaare"
        aria-label="Edit delivery address"
      />
      <textarea
        v-if="noteOpen"
        class="order-input note-input"
        placeholder="Add a delivery note"
        aria-label="Delivery note"
      ></textarea>
    </section>

    <div class="order-divider"></div>

    <section
      v-for="(item, index) in cartItems"
      :key="item.name"
      class="checkout-product"
    >
      <img :src="item.image" :alt="item.name" />

      <div class="checkout-product-copy">
        <strong>{{ item.name }}</strong>
        <span>{{ item.type }}</span>
      </div>

      <div class="quantity-control">
        <button
          type="button"
          :aria-label="`Decrease ${item.name} quantity`"
          @click="$emit('changeQuantity', index, -1)"
        >
          −
        </button>
        <strong>{{ item.quantity }}</strong>
        <button
          type="button"
          :aria-label="`Increase ${item.name} quantity`"
          @click="$emit('changeQuantity', index, 1)"
        >
          +
        </button>
      </div>
    </section>

    <button
      class="discount-row"
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
      <div class="summary-total">
        <span>Total</span>
        <strong>{{ total }}€</strong>
      </div>
    </section>

    <footer class="payment-bar">
      <button class="payment-method" type="button" @click="paymentOpen = !paymentOpen">
        <span class="wallet-icon">▱</span>
        <span class="payment-method-copy">
          <strong>{{ paymentMethod }}</strong>
          <b>5.53€</b>
        </span>
        <span>{{ paymentOpen ? '⌃' : '⌄' }}</span>
      </button>

      <div v-if="paymentOpen" class="payment-options">
        <button
          type="button"
          :class="{ selected: paymentMethod === 'Cash' }"
          @click="paymentMethod = 'Cash'"
        >
          Cash
        </button>
        <button
          type="button"
          :class="{ selected: paymentMethod === 'Wallet' }"
          @click="paymentMethod = 'Wallet'"
        >
          Wallet
        </button>
      </div>

      <button class="primary-button" type="button" @click="$emit('submit')">
        Order
      </button>
    </footer>
  </section>
</template>

<style scoped>
.order-screen {
  width: min(100%, var(--size-screen-width));
  min-height: 812px;
  margin: auto;
  padding: 68px 24px 190px;
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
  height: 35px;
  flex: 1;
  border: 0;
  border-radius: 8px;
  background: #ededed;
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
  padding: 4px 12px;
  border: 1px solid #fff;
  border-radius: 16px;
  color: #fff;
  background: var(--color-coffee-primary);
  font-size: 12px;
}

.order-input {
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid #777;
  border-radius: 8px;
  color: #fff;
  background: #242424;
  font-size: 12px;
}

.note-input {
  min-height: 48px;
  resize: vertical;
}

.order-divider {
  height: 4px;
  margin: 12px -24px 16px;
  background: #e3e3e3;
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
  gap: 16px;
}

.quantity-control button {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #313131;
  background: #fff;
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
  border: 1px solid #fff;
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
  padding: 16px 24px 46px;
  border-radius: 16px 16px 0 0;
  position: fixed;
  right: max(0px, calc((100vw - 375px) / 2));
  bottom: 0;
  left: max(0px, calc((100vw - 375px) / 2));
  z-index: 10;
  background: var(--color-coffee-night);
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

@media (prefers-reduced-motion: reduce) {
  .payment-options button {
    transition: none;
  }
}
</style>
