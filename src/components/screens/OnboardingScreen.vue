<script setup lang="ts">
import { appAssets } from '@/data/coffee'

defineEmits<{
  start: []
}>()
</script>

<template>
  <section class="onboarding-screen">
    <img
      class="onboarding-image"
      :src="appAssets.onboarding"
      alt="Steaming coffee surrounded by coffee beans"
    />
    <div class="onboarding-overlay"></div>

    <div class="onboarding-content">
      <div>
        <h1>Fall in Love with Coffee in Blissful Delight!</h1>
        <p>Welcome to our cozy coffee corner, where every cup is delightful for you.</p>
      </div>

      <button class="primary-button" type="button" @click="$emit('start')">
        Get Started
      </button>
    </div>
  </section>
</template>

<style scoped>
.onboarding-screen {
  width: min(100%, var(--size-screen-width));
  min-height: 812px;
  margin: auto;
  overflow: hidden;
  position: relative;
  background: #050505;
  animation: screen-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.onboarding-image {
  display: block;
  width: 100%;
  height: 536px;
  object-fit: cover;
  object-position: center;
  animation: onboarding-drift 8s ease-in-out infinite alternate;
}

.onboarding-overlay {
  height: 360px;
  position: absolute;
  inset: 452px 0 0;
  background: linear-gradient(transparent, #050505 24%);
}

.onboarding-content {
  display: flex;
  height: 336px;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  position: absolute;
  inset: 476px 0 0;
  text-align: center;
}

.onboarding-content h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.5;
  letter-spacing: 0.16px;
}

.onboarding-content p {
  margin: 8px 0 0;
  color: var(--color-coffee-muted);
  font-size: 14px;
  line-height: 1.5;
}

.primary-button {
  width: 100%;
}

@keyframes screen-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes onboarding-drift {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-screen,
  .onboarding-image {
    animation: none;
  }
}
</style>
