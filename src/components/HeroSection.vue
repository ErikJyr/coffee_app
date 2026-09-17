<script setup lang="ts">
import { computed, ref } from 'vue'

type CoffeeProduct = {
  name: string
  type: string
  price: string
  category: string
  image: string
  warm?: boolean
}

type CartLine = CoffeeProduct & { quantity: number }

const emit = defineEmits<{
  (event: 'open-detail', product: CoffeeProduct): void
  (event: 'open-order', items: CartLine[]): void
}>()

const imageCoffee2 = 'https://www.figma.com/api/mcp/asset/20e69cc5-11bd-4cc1-9ed2-527012e2508b.png'
const imageCoffee3 = 'https://www.figma.com/api/mcp/asset/78dcb04c-4656-4bd6-8ace-e555f83e15ef.png'
const imageCoffee4 = 'https://www.figma.com/api/mcp/asset/a0e142c3-1dc9-4099-a2f5-b77e0e287d13.png'
const imageCoffee5 = 'https://www.figma.com/api/mcp/asset/909b84fd-4c26-4681-a4b3-0b9175cb442c.png'
const bannerImage = 'https://www.figma.com/api/mcp/asset/7f3fda68-a204-497e-9f35-4f99798e11d5.png'
const starIcon = 'https://www.figma.com/api/mcp/asset/b4edec5e-8d65-456e-b4b0-a7ba7ae2b8a7.svg'
const plusIcon = 'https://www.figma.com/api/mcp/asset/9f1035c3-39cd-4c18-af46-7b026143bec2.svg'
const arrowDownIcon = 'https://www.figma.com/api/mcp/asset/327fc650-6a35-4b9c-a1f4-278e039b50fa.svg'
const filterIcon = 'https://www.figma.com/api/mcp/asset/d42147f6-06d7-4ff1-9bde-f870718671fa.svg'
const homeIcon = 'https://www.figma.com/api/mcp/asset/e04dd923-6cbf-4d1c-b25b-b24dca753989.svg'
const heartIcon = 'https://www.figma.com/api/mcp/asset/8efe51a4-847a-4792-937b-028978a3461a.svg'
const bagIcon = 'https://www.figma.com/api/mcp/asset/e8cfea80-dd60-48e9-a44d-dfad3b5600a2.svg'
const notificationIcon = 'https://www.figma.com/api/mcp/asset/f754a3e9-3bc5-4aee-bd59-4e403a72ce6c.svg'

const categories = ['All Coffee', 'Machiato', 'Latte', 'Americano']
const activeCategory = ref('All Coffee')
const searchQuery = ref('')
const cartItems = ref<CartLine[]>([])
const location = ref('Estonia, Kuressaare')
const notice = ref('')
let noticeTimer: number | undefined

const products: CoffeeProduct[] = [
  { name: 'Caffe Mocha', type: 'Deep Foam', price: '4.53€', category: 'All Coffee', image: imageCoffee2 },
  { name: 'Flat White', type: 'Espresso', price: '3.53€', category: 'Latte', image: imageCoffee3 },
  { name: 'Caffe Panna', type: 'Ice/Hot', price: '5.53€', category: 'Machiato', image: imageCoffee4, warm: true },
  { name: 'Mocha Fusi', type: 'Ice/Hot', price: '7.53€', category: 'Americano', image: imageCoffee5, warm: true },
]

const cartCount = computed(() => cartItems.value.reduce((count, item) => count + item.quantity, 0))

const visibleProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return products.filter((product) => {
    const matchesCategory = activeCategory.value === 'All Coffee' || product.category === activeCategory.value
    const matchesSearch = !query || `${product.name} ${product.type}`.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })
})

function addToCart(product: CoffeeProduct) {
  const existingItem = cartItems.value.find((item) => item.name === product.name)

  if (existingItem) {
    existingItem.quantity += 1
    return
  }

  cartItems.value.push({ ...product, quantity: 1 })
}

function showNotice(message: string) {
  if (noticeTimer) {
    window.clearTimeout(noticeTimer)
  }
  notice.value = message
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
    noticeTimer = undefined
  }, 2200)
}

function cycleCategory() {
  const currentIndex = categories.indexOf(activeCategory.value)
  activeCategory.value = categories[(currentIndex + 1) % categories.length]!
  showNotice(`Showing ${activeCategory.value.toLowerCase()}`)
}
</script>

<template>
  <section class="coffee-screen" aria-label="Coffee shop home">
    <div class="top-area">
      <div class="location-block">
        <span class="eyebrow">Location</span>
        <button class="location-button" type="button" @click="location = location === 'Estonia, Kuressaare' ? 'Tallinn, Estonia' : 'Estonia, Kuressaare'">
          {{ location }}
          <img :src="arrowDownIcon" alt="" />
        </button>
      </div>

      <div class="search-row">
        <label class="search-field">
          <span class="search-glyph" aria-hidden="true"></span>
          <input v-model="searchQuery" type="search" placeholder="Search coffee" aria-label="Search coffee" />
        </label>
        <button class="filter-button" type="button" aria-label="Filter coffee" @click="cycleCategory">
          <img :src="filterIcon" alt="" />
        </button>
      </div>

      <div class="promo-banner">
        <img :src="bannerImage" alt="Coffee cups" />
        <div class="promo-copy">
          <span>Promo</span>
          <strong>Buy one get one FREE</strong>
        </div>
      </div>
    </div>

    <main class="catalog">
      <p v-if="notice" class="home-notice" role="status">{{ notice }}</p>
      <div class="category-list" role="tablist" aria-label="Coffee categories">
        <button
          v-for="category in categories"
          :key="category"
          class="category-button"
          :class="{ active: activeCategory === category }"
          type="button"
          role="tab"
          :aria-selected="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div class="product-grid">
        <article v-for="(product, index) in visibleProducts" :key="product.name" class="product-card" :style="{ '--card-index': index }" @click="emit('open-detail', product)">
          <div class="product-image-wrap">
            <img class="product-image" :src="product.image" :alt="product.name" />
            <span class="rating"><img :src="starIcon" alt="" />4.8</span>
          </div>
          <div class="product-detail">
            <div>
              <h2>{{ product.name }}</h2>
              <p>{{ product.type }}</p>
            </div>
            <div class="product-price-row">
              <strong>{{ product.price }}</strong>
              <button class="add-button" :class="{ warm: product.warm }" type="button" :aria-label="`Add ${product.name}`" @click.stop="addToCart(product)">
                <img :src="plusIcon" alt="" />
              </button>
            </div>
          </div>
        </article>
        <p v-if="visibleProducts.length === 0" class="empty-state">No coffee found.</p>
      </div>
    </main>

    <nav class="bottom-nav" aria-label="Primary navigation">
      <button class="nav-item active" type="button" aria-label="Home" @click="showNotice('You are viewing home')">
        <img :src="homeIcon" alt="" />
        <span class="nav-dot"></span>
      </button>
      <button class="nav-item" type="button" aria-label="Favorites" @click="showNotice('Favorites are ready for your next coffee')"><img :src="heartIcon" alt="" /></button>
      <button class="nav-item cart-nav" type="button" aria-label="Cart" @click="cartCount ? emit('open-order', cartItems) : showNotice('Your cart is empty')">
        <img :src="bagIcon" alt="" />
        <span v-if="cartCount" class="cart-count">{{ cartCount }}</span>
      </button>
      <button class="nav-item" type="button" aria-label="Notifications" @click="showNotice('You are all caught up')"><img :src="notificationIcon" alt="" /></button>
    </nav>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600&display=swap');
@import '../styles/tokens.css';

:global(body) {
  margin: 0;
  background: #f9f9f9;
}

.coffee-screen {
  --accent: var(--color-coffee-primary);
  --surface: var(--color-coffee-night);
  --muted: var(--color-coffee-muted);
  min-height: 812px;
  max-width: var(--size-screen-width);
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  color: #fff;
  background: var(--surface);
  font-family: 'Sora', sans-serif;
}

.top-area {
  padding: var(--space-screen-top) var(--space-5) 0;
}

.location-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eyebrow {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.2;
}

button,
input {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.location-button {
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 0;
  color: #d8d8d8;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
}

.location-button img {
  width: 14px;
  height: 14px;
}

.search-row {
  display: flex;
  gap: var(--space-4);
  margin-top: 26px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: #2a2a2a;
}

.search-field input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  color: #fff;
  background: transparent;
  font-size: 14px;
}

.search-field input::placeholder {
  color: var(--muted);
}

.search-glyph {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  position: relative;
}

.search-glyph::after {
  content: '';
  width: 6px;
  height: 1.5px;
  position: absolute;
  right: -4px;
  bottom: -2px;
  transform: rotate(45deg);
  background: #fff;
}

.filter-button {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  place-items: center;
  border-radius: 12px;
  background: var(--accent);
}

.filter-button img {
  width: 20px;
  height: 20px;
}

.promo-banner {
  height: var(--size-promo-height);
  margin-top: 27px;
  overflow: hidden;
  border-radius: 16px;
  position: relative;
}

.promo-banner > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promo-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: absolute;
  top: 5px;
  left: 7px;
}

.promo-copy span {
  width: fit-content;
  padding: 4px 6px;
  border-radius: 8px;
  background: var(--accent);
  font-size: 14px;
  font-weight: 600;
}

.promo-copy strong {
  max-width: 210px;
  font-size: 32px;
  line-height: 1.05;
}

.catalog {
  padding: calc(var(--space-5) - var(--space-1) + 2px) var(--space-5) 120px;
}

.home-notice {
  margin: -8px 0 12px;
  color: #d8d8d8;
  font-size: 12px;
  text-align: center;
}

.category-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.category-list::-webkit-scrollbar {
  display: none;
}

.category-button {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 6px;
  color: #313131;
  background: #ededed;
  font-size: 14px;
}

.category-button.active {
  color: #fffcfc;
  background: var(--accent);
  font-weight: 600;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5) var(--space-4);
  margin-top: var(--space-4);
}

.product-card {
  min-width: 0;
  padding: 8px 8px 12px;
  border-radius: 16px;
  background: rgba(255, 252, 252, 0.05);
  animation: product-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--card-index) * 70ms);
  transition: transform 180ms ease, background-color 180ms ease;
}

.product-card:hover {
  background: rgba(255, 252, 252, 0.09);
  transform: translateY(-3px);
}

.product-image-wrap {
  height: var(--size-product-image);
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 0 12px 0 24px;
  position: absolute;
  top: 0;
  right: 0;
  color: rgba(255, 252, 252, 0.8);
  background: rgba(17, 17, 17, 0.45);
  font-size: 8px;
  font-weight: 600;
}

.rating img {
  width: 12px;
  height: 12px;
}

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.product-detail h2,
.product-detail p {
  margin: 0;
}

.product-detail h2 {
  overflow: hidden;
  font-size: 16px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-detail p {
  margin-top: 4px;
  color: #fff;
  font-size: 12px;
  line-height: 1.2;
}

.product-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-price-row strong {
  font-size: 18px;
  white-space: nowrap;
}

.add-button {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 8px;
  background: var(--accent);
  transition: transform 160ms ease, filter 160ms ease;
}

.add-button:hover,
.add-button:focus-visible {
  filter: brightness(1.12);
  transform: scale(1.06);
}

.add-button:active,
.filter-button:active,
.nav-item:active {
  transform: scale(0.94);
}

.add-button.warm {
  background: var(--accent);
}

.add-button img {
  width: 16px;
  height: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  color: var(--muted);
  text-align: center;
}

.bottom-nav {
  display: flex;
  height: 99px;
  align-items: flex-start;
  justify-content: center;
  gap: 56px;
  padding: 24px;
  border-radius: 24px 24px 0 0;
  position: fixed;
  right: max(0px, calc((100vw - 375px) / 2));
  bottom: 0;
  left: max(0px, calc((100vw - 375px) / 2));
  z-index: 2;
  background: var(--surface);
}

.nav-item {
  display: flex;
  width: 24px;
  height: 51px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  position: relative;
  background: transparent;
  transition: transform 160ms ease;
}

.nav-item img {
  width: 24px;
  height: 24px;
}

.nav-dot {
  width: 10px;
  height: 5px;
  border-radius: 18px;
  background: var(--accent);
}

.cart-count {
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border: 2px solid var(--surface);
  border-radius: 50%;
  position: absolute;
  top: -7px;
  right: -8px;
  color: #fff;
  background: var(--accent);
  font-size: 9px;
}

@media (max-width: 390px) {
  .bottom-nav {
    gap: clamp(32px, 14vw, 56px);
  }
}

@keyframes product-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .product-card { animation: none; transition: none; }
  .add-button, .nav-item { transition: none; }
}
</style>