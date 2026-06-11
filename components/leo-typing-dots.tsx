"use client"

/**
 * Leo "thinking" dots.
 *
 * Character arc embedded in motion:
 *   1. Enter — dots fade in from below, staggered.
 *   2. Slow phase (~900 ms) — very gentle, meditative pulse. Almost still.
 *      This is the "hmm, let me think…" moment.
 *   3. Fast phase — suddenly switches to an energetic, high-amplitude pulse.
 *      The "oh! I'm working on it" moment.
 *   4. Exit — instead of vanishing, each dot continues its motion while
 *      floating upward and fading. Feels like thoughts dispersing into an
 *      answer. Runs inside an `<AnimatePresence>` at the call site.
 *
 * Used in the Ask Leo sidebar while a reply is pending; can be reused for
 * any "thinking" affordance.
 */

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

type Phase = "slow" | "fast"

// Each dot reads its index from `custom` so its delay is a clean function of
// position, not hard-coded — keeps the stagger readable.
const dotVariants: Variants = {
  // Slow: barely moving, meditative. Duration long, amplitudes tiny.
  slow: (i: number) => ({
    opacity: [0.55, 0.8, 0.55],
    scale:   [0.9, 1.0, 0.9],
    y: 0,
    transition: {
      duration: 2.8,
      repeat: Infinity,
      ease: [0.45, 0.05, 0.5, 1],
      delay: i * 0.32,
    },
  }),
  // Fast: energetic, high-amplitude, "processing at full speed".
  fast: (i: number) => ({
    opacity: [0.6, 1, 0.6],
    scale:   [0.72, 1.28, 0.72],
    y: 0,
    transition: {
      duration: 0.9,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.14,
    },
  }),
}

export type LeoTypingDotsProps = {
  className?: string
  /** `status` = polite live region; `decorative` = aria-hidden only. */
  variant?: "status" | "decorative"
  /** Announced when variant is `status`. */
  statusLabel?: string
}

export function LeoTypingDots({
  className,
  variant = "status",
  statusLabel = "Leo is thinking",
}: LeoTypingDotsProps) {
  const reduced = useReducedMotion() ?? false
  const [phase, setPhase] = React.useState<Phase>("slow")

  React.useEffect(() => {
    if (reduced) return
    // After the slow "settling" period, snap to the fast tempo.
    const t = setTimeout(() => setPhase("fast"), 900)
    return () => clearTimeout(t)
  }, [reduced])

  const ariaProps = variant === "decorative"
    ? ({ "aria-hidden": true } as const)
    : ({ role: "status", "aria-live": "polite" } as const)

  return (
    <motion.span
      {...ariaProps}
      className={cn("inline-flex items-center gap-1", className)}
      // Container fades together on the way out. Each dot's exit adds the motion.
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0 } : {
        opacity: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {variant === "status" && <span className="sr-only">{statusLabel}</span>}
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-brand"
          custom={i}
          variants={dotVariants}
          initial={reduced ? false : { opacity: 0, scale: 0.5, y: 4 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : phase}
          // Exit: keep pulsing once more, float up, fade. Staggered so they
          // leave in a little wave rather than simultaneously.
          exit={reduced ? { opacity: 0 } : {
            opacity: [0.9, 1, 0],
            scale:   [1, 1.35, 0.3],
            y:       [0, -4, -14],
            transition: {
              duration: 0.55,
              delay: i * 0.06,
              times: [0, 0.35, 1],
              ease: [0.3, 0, 0.2, 1],
            },
          }}
        />
      ))}
    </motion.span>
  )
}
