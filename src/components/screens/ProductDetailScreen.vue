<script setup lang="ts">
import { appAssets, productSizes } from '@/data/coffee'
import type { CoffeeProduct, ProductSize } from '@/types/coffee'

defineProps<{
  product: CoffeeProduct
}>()

defineEmits<{
  back: []
  buy: []
}>()

const selectedSize = defineModel<ProductSize>('selectedSize', { required: true })
const isFavorite = defineModel<boolean>('isFavorite', { required: true })
const descriptionExpanded = defineModel<boolean>('descriptionExpanded', { required: true })
</script>

<template>
  <section class="detail-screen">
    <header class="screen-header">
      <button class="icon-button" type="button" aria-label="Back to home" @click="$emit('back')">
        <img class="back-icon" :src="appAssets.back" alt="" />
      </button>

      <strong>Detail</strong>

      <button
        class="icon-button"
        type="button"
        aria-label="Favorite product"
        :aria-pressed="isFavorite"
        @click="isFavorite = !isFavorite"
      >
        <img :class="{ favorite: isFavorite }" :src="appAssets.heart" alt="" />
      </button>
    </header>

    <img class="detail-image" :src="product.image" :alt="product.name" />

    <div class="detail-heading">
      <div>
        <h1>{{ product.name }}</h1>
        <p>{{ product.type }}</p>

        <div class="rating-line">
          <img :src="appAssets.star" alt="" />
          <strong>4.8</strong>
          <span>(230)</span>
        </div>
      </div>

      <div class="feature-list" aria-label="Product features">
        <span><img :src="appAssets.motorbike" alt="" /></span>
        <span><img :src="appAssets.bean" alt="" /></span>
        <span><img :src="appAssets.package" alt="" /></span>
      </div>
    </div>

    <div class="divider"></div>

    <section class="description">
      <h2>Description</h2>
      <p>
        A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso
        coffee and 85 ml of fresh milk
        {{ descriptionExpanded ? 'that creates its signature velvety texture.' : 'the fo..' }}
        <button type="button" @click="descriptionExpanded = !descriptionExpanded">
          {{ descriptionExpanded ? 'Read Less' : 'Read More' }}
        </button>
      </p>
    </section>

    <section class="size-picker">
      <h2>Size</h2>
      <div>
        <button
          v-for="size in productSizes"
          :key="size"
          type="button"
          :class="{ selected: selectedSize === size }"
          @click="selectedSize = size"
        >
          {{ size }}
        </button>
      </div>
    </section>

    <footer class="buy-bar">
      <div>
        <span>Price</span>
        <strong>{{ product.price }}</strong>
      </div>

      <button class="primary-button" type="button" @click="$emit('buy')">
        Buy Now
      </button>
    </footer>
  </section>
</template>

<style scoped>
.detail-screen {
  width: min(100%, var(--size-screen-width));
  min-height: 812px;
  margin: auto;
  padding: 68px 24px 118px;
  position: relative;
  background: var(--color-coffee-night);
}

.favorite {
  filter: invert(41%) sepia(61%) saturate(1049%) hue-rotate(210deg);
}

.detail-image {
  display: block;
  width: 100%;
  height: 202px;
  border-radius: 16px;
  object-fit: cover;
}

.detail-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.detail-heading h1 {
  margin-bottom: 4px;
  font-size: 20px;
}

.detail-heading p {
  margin-bottom: 16px;
  font-size: 12px;
}

.rating-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
}

.rating-line img {
  width: 20px;
  height: 20px;
}

.rating-line span {
  font-size: 12px;
}

.feature-list {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
}

.feature-list span {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: var(--color-coffee-primary);
}

.feature-list img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.feature-list span:first-child img {
  width: 32px;
  height: 32px;
}

.divider {
  height: 1px;
  margin: 16px;
  background: #e3e3e3;
}

.description h2,
.size-picker h2 {
  margin-bottom: 8px;
  font-size: 16px;
}

.description p {
  margin-bottom: 0;
  font-size: 14px;
  line-height: 1.5;
}

.description button {
  padding: 0;
  border: 0;
  color: var(--color-coffee-primary);
  background: transparent;
  font-weight: 600;
}

.size-picker {
  margin-top: 24px;
}

.size-picker > div {
  display: flex;
  gap: 16px;
}

.size-picker button {
  width: 96px;
  height: 41px;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  color: #fff;
  background: transparent;
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.size-picker button.selected {
  background: var(--color-coffee-primary);
}

.size-picker button:hover,
.size-picker button:focus-visible {
  transform: translateY(-2px);
}

.buy-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px 46px;
  border-radius: 16px 16px 0 0;
  position: fixed;
  right: max(0px, calc((100vw - 375px) / 2));
  bottom: 0;
  left: max(0px, calc((100vw - 375px) / 2));
  z-index: 10;
  background: var(--color-coffee-night);
}

.buy-bar > div {
  display: flex;
  min-width: 86px;
  flex-direction: column;
  gap: 4px;
}

.buy-bar span {
  font-size: 14px;
}

.buy-bar strong {
  color: var(--color-coffee-primary);
  font-size: 18px;
}

.buy-bar .primary-button {
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .size-picker button {
    transition: none;
  }
}

@media (max-width: 390px) {
  .feature-list {
    gap: 6px;
  }

  .feature-list span {
    width: 40px;
    height: 40px;
  }

  .size-picker button {
    width: calc((100vw - 80px) / 3);
  }
}
</style>
