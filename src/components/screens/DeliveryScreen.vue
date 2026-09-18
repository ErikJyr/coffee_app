<script setup lang="ts">
import { appAssets } from '@/data/coffee'

defineEmits<{
  back: []
}>()

const mapCentered = defineModel<boolean>('mapCentered', { required: true })
</script>

<template>
  <section class="delivery-screen">
    <img class="map-image" :src="appAssets.map" alt="Map showing delivery route" />
    <img class="route-image" :src="appAssets.route" alt="" />
    <img class="location-pin" :src="appAssets.location" alt="Delivery location" />

    <button class="map-back icon-button" type="button" aria-label="Back to order" @click="$emit('back')">
      <img class="back-icon" :src="appAssets.back" alt="" />
    </button>
    <button
      class="map-gps"
      type="button"
      aria-label="Center delivery map"
      :aria-pressed="mapCentered"
      @click="mapCentered = !mapCentered"
    >
      {{ mapCentered ? '✓' : '◎' }}
    </button>

    <div class="delivery-panel">
      <span class="panel-indicator"></span>

      <div class="delivery-time">
        <strong>10 minutes left</strong>
        <span>Delivery to <b>Erik Jürgenstein</b></span>
      </div>

      <div class="progress" aria-label="Delivery progress">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>

      <div class="delivered-card">
        <span class="delivery-icon">
          <img :src="appAssets.motorbike" alt="" />
        </span>
        <div>
          <strong>Delivering your order</strong>
          <p>We will deliver your goods to you in the shortest possible time.</p>
        </div>
      </div>

      <div class="courier-row">
        <img :src="appAssets.courier" alt="Brooklyn Simmons" />
        <div>
          <strong>Brooklyn Simmons</strong>
          <span>Personal Courier</span>
        </div>
        <a class="call-button" href="tel:+3725550123" aria-label="Call courier">⌕</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.delivery-screen {
  width: min(100%, var(--size-screen-width));
  min-height: 812px;
  margin: auto;
  overflow: hidden;
  position: relative;
  background: #fff;
}

.map-image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 812px;
  object-fit: cover;
}

.route-image {
  width: 171px;
  position: absolute;
  top: 168px;
  left: 82px;
}

.location-pin {
  width: 24px;
  position: absolute;
  top: 211px;
  left: 66px;
}

.map-back,
.map-gps {
  position: absolute;
  top: 68px;
  background: #ededed;
}

.map-back {
  left: 24px;
}

.map-gps {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 12px;
  right: 24px;
  font-size: 28px;
}

.delivery-panel {
  min-height: 322px;
  padding: 16px 24px 34px;
  border-radius: 24px 24px 0 0;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
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
  background: var(--color-coffee-primary);
}

.progress i:last-child {
  background: #e3e3e3;
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
  gap: 16px;
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

.call-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  color: #fff;
  text-decoration: none;
  font-size: 28px;
}
</style>
