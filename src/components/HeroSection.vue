<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTransientNotice } from '@/composables/useTransientNotice'
import { catalogAssets, categories, products } from '@/data/coffee'
import type { CartLine, CoffeeProduct } from '@/types/coffee'

const props = defineProps<{
  cartItems: readonly CartLine[]
  favoriteNames: readonly string[]
}>()

const emit = defineEmits<{
  (event: 'open-detail', product: CoffeeProduct): void
  (event: 'open-order'): void
  (event: 'add-product', product: CoffeeProduct): void
}>()

const activeCategory = ref<(typeof categories)[number]>('All Coffee')
const searchQuery = ref('')
const savedOnly = ref<boolean>(false)
const brandTapCount = ref(0)
const { notice, showNotice } = useTransientNotice(2200)

const cartCount = computed(() => props.cartItems.reduce((count, item) => count + item.quantity, 0))

const visibleProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return products.filter((product) => {
    const matchesCategory = activeCategory.value === 'All Coffee' || product.category === activeCategory.value
    const matchesSearch = !query || `${product.name} ${product.type}`.toLowerCase().includes(query)
    const matchesSaved = !savedOnly.value || props.favoriteNames.includes(product.name)
    return matchesCategory && matchesSearch && matchesSaved
  })
})

function addToCart(product: CoffeeProduct): void {
  emit('add-product', product)
  showNotice(`${product.name} added to your bag`)
}

function showMenu(): void {
  savedOnly.value = false
  activeCategory.value = 'All Coffee'
  searchQuery.value = ''
}

function showSaved(): void {
  savedOnly.value = true
  activeCategory.value = 'All Coffee'
  searchQuery.value = ''
}

function cycleCategory() {
  const currentIndex = categories.indexOf(activeCategory.value)
  activeCategory.value = categories[(currentIndex + 1) % categories.length]!
  showNotice(`Showing ${activeCategory.value.toLowerCase()}`)
}

function tapBrand(): void {
  brandTapCount.value += 1
  if (brandTapCount.value < 5) return

  brandTapCount.value = 0
  showNotice('The coffee beans formed a union. Your latte is negotiating a raise.')
}
</script>

<template>
  <section class="coffee-screen" aria-label="Coffee shop home">
    <div class="top-area">
      <div class="location-block">
        <button class="eyebrow brand-easter-egg" type="button" aria-label="Coffee Corner" @click="tapBrand">
          COFFEE CORNER · KURESSAARE
        </button>
        <h1>Your daily coffee.</h1>
        <p>Find your favorite, freshly brewed.</p>
      </div>

      <div class="search-row">
        <label class="search-field">
          <span class="search-glyph" aria-hidden="true"></span>
          <input
            v-model="searchQuery"
            type="search"
            data-testid="coffee-search"
            placeholder="Find your next coffee"
            aria-label="Search coffee"
          />
        </label>
        <button class="filter-button" type="button" aria-label="Next coffee category" data-testid="category-cycle" @click="cycleCategory">
          <img :src="catalogAssets.filter" alt="" />
        </button>
      </div>

      <div class="promo-banner">
        <img :src="catalogAssets.banner" alt="Coffee cups" />
        <div class="promo-copy">
          <span>€0.50 off your order</span>
          <strong>Your daily ritual,<br />a little sweeter.</strong>
        </div>
      </div>
    </div>

    <div class="catalog">
      <p v-if="notice" class="home-notice" role="status" data-testid="cart-notice">{{ notice }}</p>
      <div class="catalog-heading"><h2>{{ savedOnly ? 'Your saved coffees' : 'Made for your day' }}</h2><span>{{ visibleProducts.length }} coffees</span></div>
      <div class="category-list" role="group" aria-label="Coffee categories">
        <button
          v-for="category in categories"
          :key="category"
          class="category-button"
          :class="{ active: activeCategory === category }"
          type="button"
          :data-testid="`category-${category}`"
          :aria-pressed="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <TransitionGroup
        name="product"
        tag="div"
        class="product-grid"
      >
        <article
          v-for="product in visibleProducts"
          :key="product.name"
          class="product-card"
        >
          <button
            class="product-open"
            type="button"
            :data-testid="`product-${product.name}`"
            :aria-label="`View ${product.name}`"
            @click="emit('open-detail', product)"
          >
            <span class="product-image-wrap">
              <img class="product-image" :src="product.image" alt="" />
              <span class="rating"><img :src="catalogAssets.star" alt="" />4.8</span>
            </span>
            <span class="product-name">{{ product.name }}</span>
            <span class="product-type">{{ product.type }}</span>
          </button>
          <div class="product-price-row">
            <strong>{{ product.price }}</strong>
            <button
              class="add-button"
              type="button"
              :data-testid="`add-${product.name}`"
              :aria-label="`Add ${product.name}`"
              @click="addToCart(product)"
            >
              <img :src="catalogAssets.plus" alt="" />
            </button>
          </div>
        </article>
        <div
          v-if="visibleProducts.length === 0"
          key="empty-state"
          class="empty-state"
          data-testid="catalog-empty"
        >
          <strong>{{ savedOnly ? 'Your favorites live here' : 'No coffee found' }}</strong>
          <p>{{ savedOnly ? 'Tap the heart on a coffee to save it for later.' : 'Try another name or browse all coffees.' }}</p>
          <button type="button" data-testid="browse-all" @click="showMenu">Browse all coffees</button>
        </div>
      </TransitionGroup>
    </div>

    <nav class="bottom-nav" aria-label="Primary navigation">
      <button class="nav-item" :class="{ active: !savedOnly }" type="button" data-testid="nav-menu" aria-label="Browse coffees" :aria-pressed="!savedOnly" @click="showMenu">
        <img :src="catalogAssets.home" alt="" /><span>Explore</span>
      </button>
      <button class="nav-item" :class="{ active: savedOnly }" type="button" data-testid="nav-saved" aria-label="Saved coffees" :aria-pressed="savedOnly" @click="showSaved">
        <img :src="catalogAssets.heart" alt="" /><span>Saved</span>
      </button>
      <button class="nav-item cart-nav" type="button" data-testid="nav-cart" aria-label="Open shopping bag" @click="cartCount ? emit('open-order') : showNotice('Your bag is empty. Add a coffee to get started.')">
        <img :src="catalogAssets.bag" alt="" /><span>My bag</span>
        <span v-if="cartCount" class="cart-count" data-testid="cart-count">{{ cartCount }}</span>
      </button>
    </nav>
  </section>
</template>

<style scoped>
.coffee-screen {
  min-height: 100dvh;
  max-width: var(--size-screen-width);
  margin: auto;
  color: var(--color-coffee-text);
  background: var(--color-coffee-night);
}

.top-area {
  padding: var(--space-screen-top) 24px 0;
  background: radial-gradient(ellipse at top left, #292638 0%, transparent 75%);
}

.eyebrow {
  color: #c4b69f;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.8px;
}

.brand-easter-egg {
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.location-block h1 {
  margin: 12px 0 8px;
  font-size: clamp(28px, 8vw, 34px);
  line-height: 1.2;
  letter-spacing: -1px;
}

.location-block p {
  color: var(--color-coffee-muted);
  font-size: 13px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--color-coffee-border);
  border-radius: 16px;
  background: var(--color-coffee-surface);
}

.search-field:focus-within {
  border-color: #a5a8ff;
}

.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 0;
  color: #fff;
  background: transparent;
  font-size: 13px;
}

.search-field input::placeholder {
  color: var(--color-coffee-muted);
}

.search-glyph {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border: 1.5px solid #c4c3ce;
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
  background: #c4c3ce;
}

.filter-button {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  place-items: center;
  border: 0;
  border-radius: 16px;
  background: var(--color-coffee-primary);
}

.filter-button img {
  width: 20px;
  height: 20px;
}

.promo-banner {
  height: 120px;
  margin-top: 20px;
  overflow: hidden;
  border-radius: 20px;
  position: relative;
}

.promo-banner > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promo-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #38251dd9, transparent);
}

.promo-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  z-index: 1;
  top: 20px;
  left: 18px;
}

.promo-copy span {
  color: #ffe2b6;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
}

.promo-copy strong {
  max-width: 240px;
  font-size: 24px;
  line-height: 1.25;
  letter-spacing: -0.5px;
}

.catalog {
  padding: 20px 24px 120px;
}

.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.catalog-heading h2 {
  font-size: 18px;
  letter-spacing: -0.4px;
}

.catalog-heading > span {
  color: var(--color-coffee-muted);
  font-size: 11px;
  white-space: nowrap;
}

.home-notice {
  position: fixed;
  z-index: 20;
  bottom: calc(92px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100% - 32px), 392px);
  padding: 12px 16px;
  border: 1px solid #777add;
  border-radius: 14px;
  background: #292941;
  color: #fff;
  box-shadow: 0 8px 24px #0006;
  font-size: 13px;
  text-align: center;
}

.category-list {
  display: flex;
  justify-content: safe center;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: thin;
  scrollbar-color: #444454 transparent;
}

.category-button {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--color-coffee-border);
  border-radius: 12px;
  color: #bfbecb;
  background: var(--color-coffee-surface);
  font-size: 12px;
  transition:
    color 320ms ease,
    background-color 320ms ease,
    border-color 320ms ease,
    transform 320ms ease,
    box-shadow 320ms ease;
}

.category-button.active {
  color: #fff;
  background: var(--color-coffee-primary);
  border-color: var(--color-coffee-primary);
  box-shadow: 0 4px 14px #6468df40;
  font-weight: 600;
  transform: scale(1.03);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
  margin-top: 16px;
  position: relative;
}

.product-enter-active,
.product-leave-active,
.product-move {
  transition:
    opacity 520ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.product-enter-from,
.product-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.product-leave-active {
  position: absolute;
}

.product-card {
  min-width: 0;
  padding: 8px 8px 12px;
  border: 1px solid #ffffff08;
  border-radius: 20px;
  background: var(--color-coffee-surface);
  transition: border-color 160ms ease;
}

.product-card:hover {
  border-color: #6468df80;
}

.product-open {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  border-radius: 12px;
  background: transparent;
  color: #fff;
  text-align: left;
}

.product-image-wrap {
  display: block;
  height: clamp(128px, 35vw, 164px);
  overflow: hidden;
  border-radius: 14px;
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
  padding: 6px 8px;
  border-radius: 10px;
  position: absolute;
  top: 6px;
  right: 6px;
  color: #fff;
  background: #16151bcc;
  font-size: 10px;
  font-weight: 600;
}

.rating img {
  width: 12px;
  height: 12px;
}

.product-name {
  display: block;
  margin: 12px 2px 2px;
  font-size: 14px;
  font-weight: 600;
}

.product-type {
  display: block;
  margin: 0 2px;
  color: var(--color-coffee-muted);
  font-size: 11px;
}

.product-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin: 10px 2px 0;
}

.product-price-row strong {
  font-size: 16px;
  white-space: nowrap;
}

.add-button {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border: 0;
  border-radius: 13px;
  background: var(--color-coffee-primary);
}

.add-button img {
  width: 16px;
  height: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 32px 16px;
  border: 1px dashed var(--color-coffee-border);
  border-radius: 20px;
  text-align: center;
}

.empty-state p {
  margin: 8px 0 16px;
  color: var(--color-coffee-muted);
  font-size: 13px;
}

.empty-state button {
  min-height: 44px;
  padding: 10px 16px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: var(--color-coffee-primary);
}

.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-coffee-border);
  border-radius: 24px 24px 0 0;
  position: fixed;
  right: max(0px, calc((100vw - var(--size-screen-width)) / 2));
  bottom: 0;
  left: max(0px, calc((100vw - var(--size-screen-width)) / 2));
  z-index: 10;
  background: #1b1b24f5;
  backdrop-filter: blur(16px);
}

.nav-item {
  display: flex;
  min-width: 72px;
  min-height: 52px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  border: 0;
  border-radius: 14px;
  position: relative;
  color: var(--color-coffee-muted);
  background: transparent;
  font-size: 10px;
}

.nav-item.active {
  background: #6468df1f;
  color: #b3b5ff;
}

.nav-item img {
  width: 22px;
  height: 22px;
}

.cart-count {
  display: grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  padding: 0 4px;
  border: 2px solid #1b1b24;
  border-radius: 20px;
  position: absolute;
  top: 0;
  right: 16px;
  color: #fff;
  background: var(--color-coffee-primary);
  font-size: 9px;
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .category-button,
  .product-enter-active,
  .product-leave-active,
  .product-move {
    transition: none;
  }

  .category-button.active {
    transform: none;
  }
}
</style>
