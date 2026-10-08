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
        <h1>Good days start with great coffee.</h1>
        <p>Your favorite cup, made with care. Explore our menu and find your daily ritual.</p>
      </div>

      <button class="primary-button" type="button" data-testid="start-shopping" @click="$emit('start')">
        Find my coffee
      </button>
    </div>
  </section>
</template>

<style scoped>
.onboarding-screen {
  width: min(100%, var(--size-screen-width));
  min-height: max(680px, 100dvh);
  margin: auto;
  overflow: hidden;
  position: relative;
  background: #050505;
  animation: screen-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.onboarding-image {
  display: block;
  width: 100%;
  height: max(420px, 65dvh);
  object-fit: cover;
  object-position: center;
  animation: onboarding-drift 8s ease-in-out infinite alternate;
}

.onboarding-overlay {
  position: absolute;
  inset: 40% 0 0;
  background: linear-gradient(transparent, #050505 55%);
}

.onboarding-content {
  display: flex;
  min-height: 300px;
  gap: 28px;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 28px calc(28px + env(safe-area-inset-bottom));
  position: absolute;
  inset: auto 0 0;
  text-align: center;
}

.onboarding-content h1 {
  margin: 0;
  font-size: clamp(30px, 8vw, 36px);
  line-height: 1.2;
  letter-spacing: -1px;
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
