/**
 * Short UI sounds via Web Audio API (no asset files).
 * Respects prefers-reduced-motion for accessibility.
 */

let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!sharedContext || sharedContext.state === "closed") {
      sharedContext = new Ctx()
    }
    if (sharedContext.state === "suspended") {
      void sharedContext.resume()
    }
    return sharedContext
  } catch {
    return null
  }
}

function prefersReducedSound(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function playTone(options: {
  startHz: number
  endHz: number
  peakGain: number
  attackSec: number
  decaySec: number
  durationSec: number
}): void {
  if (prefersReducedSound()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const master = ctx.createGain()
  master.gain.value = 1.15

  osc.type = "sine"
  osc.frequency.setValueAtTime(options.startHz, t)
  osc.frequency.exponentialRampToValueAtTime(options.endHz, t + options.attackSec)

  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(options.peakGain, t + options.attackSec)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + options.decaySec)

  osc.connect(gain)
  gain.connect(master)
  master.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + options.durationSec)
}

/** Click when dictation starts. */
export function playMicArmSound(): void {
  playTone({
    startHz: 720,
    endHz: 480,
    peakGain: 0.28,
    attackSec: 0.014,
    decaySec: 0.11,
    durationSec: 0.12,
  })
}

/** Click when dictation stops. */
export function playMicReleaseSound(): void {
  playTone({
    startHz: 420,
    endHz: 300,
    peakGain: 0.22,
    attackSec: 0.01,
    decaySec: 0.09,
    durationSec: 0.1,
  })
}
