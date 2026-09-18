<script setup lang="ts">
import { useCoffeeApp } from '@/composables/useCoffeeApp'
import DeliveryScreen from './screens/DeliveryScreen.vue'
import OnboardingScreen from './screens/OnboardingScreen.vue'
import OrderScreen from './screens/OrderScreen.vue'
import ProductDetailScreen from './screens/ProductDetailScreen.vue'
import HeroSection from './HeroSection.vue'

const {
  screen,
  selectedProduct,
  selectedSize,
  cartItems,
  isFavorite,
  descriptionExpanded,
  deliveryMode,
  discountApplied,
  addressEditing,
  noteOpen,
  paymentOpen,
  paymentMethod,
  mapCentered,
  goTo,
  openDetail,
  openOrder,
  changeLineQuantity,
} = useCoffeeApp()
</script>

<template>
  <main class="coffee-app">
    <OnboardingScreen
      v-if="screen === 'onboarding'"
      @start="goTo('home')"
    />

    <HeroSection
      v-else-if="screen === 'home'"
      @open-detail="openDetail"
      @open-order="openOrder"
    />

    <ProductDetailScreen
      v-else-if="screen === 'detail'"
      v-model:selected-size="selectedSize"
      v-model:is-favorite="isFavorite"
      v-model:description-expanded="descriptionExpanded"
      :product="selectedProduct"
      @back="goTo('home')"
      @buy="openOrder()"
    />

    <OrderScreen
      v-else-if="screen === 'order'"
      v-model:delivery-mode="deliveryMode"
      v-model:discount-applied="discountApplied"
      v-model:address-editing="addressEditing"
      v-model:note-open="noteOpen"
      v-model:payment-open="paymentOpen"
      v-model:payment-method="paymentMethod"
      :cart-items="cartItems"
      @back="goTo('detail')"
      @change-quantity="changeLineQuantity"
      @submit="goTo('delivery')"
    />

    <DeliveryScreen
      v-else
      v-model:map-centered="mapCentered"
      @back="goTo('order')"
    />
  </main>
</template>

<style scoped>
.coffee-app {
  min-height: 100vh;
  color: var(--color-coffee-text);
  background: var(--color-coffee-night);
  font-family: 'Sora', sans-serif;
}
</style>
