<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { divIcon, icon, map, marker, polyline, tileLayer } from 'leaflet'
import type { Map, TileErrorEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { appAssets } from '@/data/coffee'
import { demoRoute } from '@/composables/useDemoDelivery'
import type { DeliveryPosition } from '@/composables/useDemoDelivery'

const props = defineProps<{ position: DeliveryPosition }>()
const emit = defineEmits<{ back: [] }>()
const following = defineModel<boolean>('following', { required: true })
const container = useTemplateRef<HTMLDivElement>('mapContainer')
const mapError = ref<string>('')
const retryTimers: ReturnType<typeof setTimeout>[] = []
let deliveryMap: Map | null = null
let reloadTiles: (() => void) | null = null

function requireMap(): Map {
  if (!deliveryMap) throw new Error('The delivery map has not initialized. Reload the delivery screen.')
  return deliveryMap
}

function followCourier(): void {
  following.value = true
  requireMap().panTo(props.position)
}

function zoomIn(): void {
  requireMap().zoomIn()
}

function zoomOut(): void {
  requireMap().zoomOut()
}

function retryMap(): void {
  if (!reloadTiles) throw new Error('Map tiles have not initialized. Reload the delivery screen.')
  mapError.value = ''
  reloadTiles()
}

onMounted(() => {
  if (!container.value) throw new Error('The delivery map container is missing.')

  const instance = map(container.value, { zoomControl: false, minZoom: 12, maxZoom: 19 })
  deliveryMap = instance
  const tiles = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  const attempts = new WeakMap<HTMLImageElement, number>()

  tiles.on('tileerror', (event: TileErrorEvent) => {
    if (!(event.tile instanceof HTMLImageElement)) {
      throw new TypeError('The map tile service returned a tile that is not an image.')
    }
    const tile = event.tile
    const attempt = (attempts.get(tile) ?? 0) + 1
    attempts.set(tile, attempt)
    if (attempt <= 2) {
      console.warn('Retrying failed delivery map tile', { url: tile.src, attempt, error: event.error })
      retryTimers.push(setTimeout(() => { tile.src = tile.src }, attempt * 1000))
      return
    }
    mapError.value = 'OpenStreetMap tiles could not load after two retries. Check your connection and retry the map.'
    console.error('Delivery map tile failed', { url: tile.src, attempts: attempt, error: event.error })
    throw new Error(`${mapError.value} Tile URL: ${tile.src}. The browser does not expose HTTP status for image requests.`, {
      cause: event.error,
    })
  })
  tiles.addTo(instance)
  reloadTiles = () => { tiles.redraw() }

  const route = polyline(demoRoute.map((position) => [...position]), {
    color: '#4e56c6', weight: 5, opacity: 0.85,
  }).addTo(instance)
  instance.fitBounds(route.getBounds(), { padding: [55, 90], maxZoom: 16 })

  marker([...demoRoute[demoRoute.length - 1]!], {
    icon: icon({ iconUrl: appAssets.location, iconSize: [21, 30], iconAnchor: [10, 30] }),
    title: 'Demo destination', alt: 'Demo destination',
  }).addTo(instance).bindTooltip('Demo destination')

  const courierIcon = document.createElement('div')
  courierIcon.dataset.testid = 'courier-marker'
  const courierImage = document.createElement('img')
  courierImage.src = appAssets.motorbike
  courierImage.alt = ''
  courierIcon.append(courierImage)
  const courier = marker(props.position, {
    icon: divIcon({ html: courierIcon, className: 'demo-courier', iconSize: [40, 40], iconAnchor: [20, 20] }),
    title: 'Simulated courier', alt: 'Simulated courier', zIndexOffset: 1000,
  }).addTo(instance).bindTooltip('Simulated courier')

  instance.on('dragstart', () => { following.value = false })
  if (following.value) instance.panTo(props.position, { animate: false })
  watch(() => props.position, (position) => {
    courier.setLatLng(position)
    if (following.value) instance.panTo(position, { animate: false })
  })
})

onBeforeUnmount(() => {
  retryTimers.forEach(clearTimeout)
  deliveryMap?.remove()
})
</script>

<template>
  <div class="delivery-map">
    <div ref="mapContainer" class="map-container" data-testid="delivery-map" role="region" aria-label="Interactive demo delivery map"></div>
    <button class="map-back icon-button" type="button" data-testid="delivery-back" aria-label="Back to order" @click="emit('back')">
      <img class="back-icon" :src="appAssets.back" alt="" />
    </button>
    <span class="demo-label">Demo · Simulated route</span>
    <div class="map-controls">
      <button type="button" data-testid="map-follow" aria-label="Follow simulated courier" :aria-pressed="following" @click="followCourier">◎</button>
      <button type="button" data-testid="map-zoom-in" aria-label="Zoom in" @click="zoomIn">+</button>
      <button type="button" data-testid="map-zoom-out" aria-label="Zoom out" @click="zoomOut">−</button>
    </div>
    <div v-if="mapError" class="map-error" role="alert" data-testid="map-error">
      <p>{{ mapError }}</p>
      <button type="button" data-testid="map-retry" @click="retryMap">Retry map</button>
    </div>
  </div>
</template>

<style scoped>
.delivery-map {
  height: 100%;
  min-height: 360px;
  position: relative;
  isolation: isolate;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-back,
.map-controls,
.demo-label,
.map-error {
  position: absolute;
  z-index: 1000;
}

.map-back {
  top: 24px;
  left: 24px;
  background: #242424;
}

.demo-label {
  top: 82px;
  left: 24px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #242424;
  color: #fff;
  font-size: 11px;
}

.map-controls {
  display: grid;
  gap: 8px;
  top: 24px;
  right: 24px;
}

.map-controls button {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: #fff;
  color: #242424;
  font-size: 26px;
  box-shadow: 0 2px 8px #0002;
}

.map-controls button[aria-pressed='true'] {
  background: var(--color-coffee-primary);
  color: #fff;
}

.map-error {
  right: 16px;
  bottom: 32px;
  left: 16px;
  padding: 12px;
  border-radius: 12px;
  color: #fff;
  background: #242424;
  font-size: 12px;
}

.map-error button {
  margin-top: 8px;
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
}

:deep(.demo-courier) {
  display: grid;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #4e56c6;
  box-shadow: 0 2px 10px #0004;
}

:deep(.demo-courier img) {
  width: 26px;
  height: 26px;
  filter: brightness(0) invert(1);
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
