<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import HeroSection from './HeroSection.vue'

type Screen = 'onboarding' | 'home' | 'detail' | 'order' | 'delivery'
type Product = {
  name: string
  type: string
  price: string
  category: string
  image: string
  warm?: boolean
}

type CartLine = Product & { quantity: number }

const onboardingImage = 'https://www.figma.com/api/mcp/asset/fac22a61-5157-43ba-bfe7-25f4f65d8250.png'
const productImage = 'https://www.figma.com/api/mcp/asset/d3b20185-7b86-45eb-bd7b-d5d7df6d60b2.png'
const mapImage = 'https://www.figma.com/api/mcp/asset/62673539-c9e0-424f-841f-efe3e14ee41e.png'
const courierImage = 'https://www.figma.com/api/mcp/asset/92695c59-b474-4cf9-bf39-89ec967601c8.png'
const routeIcon = 'https://www.figma.com/api/mcp/asset/454fb1d0-5b94-485c-b74d-e53f61efd88f.svg'
const locationIcon = 'https://www.figma.com/api/mcp/asset/5c968888-82d9-4a1c-99f9-c6a462146da6.svg'
const motorbikeIcon = 'https://www.figma.com/api/mcp/asset/499af42e-c56c-4313-9130-ab0501c8fb96.png'
const beanIcon = 'https://www.figma.com/api/mcp/asset/9bdc0796-9156-4c55-a625-2391cdced2f6.png'
const packageIcon = 'https://www.figma.com/api/mcp/asset/0c32234c-c0da-402f-959c-8975e50470df.png'
const starIcon = 'https://www.figma.com/api/mcp/asset/8f73944d-d1d5-4e43-8a96-4e624c524187.svg'
const heartIcon = 'https://www.figma.com/api/mcp/asset/a98be3e0-a1a5-45ba-95c7-c22d3e762c53.svg'
const backIcon = 'https://www.figma.com/api/mcp/asset/b19cefbd-8e2a-4a15-bf59-3dbc053a23af.svg'

const defaultProduct: Product = {
  name: 'Caffe Mocha',
  type: 'Ice/Hot',
  price: '4.53€',
  category: 'All Coffee',
  image: productImage,
}

const screen = ref<Screen>(getInitialScreen())
const selectedProduct = ref<Product>(defaultProduct)
const selectedSize = ref('M')
const cartItems = ref<CartLine[]>([])
const isFavorite = ref(false)
const discountApplied = ref(true)
const paymentOpen = ref(false)
const expandedDescription = ref(false)
const deliveryMode = ref<'Deliver' | 'Pick Up'>('Deliver')
const addressEditing = ref(false)
const noteOpen = ref(false)
const mapCentered = ref(false)
const orderNotice = ref('')
const paymentMethod = ref<'Cash' | 'Wallet'>('Wallet')
let orderNoticeTimer: number | undefined

function getInitialScreen(): Screen {
  const hash = window.location.hash.slice(1) as Screen
  return ['onboarding', 'home', 'detail', 'order', 'delivery'].includes(hash) ? hash : 'onboarding'
}

function goTo(nextScreen: Screen) {
  screen.value = nextScreen
  window.location.hash = nextScreen
}

function openDetail(product: Product) {
  selectedProduct.value = { ...product, image: product.name === 'Caffe Mocha' ? productImage : product.image }
  selectedSize.value = 'M'
  goTo('detail')
}

function showOrderNotice(message: string) {
  if (orderNoticeTimer) {
    window.clearTimeout(orderNoticeTimer)
  }
  orderNotice.value = message
  orderNoticeTimer = window.setTimeout(() => {
    orderNotice.value = ''
    orderNoticeTimer = undefined
  }, 2200)
}

function openOrder(items: CartLine[] = []) {
  cartItems.value = items.length > 0 ? items.map((item) => ({ ...item })) : [{ ...selectedProduct.value, quantity: 1 }]
  deliveryMode.value = 'Deliver'
  discountApplied.value = true
  paymentOpen.value = false
  goTo('order')
}

function changeLineQuantity(index: number, delta: number) {
  const item = cartItems.value[index]

  if (!item) {
    return
  }

  item.quantity = Math.max(1, item.quantity + delta)
}

function handleHashChange() {
  screen.value = getInitialScreen()
}

const cartSubtotal = computed(() => cartItems.value.reduce((subtotal, item) => subtotal + (Number.parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0) * item.quantity, 0))
const deliveryFee = computed(() => deliveryMode.value === 'Deliver' ? 1 : 0)
const discountAmount = computed(() => discountApplied.value ? 0.5 : 0)
const total = computed(() => Math.max(0, cartSubtotal.value + deliveryFee.value - discountAmount.value).toFixed(2))

onMounted(() => window.addEventListener('hashchange', handleHashChange))
onBeforeUnmount(() => window.removeEventListener('hashchange', handleHashChange))
</script>

<template>
  <main class="coffee-app">
    <section v-if="screen === 'onboarding'" class="onboarding-screen">
      <img class="onboarding-image" :src="onboardingImage" alt="Steaming coffee surrounded by coffee beans" />
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div>
          <h1>Fall in Love with Coffee in Blissful Delight!</h1>
          <p>Welcome to our cozy coffee corner, where every cup is delightful for you.</p>
        </div>
        <button class="primary-button" type="button" @click="goTo('home')">Get Started</button>
      </div>
    </section>

    <HeroSection v-else-if="screen === 'home'" @open-detail="openDetail" @open-order="openOrder" />

    <section v-else-if="screen === 'detail'" class="detail-screen">
      <header class="screen-header">
        <button class="icon-button" type="button" aria-label="Back to home" @click="goTo('home')"><img class="back-icon" :src="backIcon" alt="" /></button>
        <strong>Detail</strong>
        <button class="icon-button" type="button" aria-label="Favorite product" @click="isFavorite = !isFavorite"><img :src="heartIcon" alt="" :class="{ favorite: isFavorite }" /></button>
      </header>
      <img class="detail-image" :src="selectedProduct.image" :alt="selectedProduct.name" />
      <div class="detail-heading">
        <div>
          <h1>{{ selectedProduct.name }}</h1>
          <p>{{ selectedProduct.type }}</p>
          <div class="rating-line"><img :src="starIcon" alt="" /><strong>4.8</strong><span>(230)</span></div>
        </div>
        <div class="feature-list" aria-label="Product features">
          <span><img :src="motorbikeIcon" alt="" /></span>
          <span><img :src="beanIcon" alt="" /></span>
          <span><img :src="packageIcon" alt="" /></span>
        </div>
      </div>
      <div class="divider"></div>
      <section class="description">
        <h2>Description</h2>
        <p>A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso coffee and 85ml of fresh milk {{ expandedDescription ? 'that creates its signature velvety texture.' : 'the fo..' }} <button type="button" @click="expandedDescription = !expandedDescription">{{ expandedDescription ? 'Read Less' : 'Read More' }}</button></p>
      </section>
      <section class="size-picker">
        <h2>Size</h2>
        <div>
          <button v-for="size in ['S', 'M', 'L']" :key="size" type="button" :class="{ selected: selectedSize === size }" @click="selectedSize = size">{{ size }}</button>
        </div>
      </section>
      <footer class="buy-bar">
        <div><span>Price</span><strong>{{ selectedProduct.price }}</strong></div>
        <button class="primary-button" type="button" @click="openOrder()">Buy Now</button>
      </footer>
    </section>

    <section v-else-if="screen === 'order'" class="order-screen">
      <header class="screen-header">
        <button class="icon-button" type="button" aria-label="Back to detail" @click="goTo('detail')"><img class="back-icon" :src="backIcon" alt="" /></button>
        <strong>Order</strong>
        <span class="header-spacer"></span>
      </header>
      <div class="delivery-type"><button type="button" :class="{ selected: deliveryMode === 'Deliver' }" @click="deliveryMode = 'Deliver'">Deliver</button><button type="button" :class="{ selected: deliveryMode === 'Pick Up' }" @click="deliveryMode = 'Pick Up'">Pick Up</button></div>
      <section class="address-section">
        <h2>Delivery Address</h2>
        <strong>Erik Jürgenstein</strong>
        <p>Kohtu tn 22, Kuressaare, 93812 Saare maakond,<br />Estonia</p>
        <div class="small-actions"><button type="button" @click="addressEditing = !addressEditing">⌑ {{ addressEditing ? 'Close Address' : 'Edit Address' }}</button><button type="button" @click="noteOpen = !noteOpen">▣ {{ noteOpen ? 'Close Note' : 'Add Note' }}</button></div>
        <input v-if="addressEditing" class="order-input" value="Kohtu tn 22, Kuressaare" aria-label="Edit delivery address" />
        <textarea v-if="noteOpen" class="order-input note-input" placeholder="Add a delivery note" aria-label="Delivery note"></textarea>
      </section>
      <div class="order-divider"></div>
      <section v-for="(item, index) in cartItems" :key="item.name" class="checkout-product">
        <img :src="item.image" :alt="item.name" />
        <div><strong>{{ item.name }}</strong><span>{{ item.type }}</span></div>
        <div class="quantity-control"><button type="button" :aria-label="`Decrease ${item.name} quantity`" @click="changeLineQuantity(index, -1)">−</button><strong>{{ item.quantity }}</strong><button type="button" :aria-label="`Increase ${item.name} quantity`" @click="changeLineQuantity(index, 1)">+</button></div>
      </section>
      <button class="discount-row" type="button" @click="discountApplied = !discountApplied"><span>✧</span>{{ discountApplied ? '1 Discount is Applies' : 'Add discount' }}<strong>›</strong></button>
      <section class="payment-summary"><h2>Payment Summary</h2><div><span>Price</span><strong>{{ cartSubtotal.toFixed(2) }}€</strong></div><div><span>{{ deliveryMode === 'Deliver' ? 'Delivery Fee' : 'Pickup Fee' }}</span><strong>{{ deliveryFee }}€</strong></div><div v-if="discountApplied"><span>Discount</span><strong>-{{ discountAmount.toFixed(2) }}€</strong></div><div class="summary-total"><span>Total</span><strong>{{ total }}€</strong></div></section>
      <p v-if="orderNotice" class="order-notice" role="status">{{ orderNotice }}</p>
      <footer class="payment-bar">
        <button class="payment-method" type="button" @click="paymentOpen = !paymentOpen"><span class="wallet-icon">▱</span><span><strong>{{ paymentMethod }}</strong><b>5.53€</b></span><span>{{ paymentOpen ? '⌃' : '⌄' }}</span></button>
        <div v-if="paymentOpen" class="payment-options"><button type="button" :class="{ selected: paymentMethod === 'Cash' }" @click="paymentMethod = 'Cash'">Cash</button><button type="button" :class="{ selected: paymentMethod === 'Wallet' }" @click="paymentMethod = 'Wallet'">Wallet</button></div>
        <button class="primary-button" type="button" @click="goTo('delivery')">Order</button>
      </footer>
    </section>

    <section v-else class="delivery-screen">
      <img class="map-image" :src="mapImage" alt="Map showing delivery route" />
      <img class="route-image" :src="routeIcon" alt="" />
      <img class="location-pin" :src="locationIcon" alt="Delivery location" />
      <button class="map-back icon-button" type="button" aria-label="Back to order" @click="goTo('order')"><img :src="backIcon" alt="" /></button>
      <button class="map-gps" type="button" aria-label="Center delivery map" @click="mapCentered = !mapCentered">{{ mapCentered ? '✓' : '◎' }}</button>
      <div class="delivery-panel">
        <span class="panel-indicator"></span>
        <div class="delivery-time"><strong>10 minutes left</strong><span>Delivery to <b>Erik Jürgenstein</b></span></div>
        <div class="progress"><i></i><i></i><i></i><i></i></div>
        <div class="delivered-card"><span class="delivery-icon"><img :src="motorbikeIcon" alt="" /></span><div><strong>Delivered your order</strong><p>We will deliver your goods to you in the shortes possible time.</p></div></div>
        <div class="courier-row"><img :src="courierImage" alt="Brooklyn Simmons" /><div><strong>Brooklyn Simmons</strong><span>Personal Courier</span></div><a class="call-button" href="tel:+3725550123" aria-label="Call courier">⌕</a></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap');
@import '../styles/tokens.css';

.coffee-app { min-height: 100vh; color: var(--color-coffee-text); background: var(--color-coffee-night); font-family: 'Sora', sans-serif; }
.onboarding-screen { animation: screen-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both; }
button { font: inherit; cursor: pointer; }
.primary-button { border: 0; border-radius: 16px; padding: 16px 20px; color: #fff; background: var(--color-coffee-primary); font-weight: 600; font-size: 16px; transition: transform 160ms ease, filter 160ms ease; }
.primary-button:hover, .primary-button:focus-visible { filter: brightness(1.1); transform: translateY(-2px); }
.primary-button:active { transform: translateY(1px) scale(0.98); }
.onboarding-screen { width: min(100%, var(--size-screen-width)); min-height: 812px; margin: auto; overflow: hidden; position: relative; background: #050505; }
.onboarding-image { display: block; width: 100%; height: 536px; object-fit: cover; object-position: center; animation: onboarding-drift 8s ease-in-out infinite alternate; }
.onboarding-overlay { height: 360px; position: absolute; inset: 452px 0 0; background: linear-gradient(transparent, #050505 24%); }
.onboarding-content { display: flex; flex-direction: column; justify-content: space-between; height: 336px; padding: 24px; position: absolute; inset: 476px 0 0; text-align: center; }
.onboarding-content h1 { margin: 0; font-size: 32px; line-height: 1.5; letter-spacing: .16px; }
.onboarding-content p { margin: 8px 0 0; color: var(--color-coffee-muted); font-size: 14px; line-height: 1.5; }
.onboarding-content .primary-button { width: 100%; }
.screen-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; margin-bottom: 24px; text-align: center; }
.screen-header strong { font-size: 16px; }
.icon-button { display: grid; width: 44px; height: 44px; place-items: center; border: 0; border-radius: 12px; background: transparent; }
.icon-button img { width: 24px; height: 24px; }
.icon-button img.back-icon { transform: rotate(90deg); }
.icon-button img.favorite { filter: invert(41%) sepia(61%) saturate(1049%) hue-rotate(210deg); }
.header-spacer { width: 44px; }
.detail-screen, .order-screen { width: min(100%, var(--size-screen-width)); min-height: 812px; margin: auto; padding: 68px 24px 118px; position: relative; background: var(--color-coffee-night); box-sizing: border-box; }
.detail-image { display: block; width: 100%; height: 202px; border-radius: 16px; object-fit: cover; }
.detail-heading { display: flex; justify-content: space-between; gap: 16px; margin-top: 16px; }
h1, h2, p { margin-top: 0; }
.detail-heading h1 { margin-bottom: 4px; font-size: 20px; }
.detail-heading p { margin-bottom: 16px; font-size: 12px; }
.rating-line { display: flex; align-items: center; gap: 4px; font-size: 16px; }
.rating-line img { width: 20px; height: 20px; }
.rating-line span { font-size: 12px; }
.feature-list { display: flex; align-items: center; gap: 12px; padding-top: 20px; }
.feature-list span { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; background: var(--color-coffee-primary); }
.feature-list img { width: 24px; height: 24px; object-fit: contain; filter: brightness(0) invert(1); }
.feature-list span:first-child img { width: 32px; height: 32px; }
.divider { height: 1px; margin: 16px; background: #e3e3e3; }
.description h2, .size-picker h2, .payment-summary h2, .address-section h2 { margin-bottom: 8px; font-size: 16px; }
.description p { margin-bottom: 0; font-size: 14px; line-height: 1.5; }
.description button { padding: 0; border: 0; color: var(--color-coffee-primary); background: transparent; font-weight: 600; }
.size-picker { margin-top: 24px; }
.size-picker > div { display: flex; gap: 16px; }
.size-picker button { width: 96px; height: 41px; border: 1px solid #e3e3e3; border-radius: 12px; color: #fff; background: transparent; }
.size-picker button.selected { background: var(--color-coffee-primary); }
.size-picker button { transition: color 160ms ease, background-color 160ms ease, transform 160ms ease; }
.size-picker button:hover, .size-picker button:focus-visible { transform: translateY(-2px); }
.buy-bar, .payment-bar { display: flex; align-items: center; gap: 24px; padding: 16px 24px 46px; border-radius: 16px 16px 0 0; position: fixed; right: max(0px, calc((100vw - 375px) / 2)); bottom: 0; left: max(0px, calc((100vw - 375px) / 2)); z-index: 10; pointer-events: auto; background: var(--color-coffee-night); }
.buy-bar > div { display: flex; flex-direction: column; gap: 4px; min-width: 86px; }
.buy-bar span { font-size: 14px; }
.buy-bar strong { color: var(--color-coffee-primary); font-size: 18px; }
.buy-bar .primary-button { flex: 1; position: relative; z-index: 1; }
.order-screen { padding-bottom: 190px; }
.delivery-type { display: flex; gap: 16px; margin-bottom: 28px; }
.delivery-type button { flex: 1; height: 35px; border: 0; border-radius: 8px; background: #ededed; font-size: 16px; }
.delivery-type button.selected { color: #fff; background: var(--color-coffee-primary); font-weight: 600; }
.address-section strong { display: block; margin-top: 20px; font-size: 14px; }
.address-section p { margin: 4px 0; font-size: 12px; }
.small-actions { display: flex; gap: 8px; }
.small-actions button { padding: 4px 12px; border: 1px solid #fff; border-radius: 16px; color: #fff; background: var(--color-coffee-primary); font-size: 12px; }
.order-input { width: 100%; margin-top: 8px; padding: 8px 10px; border: 1px solid #777; border-radius: 8px; color: #fff; background: #242424; box-sizing: border-box; font: inherit; font-size: 12px; }
.note-input { min-height: 48px; resize: vertical; }
.order-divider { height: 4px; margin: 12px -24px 16px; background: #e3e3e3; }
.checkout-product { display: flex; align-items: center; gap: 16px; }
.checkout-product + .checkout-product { margin-top: 16px; }
.checkout-product > img { width: 54px; height: 54px; border-radius: 10px; object-fit: cover; }
.checkout-product > div:nth-child(2) { display: flex; flex: 1; flex-direction: column; gap: 4px; font-size: 14px; }
.checkout-product > div:nth-child(2) span { font-size: 12px; }
.quantity-control { display: flex; align-items: center; gap: 16px; }
.quantity-control button { display: grid; width: 24px; height: 24px; padding: 0; place-items: center; border: 0; border-radius: 50%; color: #313131; background: #fff; font-size: 18px; line-height: 1; text-align: center; }
.discount-row { display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 28px; padding: 16px; border: 1px solid #fff; border-radius: 16px; color: #fff; background: transparent; text-align: left; }
.discount-row span { color: var(--color-coffee-primary); font-size: 22px; }
.discount-row strong { margin-left: auto; font-size: 24px; font-weight: 400; }
.payment-summary { margin-top: 26px; }
.payment-summary > div { display: flex; justify-content: space-between; margin-top: 12px; font-size: 14px; }
.order-notice { margin: 16px 0 0; color: #d8d8d8; font-size: 12px; text-align: center; }
.payment-bar { display: block; padding-bottom: 46px; }
.payment-method { display: flex; align-items: center; gap: 12px; width: 100%; padding: 0 0 16px; border: 0; color: #fff; background: transparent; text-align: left; }
.payment-method > span:nth-child(2) { display: flex; flex: 1; flex-direction: column; gap: 4px; }
.payment-method b { color: var(--color-coffee-primary); font-size: 12px; }
.wallet-icon { color: var(--color-coffee-primary); font-size: 24px; }
.payment-options { display: flex; gap: 8px; padding-bottom: 12px; }
.payment-options button { flex: 1; padding: 8px; border: 1px solid #555; border-radius: 8px; color: #fff; background: #242424; transition: background-color 160ms ease, border-color 160ms ease; }
.payment-options button.selected { border-color: var(--color-coffee-primary); background: var(--color-coffee-primary); }
.payment-bar .primary-button { width: 100%; position: relative; z-index: 1; }
.delivery-screen { width: min(100%, var(--size-screen-width)); min-height: 812px; margin: auto; overflow: hidden; position: relative; background: #fff; }
.map-image { display: block; width: 100%; height: 100%; min-height: 812px; object-fit: cover; }
.route-image { width: 171px; position: absolute; top: 168px; left: 82px; }
.location-pin { width: 24px; position: absolute; top: 211px; left: 66px; }
.map-back, .map-gps { position: absolute; top: 68px; background: #ededed; }
.map-back { left: 24px; }
.map-gps { display: grid; width: 44px; height: 44px; place-items: center; border: 0; border-radius: 12px; right: 24px; font-size: 28px; }
.delivery-panel { min-height: 322px; padding: 16px 24px 34px; border-radius: 24px 24px 0 0; position: absolute; right: 0; bottom: 0; left: 0; background: var(--color-coffee-night); box-sizing: border-box; }
.panel-indicator { display: block; width: 45px; height: 5px; margin: 0 auto 16px; border-radius: 16px; background: #e3e3e3; }
.delivery-time { display: flex; flex-direction: column; gap: 2px; align-items: center; margin-bottom: 24px; }
.delivery-time strong { font-size: 16px; }
.delivery-time span { font-size: 12px; }
.progress { display: flex; gap: 10px; margin-bottom: 16px; }
.progress i { height: 4px; flex: 1; border-radius: 20px; background: var(--color-coffee-primary); }
.progress i:last-child { background: #e3e3e3; }
.delivered-card { display: flex; align-items: center; gap: 16px; padding: 8px 16px 8px 12px; border: 1px solid #e3e3e3; border-radius: 12px; }
.delivery-icon { display: grid; width: 56px; height: 56px; place-items: center; border: 1px solid #e3e3e3; border-radius: 12px; }
.delivery-icon img { width: 32px; filter: brightness(0) saturate(100%) invert(37%) sepia(45%) saturate(1216%) hue-rotate(201deg); }
.delivered-card strong { font-size: 14px; }
.delivered-card p { max-width: 220px; margin: 4px 0 0; font-size: 12px; line-height: 1.5; }
.courier-row { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
.courier-row > img { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; }
.courier-row > div { display: flex; flex: 1; flex-direction: column; gap: 4px; }
.courier-row > div span { font-size: 12px; }
.call-button { display: grid; width: 44px; height: 44px; place-items: center; border: 1px solid #e3e3e3; border-radius: 12px; color: #fff; text-decoration: none; font-size: 28px; }
.summary-total { padding-top: 12px; border-top: 1px solid #3a3a3a; font-weight: 600; }
@keyframes screen-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes onboarding-drift { from { transform: scale(1); } to { transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) {
  .onboarding-screen, .primary-button, .size-picker button, .payment-options button { animation: none; transition: none; }
  .onboarding-image { animation: none; }
}
@media (max-width: 390px) { .feature-list { gap: 6px; } .feature-list span { width: 40px; height: 40px; } .size-picker button { width: calc((100vw - 80px) / 3); } }
</style>
