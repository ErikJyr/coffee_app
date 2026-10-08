<script setup lang="ts">
import { appAssets } from '@/data/coffee'
import DeliveryMap from '@/components/DeliveryMap.vue'
import { useDemoDelivery } from '@/composables/useDemoDelivery'

defineEmits<{
  back: []
}>()

const mapCentered = defineModel<boolean>('mapCentered', { required: true })
const { progress, arrived, position, minutesLeft, paused, pause, resume, restart } = useDemoDelivery()
</script>

<template>
  <section class="delivery-screen">
    <DeliveryMap
      v-model:following="mapCentered"
      :position="position"
      @back="$emit('back')"
    />

    <div class="delivery-panel">
      <span class="panel-indicator"></span>

      <div class="delivery-time">
        <strong data-testid="delivery-eta">{{ arrived ? 'Your coffee has arrived!' : `${minutesLeft} minutes left` }}</strong>
        <span>Delivery to <b>Erik Jürgenstein</b></span>
      </div>

      <div
        class="progress"
        role="progressbar"
        aria-label="Simulated delivery progress"
        :aria-valuenow="Math.round(progress * 100)"
        :aria-valuemin="0"
        :aria-valuemax="100"
        data-testid="delivery-progress"
      >
        <i
          v-for="step in 4"
          :key="step"
          :style="{ '--step-progress': `${Math.min(1, Math.max(0, progress * 4 - (step - 1))) * 100}%` }"
        ></i>
      </div>

      <div class="delivered-card">
        <span class="delivery-icon">
          <img :src="appAssets.motorbike" alt="" />
        </span>
        <div>
          <strong>{{ arrived ? 'Delivery complete' : paused ? 'Demo paused' : 'Delivering your order' }}</strong>
          <p>{{ arrived ? 'Demo complete. Replay to take another trip.' : 'Simulated courier · 10 demo minutes in 60 seconds.' }}</p>
        </div>
      </div>

      <div class="courier-row">
        <img :src="appAssets.courier" alt="Brooklyn Simmons" />
        <div>
          <strong>Brooklyn Simmons</strong>
          <span>Personal Courier</span>
        </div>
        <button v-if="!arrived && !paused" class="demo-button" type="button" data-testid="demo-pause" aria-label="Pause demo delivery" @click="pause">Ⅱ</button>
        <button v-if="!arrived && paused" class="demo-button" type="button" data-testid="demo-resume" aria-label="Resume demo delivery" @click="resume">▶</button>
        <button class="demo-button" type="button" data-testid="demo-replay" aria-label="Replay demo delivery" @click="restart">↻</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.delivery-screen {
  display: grid;
  grid-template-rows: minmax(360px, 1fr) auto;
  width: min(100%, var(--size-screen-width));
  height: 100dvh;
  min-height: 720px;
  margin: auto;
  overflow: hidden;
  position: relative;
  background: #fff;
}

.delivery-panel {
  min-height: 322px;
  padding: 16px 24px calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  position: relative;
  background: var(--color-coffee-night);
}

.panel-indicator {
  display: block;
  width: 45px;
  height: 5px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: #e3e3e3;
}

.delivery-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 24px;
}

.delivery-time strong {
  font-size: 16px;
}

.delivery-time span {
  font-size: 12px;
}

.progress {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.progress i {
  height: 4px;
  flex: 1;
  border-radius: 20px;
  background: linear-gradient(to right, var(--color-coffee-primary) var(--step-progress), #e3e3e3 var(--step-progress));
}

.delivered-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px 8px 12px;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
}

.delivery-icon {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
}

.delivery-icon img {
  width: 32px;
  filter: brightness(0) saturate(100%) invert(37%) sepia(45%) saturate(1216%) hue-rotate(201deg);
}

.delivered-card strong {
  font-size: 14px;
}

.delivered-card p {
  max-width: 220px;
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
}

.courier-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.courier-row > img {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
}

.courier-row > div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.courier-row > div span {
  font-size: 12px;
}

.demo-button {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  color: #fff;
  background: transparent;
  font-size: 22px;
}
</style>
