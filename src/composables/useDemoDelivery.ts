import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export type DeliveryPosition = [latitude: number, longitude: number]

/** Fictional waypoints around Kuressaare; no customer location is used. */
export const demoRoute = [
  [58.2486, 22.4792],
  [58.2495, 22.4792],
  [58.2504, 22.4802],
  [58.2513, 22.4812],
  [58.2522, 22.4812],
  [58.2531, 22.4802],
] as const

/** Interpolate the fictional route over a normalized delivery duration. */
function getCourierPosition(progress: number): DeliveryPosition {
  if (progress < 0 || progress > 1) {
    throw new RangeError(`Delivery progress must be between 0 and 1; received ${progress}`)
  }

  const segmentProgress = progress * (demoRoute.length - 1)
  const index = Math.min(Math.floor(segmentProgress), demoRoute.length - 2)
  const start = demoRoute[index]!
  const end = demoRoute[index + 1]!
  const fraction = segmentProgress - index

  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ]
}

/** Run ten simulated delivery minutes in one real minute, then stop at arrival. */
export function useDemoDelivery() {
  const elapsed = ref<number>(0)
  const paused = ref<boolean>(false)
  const duration = 60_000
  const progress = computed<number>(() => elapsed.value / duration)
  const arrived = computed<boolean>(() => progress.value === 1)
  const position = computed<DeliveryPosition>(() => getCourierPosition(progress.value))
  const minutesLeft = computed<number>(() => Math.ceil((1 - progress.value) * 10))
  let timer: ReturnType<typeof setInterval> | undefined
  let previousTick: number = 0

  function tick(): void {
    const now = performance.now()
    const delta = now - previousTick
    previousTick = now

    if (!paused.value && !arrived.value) {
      elapsed.value = Math.min(duration, elapsed.value + delta)
    }
  }

  function pause(): void {
    tick()
    paused.value = true
  }

  function resume(): void {
    previousTick = performance.now()
    paused.value = false
  }

  function restart(): void {
    elapsed.value = 0
    resume()
  }

  onMounted(() => {
    previousTick = performance.now()
    timer = setInterval(tick, 100)
  })

  onBeforeUnmount(() => clearInterval(timer))

  return { progress, arrived, position, minutesLeft, paused, pause, resume, restart }
}
