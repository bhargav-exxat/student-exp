"use client"

/**
 * LeoIcon — character-driven Ask Leo icon.
 *
 * Geometry: faithful translation of Figma node 171:1022 (fa-star-christmas).
 * The star is a 4-armed plus/cross with rounded caps (Primary) plus 4
 * diagonal rounded-capsule sparkles in the corners (Secondary, opacity 0.4).
 *
 * Motion philosophy — 2D only, character-driven:
 *   • No 3D perspective. The star lives on the screen plane, not in space.
 *   • Continuous spring reactions to cursor — never keyframe "pops".
 *   • Head-tilt (rotateZ), magnetic drift, proximity scale — 2D, readable.
 *   • Each corner sparkle tracks cursor direction independently: the sparkle
 *     the cursor points toward brightens, scales, and leans outward while
 *     the others stay quiet. This reads as "the star noticed you".
 *   • Idle breath + saccades keep running during hover (composed via nested
 *     transforms), so the star is always alive.
 *   • Click = brief squash (0.92) + expanding ring + sparkle burst.
 *
 * variant="ambient"      Breathing presence — no cursor reactions.
 * variant="interactive"  Full cursor tracking for hero/welcome surfaces.
 */

import * as React from "react"
import {
  animate,
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
  type MotionValue,
} from "motion/react"
import { cn } from "@/lib/utils"

// Readable on light + dark chrome when parent sets --leo-icon-fill (see AskLeoButton).
const LEO_FILL = "var(--leo-icon-fill, var(--brand-color))"

// Glow color for atmospheric layers — follows --leo-icon-fill when set on a parent.
const GLOW = "var(--leo-icon-fill, var(--brand-color))"

// ─── Public API ───────────────────────────────────────────────────────────────

export type LeoIconVariant = "ambient" | "interactive"
export type LeoIconSize = "sm" | "md" | "lg" | "xl"

export type LeoIconSparkleCadence = "default" | "prominent"

export interface LeoIconProps {
  variant?: LeoIconVariant
  size?: LeoIconSize
  /**
   * Orbiting star sparkles around the glyph. `prominent` — faster cadence for
   * compact CTAs (e.g. Ask Leo / Draft with Leo buttons).
   */
  sparkleCadence?: LeoIconSparkleCadence
  /**
   * Small orbiting sparkle particles around the glyph. Off for dense toolbars
   * (they read as stray stars beside nearby controls).
   */
  orbitingSparkles?: boolean
  className?: string
  style?: React.CSSProperties
}

const TWINKLE_CADENCE_MS: Record<
  LeoIconSparkleCadence,
  { idleMin: number; idleMax: number; hoverMin: number; hoverMax: number; initialSpread: number }
> = {
  default: { idleMin: 2800, idleMax: 5800, hoverMin: 280, hoverMax: 680, initialSpread: 700 },
  prominent: { idleMin: 380, idleMax: 950, hoverMin: 180, hoverMax: 420, initialSpread: 200 },
}

type SZ = { root: string; px: number }

const SIZES: Record<LeoIconSize, SZ> = {
  sm: { root: "size-8",  px: 32 },
  md: { root: "size-10", px: 40 },
  lg: { root: "size-14", px: 56 },
  xl: { root: "size-20", px: 80 },
}

// ─── Easings ──────────────────────────────────────────────────────────────────

const EASE_BREATH = [0.45, 0.05, 0.2, 1] as const
const EASE_SOFT = [0.22, 1, 0.36, 1] as const

// ─── Geometry (from Figma node 171:1022 — viewBox 0 0 168 168, center 84,84)

const STAR_BODY_PATH =
  "M70 98L31.3906 88.3531C29.4 87.85 28 86.0562 28 84C28 81.9438 29.4 80.15 31.3906 79.6469L70 70L79.6469 31.3906C80.15 29.4 81.9438 28 84 28C86.0562 28 87.85 29.4 88.3531 31.3906L98 70L136.609 79.6469C138.6 80.15 140 81.9438 140 84C140 86.0562 138.6 87.85 136.609 88.3531L98 98L88.3531 136.609C87.85 138.6 86.0562 140 84 140C81.9438 140 80.15 138.6 79.6469 136.609L70 98Z"

interface SparkleCfg {
  id: "ne" | "se" | "sw" | "nw"
  path: string
  /** outward unit vector from center (84,84) */
  diag: readonly [number, number]
  /** stagger phase (seconds) for idle pulsing */
  phase: number
}

const SPARKLES: readonly SparkleCfg[] = [
  {
    id: "nw",
    path: "M43.5313 43.5313C41.475 45.5875 41.475 48.9125 43.5313 50.9469L54.0313 61.4469C56.0875 63.5031 59.4125 63.5031 61.4469 61.4469C63.4813 59.3906 63.5031 56.0656 61.4469 54.0313L50.9688 43.5313C48.9125 41.475 45.5875 41.475 43.5531 43.5313H43.5313Z",
    diag: [-1, -1],
    phase: 2.4,
  },
  {
    id: "sw",
    path: "M43.5313 117.031C41.475 119.087 41.475 122.412 43.5313 124.447C45.5875 126.481 48.9125 126.503 50.9469 124.447L61.4469 113.947C63.5031 111.891 63.5031 108.566 61.4469 106.531C59.3906 104.497 56.0656 104.475 54.0313 106.531L43.5313 117.031Z",
    diag: [-1, 1],
    phase: 1.6,
  },
  {
    id: "ne",
    path: "M106.531 54.0313C104.475 56.0875 104.475 59.4125 106.531 61.4469C108.587 63.4813 111.912 63.5031 113.947 61.4469L124.447 50.9469C126.503 48.8906 126.503 45.5656 124.447 43.5313C122.391 41.4969 119.066 41.475 117.031 43.5313L106.531 54.0313Z",
    diag: [1, -1],
    phase: 0.0,
  },
  {
    id: "se",
    path: "M106.531 106.531C104.475 108.587 104.475 111.912 106.531 113.947L117.031 124.447C119.087 126.503 122.412 126.503 124.447 124.447C126.481 122.391 126.503 119.066 124.447 117.031L113.947 106.531C111.891 104.475 108.566 104.475 106.531 106.531Z",
    diag: [1, 1],
    phase: 0.8,
  },
]

// ─── Variants ────────────────────────────────────────────────────────────────

// Star body: always breathes + saccades. Never hover-popped — cursor reactions
// live on the outer wrapper and compose via nested transforms.
const starBodyVariants: Variants = {
  idle: {
    scale:  [1, 1.032, 1, 1.02, 1],
    rotate: [0, 0, 2, 0, 0, -2.4, 0, 0, 1.2, 0, 0],
    transition: {
      scale: {
        duration: 6, repeat: Infinity, ease: EASE_BREATH,
        times: [0, 0.25, 0.5, 0.75, 1],
      },
      rotate: {
        duration: 11, repeat: Infinity, ease: "easeOut",
        times: [0, 0.18, 0.20, 0.26, 0.46, 0.48, 0.55, 0.74, 0.76, 0.83, 1],
      },
    },
  },
}

// Sparkle inner (idle twinkle + click scatter along its own diagonal)
const sparkleInnerVariantsFor = (
  phase: number, diag: readonly [number, number],
): Variants => ({
  idle: {
    opacity: [0.75, 1, 0.75, 0.9, 0.75],
    scale:   [0.92, 1.08, 0.92, 1.02, 0.92],
    x: 0, y: 0,
    transition: {
      duration: 3.2, delay: phase, repeat: Infinity, ease: "easeInOut",
    },
  },
  scatter: {
    opacity: [1, 0],
    scale:   [1.4, 0.6],
    x: diag[0] * 18,
    y: diag[1] * 18,
    transition: { duration: 0.65, ease: [0.2, 1, 0.4, 1] },
  },
})

const SPARKLE_VARIANTS_BY_ID: Record<SparkleCfg["id"], Variants> = {
  ne: sparkleInnerVariantsFor(0.0, [ 1, -1]),
  se: sparkleInnerVariantsFor(0.8, [ 1,  1]),
  sw: sparkleInnerVariantsFor(1.6, [-1,  1]),
  nw: sparkleInnerVariantsFor(2.4, [-1, -1]),
}

// ─── Per-sparkle directional response to cursor ──────────────────────────────
// Outer <g> wraps the sparkle. Its style reacts to how aligned the cursor is
// with this sparkle's outward direction. Sparkles in the cursor's direction
// brighten, grow, and lean outward; others stay at their base opacity.
// `bornAmount` (0→1) scales the base opacity during the birth animation so
// sparkles bloom in *after* the main body materializes.

function CornerSparkle({
  c, reduced, cast, mx, my, bornAmount,
}: {
  c: SparkleCfg
  reduced: boolean
  cast: boolean
  mx: MotionValue<number>
  my: MotionValue<number>
  bornAmount: MotionValue<number>
}) {
  // Unit vector in the sparkle's outward direction.
  const sx = c.diag[0] / Math.SQRT2
  const sy = c.diag[1] / Math.SQRT2

  // Alignment: how much the cursor vector points at this sparkle. Range [0, 1].
  // Combines direction (dot product with sparkle's outward vector) with
  // proximity magnitude so distant cursors barely register.
  const align = useTransform([mx, my] as MotionValue<number>[], ([x, y]) => {
    const mag = Math.hypot(x as number, y as number)
    if (mag < 0.01) return 0
    const dot = ((x as number) * sx + (y as number) * sy) / mag
    const magScale = Math.min(1, mag * 2) // mag range [0, 0.5] → [0, 1]
    return Math.max(0, Math.min(1, dot * magScale))
  })

  // Spring the alignment so the reaction feels organic, not snappy.
  const sprAlign = useSpring(align, { stiffness: 180, damping: 26, mass: 0.5 })

  // Derived outer-group reactions — multiplied by bornAmount so sparkles are
  // invisible during body birth, then fade in.
  const outerOpacity = useTransform(
    [sprAlign, bornAmount] as MotionValue<number>[],
    ([a, b]) => (0.4 + (a as number) * 0.55) * (b as number),
  )
  const outerScale = useTransform(sprAlign, v => 1 + v * 0.35)
  const outerX = useTransform(sprAlign, v => c.diag[0] * v * 6)
  const outerY = useTransform(sprAlign, v => c.diag[1] * v * 6)

  return (
    <motion.g
      style={{
        opacity: reduced ? 0.4 : outerOpacity,
        scale:   reduced ? 1   : outerScale,
        x:       reduced ? 0   : outerX,
        y:       reduced ? 0   : outerY,
        transformBox: "fill-box",
        transformOrigin: "center",
      }}
    >
      <motion.path
        d={c.path}
        fill={LEO_FILL}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        variants={SPARKLE_VARIANTS_BY_ID[c.id]}
        animate={reduced ? undefined : cast ? "scatter" : "idle"}
      />
    </motion.g>
  )
}

// ─── Birth animation — "from a single point, a star" ────────────────────────
// Outer wrapper plays on mount: starts as a scale-0 bright-blurry pinpoint
// and blooms into a crisp star. Runs once, then sits at its resting state.

const birthVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    filter: "blur(4px)",
  },
  live: {
    scale: [0, 0.12, 1.04, 1],
    opacity: [0, 1, 1, 1],
    filter: ["blur(4px)", "blur(2.2px)", "blur(0px)", "blur(0px)"],
    transition: {
      duration: 0.9,
      times: [0, 0.18, 0.78, 1],
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}

// ─── Core SVG — 2D only. Cursor reactions on the inner wrapper. ──────────────

const LEO_STAR_TILT_CFG = { stiffness: 200, damping: 22, mass: 0.55 }

function LeoStarSVG({
  px, reduced, pressed, cast, mx, my, engage,
}: {
  px: number
  reduced: boolean
  pressed: boolean
  cast: boolean
  mx: MotionValue<number>
  my: MotionValue<number>
  engage: MotionValue<number>
}) {
  // 2D reactions — tight but subtle. No 3D space at all.
  const rotZ = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), LEO_STAR_TILT_CFG)
  const shiftX = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), LEO_STAR_TILT_CFG)
  const shiftY = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), LEO_STAR_TILT_CFG)

  // Proximity scale driven by `engage` spring (0 → 1 on hover in, decays on out).
  const proxScale = useTransform(engage, [0, 1], [1, 1.1])

  // Quick click squash on the star body (composed with idle breath via nested g).
  const pressScale = useSpring(pressed ? 0.92 : 1, {
    stiffness: 380, damping: 26, mass: 0.4,
  })

  // Birth → live handoff. Once born, sparkles are allowed to appear.
  const bornAmount = useMotionValue(reduced ? 1 : 0)
  React.useEffect(() => {
    if (reduced) { bornAmount.set(1); return }
    const controls = animate(bornAmount, 1, {
      duration: 0.55, delay: 0.4, ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [bornAmount, reduced])

  return (
    // Outer: birth animation (runs once on mount)
    <motion.span
      style={{ display: "inline-flex" }}
      variants={birthVariants}
      initial={reduced ? false : "hidden"}
      animate="live"
    >
      {/* Inner: cursor reactions (always active) */}
      <motion.span
        style={{
          display: "inline-flex",
          rotate: reduced ? 0 : rotZ,
          scale:  reduced ? 1 : proxScale,
          x:      reduced ? 0 : shiftX,
          y:      reduced ? 0 : shiftY,
        }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 168 168"
          aria-hidden
          style={{ overflow: "visible", display: "block" }}
        >
          {/* 4 corner sparkles — each reacts to cursor direction independently */}
          {SPARKLES.map(c => (
            <CornerSparkle
              key={c.id}
              c={c}
              reduced={reduced}
              cast={cast}
              mx={mx}
              my={my}
              bornAmount={bornAmount}
            />
          ))}

          {/* Star body — breath + saccades always running.
              Wrapped in <motion.g> so click squash composes with breath scale. */}
          <motion.g
            style={{
              scale: reduced ? 1 : pressScale,
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          >
            <motion.path
              d={STAR_BODY_PATH}
              fill={LEO_FILL}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              variants={starBodyVariants}
              animate={reduced ? undefined : "idle"}
            />
          </motion.g>
        </svg>
      </motion.span>
    </motion.span>
  )
}

// ─── Twinkle system (external firefly sparkles around the star) ──────────────

interface Twinkle {
  id: number
  x: number; y: number
  dx: number; dy: number
  size: number
  rot: number
  dur: number
}

function TwinkleShape({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
        fill={LEO_FILL}
      />
    </svg>
  )
}

function TwinkleDot({ t, onDone }: { t: Twinkle; onDone: (id: number) => void }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute"
      style={{ top: "50%", left: "50%", rotate: t.rot }}
      initial={{ x: t.x, y: t.y, scale: 0.01, opacity: 0 }}
      animate={{
        x: t.x + t.dx,
        y: t.y + t.dy,
        scale:   [0.01, 1, 0.85, 0],
        opacity: [0, 1, 0.9, 0],
      }}
      transition={{
        duration: t.dur,
        scale:   { duration: t.dur, times: [0, 0.28, 0.65, 1], ease: EASE_SOFT },
        opacity: { duration: t.dur, times: [0, 0.28, 0.65, 1], ease: EASE_SOFT },
        x: { duration: t.dur, ease: "easeOut" },
        y: { duration: t.dur, ease: "easeOut" },
      }}
      onAnimationComplete={() => onDone(t.id)}
    >
      <TwinkleShape size={t.size} />
    </motion.span>
  )
}

function useTwinkles(
  enabled: boolean,
  size: number,
  cadence: LeoIconSparkleCadence = "default",
  opts: {
    hoverRef?: React.MutableRefObject<boolean>
    cursorRef?: React.MutableRefObject<{ x: number; y: number } | null>
  } = {},
) {
  const timing = TWINKLE_CADENCE_MS[cadence]
  const [twinkles, setTwinkles] = React.useState<Twinkle[]>([])
  const idRef = React.useRef(0)
  const { hoverRef, cursorRef } = opts

  const spawnOne = React.useCallback(() => {
    const hovered = hoverRef?.current ?? false
    const cursor = cursorRef?.current ?? null
    const radius = size * (0.34 + Math.random() * 0.30)

    let angle: number
    if (cursor) {
      const base = Math.atan2(cursor.y, cursor.x)
      angle = base + (Math.random() - 0.5) * Math.PI * 0.55
    } else {
      angle = Math.random() * Math.PI * 2
    }

    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    const drift = size * 0.09
    const sparkSize = 3 + Math.random() * (hovered ? 4 : 2.5)

    setTwinkles(prev => [...prev, {
      id: idRef.current++,
      x, y,
      dx: Math.cos(angle) * drift,
      dy: Math.sin(angle) * drift,
      size: sparkSize,
      rot: (Math.random() - 0.5) * 60,
      dur: 1.2 + Math.random() * 0.9,
    }])
  }, [size, hoverRef, cursorRef])

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    const schedule = () => {
      const hovered = hoverRef?.current ?? false
      const min = hovered ? timing.hoverMin : timing.idleMin
      const max = hovered ? timing.hoverMax : timing.idleMax
      const delay = min + Math.random() * (max - min)
      timeoutId = setTimeout(() => {
        if (cancelled) return
        spawnOne()
        schedule()
      }, delay)
    }

    timeoutId = setTimeout(() => {
      if (cancelled) return
      spawnOne()
      if (cadence === "prominent") spawnOne()
      schedule()
    }, 120 + Math.random() * timing.initialSpread)

    return () => { cancelled = true; clearTimeout(timeoutId) }
  }, [cadence, enabled, spawnOne, hoverRef, timing.hoverMax, timing.hoverMin, timing.idleMax, timing.idleMin, timing.initialSpread])

  const removeTwinkle = React.useCallback((id: number) => {
    setTwinkles(prev => prev.filter(t => t.id !== id))
  }, [])

  const spawnBurst = React.useCallback((count: number) => {
    const driftDist = size * 0.65
    const additions: Twinkle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      additions.push({
        id: idRef.current++,
        x: 0, y: 0,
        dx: Math.cos(angle) * driftDist,
        dy: Math.sin(angle) * driftDist,
        size: 4 + Math.random() * 4,
        rot: Math.random() * 60 - 30,
        dur: 0.7 + Math.random() * 0.3,
      })
    }
    setTwinkles(prev => [...prev, ...additions])
  }, [size])

  return { twinkles, removeTwinkle, spawnBurst }
}

// ─── Ambient variant ─────────────────────────────────────────────────────────

function AmbientIcon({
  sz,
  reduced,
  sparkleCadence = "default",
  orbitingSparkles = true,
}: {
  sz: SZ
  reduced: boolean
  sparkleCadence?: LeoIconSparkleCadence
  orbitingSparkles?: boolean
}) {
  // Dummy motion values so LeoStarSVG always runs its hooks.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const engage = useMotionValue(0)
  const { twinkles, removeTwinkle } = useTwinkles(
    !reduced && orbitingSparkles,
    sz.px,
    sparkleCadence,
  )

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        sz.root,
      )}
    >
      {/* Breathing aura — complementary gold, very subtle */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-22%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${GLOW} 0%, transparent 65%)`,
        }}
        animate={reduced ? { opacity: 0.04 } : {
          opacity: [0.03, 0.07, 0.03],
          scale:   [0.9, 1.04, 0.9],
        }}
        transition={{ duration: 6.2, repeat: Infinity, ease: EASE_BREATH }}
      />

      <AnimatePresence>
        {twinkles.map(t => (
          <TwinkleDot key={t.id} t={t} onDone={removeTwinkle} />
        ))}
      </AnimatePresence>

      <div className="relative z-10">
        <LeoStarSVG
          px={sz.px}
          reduced={reduced}
          pressed={false}
          cast={false}
          mx={mx}
          my={my}
          engage={engage}
        />
      </div>
    </span>
  )
}

// ─── Interactive variant ─────────────────────────────────────────────────────

function InteractiveIcon({ sz, reduced }: { sz: SZ; reduced: boolean }) {
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const hoverRef = React.useRef(false)
  const cursorRef = React.useRef<{ x: number; y: number } | null>(null)
  const [pressed, setPressed] = React.useState(false)
  const [cast, setCast] = React.useState(false)
  const [rings, setRings] = React.useState<number[]>([])

  const { twinkles, removeTwinkle, spawnBurst } = useTwinkles(
    !reduced,
    sz.px,
    "default",
    { hoverRef, cursorRef },
  )

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const engage = useSpring(0, { stiffness: 170, damping: 25 })

  const auraOpacity = useTransform(engage, [0, 1], [0.03, 0.07])
  const auraScale = useTransform(engage, [0, 1], [0.92, 1.08])

  // Viewport-wide cursor awareness.
  // While mounted, Leo watches the entire window. Cursor position relative to
  // the star's center drives mx/my (direction) and engage (proximity).
  // The farther the cursor, the smaller the response — exponential falloff.
  React.useEffect(() => {
    if (reduced) return
    let rafId = 0

    const onMove = (e: MouseEvent) => {
      if (rafId) return // coalesce to one update per frame
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const node = rootRef.current
        if (!node) return
        const rect = node.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.hypot(dx, dy)
        const radius = rect.width / 2

        // Unit direction vector from star center to cursor.
        const dirX = dist > 1 ? dx / dist : 0
        const dirY = dist > 1 ? dy / dist : 0

        // Proximity: 1 when cursor is on the star, falls off exponentially
        // past the star's edge. Half-life ≈ 195 px.
        const edgeDist = Math.max(0, dist - radius)
        const prox = Math.exp(-edgeDist / 280)

        // Encode direction × proximity so mx/my naturally attenuate with distance.
        mx.set(dirX * 0.5 * prox)
        my.set(dirY * 0.5 * prox)
        cursorRef.current = { x: dirX * prox, y: dirY * prox }
        engage.set(prox)
        hoverRef.current = prox > 0.45
      })
    }

    // Reset when cursor exits the document entirely.
    const onDocLeave = () => {
      mx.set(0); my.set(0)
      cursorRef.current = null
      engage.set(0)
      hoverRef.current = false
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseleave", onDocLeave)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onDocLeave)
    }
  }, [mx, my, engage, reduced])

  const onDown = React.useCallback(() => setPressed(true), [])
  const onUp = React.useCallback(() => setPressed(false), [])

  // Track click-effect timers so unmounting (Ask Leo sidebar close) doesn't
  // leave timers running that then call setState on an unmounted component.
  const clickTimersRef = React.useRef<Set<any>>(new Set())
  React.useEffect(() => {
    const set = clickTimersRef.current
    return () => {
      for (const t of set) clearTimeout(t)
      set.clear()
    }
  }, [])

  const ringIdRef = React.useRef(0)
  const onClick = React.useCallback(() => {
    if (reduced) return
    setCast(true)
    const tCast = setTimeout(() => {
      clickTimersRef.current.delete(tCast)
      setCast(false)
    }, 720)
    clickTimersRef.current.add(tCast)

    const id = ++ringIdRef.current
    setRings(prev => [...prev, id])
    const tRing = setTimeout(() => {
      clickTimersRef.current.delete(tRing)
      setRings(prev => prev.filter(r => r !== id))
    }, 800)
    clickTimersRef.current.add(tRing)

    spawnBurst(6)
  }, [reduced, spawnBurst])

  const onIconKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    onClick()
  }, [onClick])

  return (
    <span
      ref={rootRef}
      role="button"
      tabIndex={0}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none",
        sz.root,
      )}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onClick={onClick}
      onKeyDown={onIconKeyDown}
    >
      {/* Breathing aura — subtle background presence */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-22%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${GLOW} 0%, transparent 65%)`,
          opacity: reduced ? 0.04 : auraOpacity,
          scale: reduced ? 1 : auraScale,
        }}
      />

      {/* Click ring waves — complementary gold */}
      <AnimatePresence>
        {rings.map(id => (
          <motion.span
            key={id}
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: sz.px * 0.5,
              height: sz.px * 0.5,
              border: `1px solid ${GLOW}`,
            }}
            initial={{ opacity: 0.7, scale: 0.35 }}
            animate={{ opacity: 0, scale: 2.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: EASE_SOFT }}
          />
        ))}
      </AnimatePresence>

      {/* Firefly twinkles — biased toward cursor direction */}
      <AnimatePresence>
        {twinkles.map(t => (
          <TwinkleDot key={t.id} t={t} onDone={removeTwinkle} />
        ))}
      </AnimatePresence>

      <LeoStarSVG
        px={sz.px}
        reduced={reduced}
        pressed={pressed}
        cast={cast}
        mx={mx}
        my={my}
        engage={engage}
      />
    </span>
  )
}

// ─── Public export ───────────────────────────────────────────────────────────

/**
 * Animated Ask Leo icon.
 *
 * @example
 * // Ambient — subtle always-on presence (no cursor reactions)
 * <LeoIcon variant="ambient" size="md" />
 *
 * // Interactive — cursor-aware, for hero/welcome surfaces
 * <LeoIcon variant="interactive" size="xl" />
 */
export function LeoIcon({
  variant = "ambient",
  size = "md",
  sparkleCadence = "default",
  orbitingSparkles = true,
  className,
  style,
}: LeoIconProps) {
  const reduced = useReducedMotion() ?? false
  const sz = SIZES[size]

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={style}
    >
      {variant === "interactive"
        ? <InteractiveIcon sz={sz} reduced={reduced} />
        : (
          <AmbientIcon
            sz={sz}
            reduced={reduced}
            sparkleCadence={sparkleCadence}
            orbitingSparkles={orbitingSparkles}
          />
        )}
    </span>
  )
}
