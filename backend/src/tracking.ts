import { Type, type Static } from '@sinclair/typebox'

export const Tracking = Type.Object({
  kind: Type.Literal('simulation'), progress: Type.Number(), arrived: Type.Boolean(), etaMinutes: Type.Integer(),
  position: Type.Object({ latitude: Type.Number(), longitude: Type.Number() }),
  durationSeconds: Type.Literal(60),
})
const route = [
  [58.2486, 22.4792], [58.2495, 22.4792], [58.2504, 22.4802],
  [58.2513, 22.4812], [58.2522, 22.4812], [58.2531, 22.4802],
] as const

/** Simulate a fictional courier without changing the real order's status. */
export function demoTracking(createdAt: number, now: number): Static<typeof Tracking> {
  const progress = Math.min(1, Math.max(0, (now - createdAt) / 60000))
  const segment = progress * (route.length - 1)
  const index = Math.min(Math.floor(segment), route.length - 2)
  const start = route[index]!
  const end = route[index + 1]!
  const fraction = segment - index
  return {
    kind: 'simulation', progress, arrived: progress === 1, etaMinutes: Math.ceil((1 - progress) * 10), durationSeconds: 60,
    position: { latitude: start[0] + (end[0] - start[0]) * fraction, longitude: start[1] + (end[1] - start[1]) * fraction },
  }
}
