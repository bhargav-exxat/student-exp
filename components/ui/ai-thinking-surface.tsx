"use client"

/**
 * AiThinkingOverlay / AiThinkingSurface — ambient "AI is thinking" indicator.
 *
 * Drops a soft, drifting dot cloud onto any surface to signal the assistant
 * is working. Intentionally decorative — pair with a visible text/sr-only
 * status so screen readers still hear "Leo is thinking" / "Generating…".
 *
 * Two ways to use:
 *
 * 1) **Overlay** — drop inside an existing `relative` container:
 *
 *      <div className="relative rounded-xl border p-6">
 *        <AiThinkingOverlay active={isPending} />
 *        <YourContent />
 *      </div>
 *
 * 2) **Surface** — wraps children and handles positioning for you:
 *
 *      <AiThinkingSurface active={isPending} className="rounded-xl border p-6">
 *        <YourContent />
 *      </AiThinkingSurface>
 *
 * Accessibility: the overlay is `aria-hidden` and `pointer-events-none`;
 * always render a live status element next to it, e.g.
 *   <span role="status" aria-live="polite" className="sr-only">Generating…</span>
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { DotPattern } from "@/components/ui/dot-pattern"

export interface AiThinkingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When false (default), nothing renders. Flip to true while the AI is working. */
  active?: boolean
  /** Number of drifting soft clouds. Keep small (1–2) for most surfaces. */
  cloudCount?: number
  /** Radius of each cloud in px — scale up for large surfaces. */
  cloudRadius?: number
  /** Grid tile size (both width and height of the repeating dot tile). */
  gridSize?: number
  /** Per-dot radius. */
  dotRadius?: number
  /** Tailwind utility for the dot fill (e.g. `"fill-foreground/35"`). */
  fillClassName?: string
}

/**
 * Absolute overlay. The parent must be `position: relative` and should usually
 * clip overflow (e.g. `rounded-xl overflow-hidden`) so the drifting clouds
 * don't paint outside the surface.
 */
export function AiThinkingOverlay({
  active = false,
  cloudCount = 2,
  cloudRadius = 260,
  gridSize = 14,
  dotRadius = 0.8,
  fillClassName = "fill-foreground/35 dark:fill-foreground/45",
  className,
  ...props
}: AiThinkingOverlayProps) {
  if (!active) return null
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      {...props}
    >
      <DotPattern
        glow
        glowCount={cloudCount}
        glowRadius={cloudRadius}
        width={gridSize}
        height={gridSize}
        cr={dotRadius}
        className={cn("absolute inset-0 size-full", fillClassName)}
      />
    </div>
  )
}

export interface AiThinkingSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<AiThinkingOverlayProps, "active" | "cloudCount" | "cloudRadius" | "gridSize" | "dotRadius" | "fillClassName"> {
  /** Optional className applied to the content wrapper (above the overlay). */
  contentClassName?: string
}

/**
 * Wrapper that adds `relative overflow-hidden`, renders the overlay, and
 * stacks children above it. Use when you'd otherwise have to manually wire
 * positioning around `<AiThinkingOverlay>`.
 */
export function AiThinkingSurface({
  active,
  cloudCount,
  cloudRadius,
  gridSize,
  dotRadius,
  fillClassName,
  className,
  contentClassName,
  children,
  ...props
}: AiThinkingSurfaceProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <AiThinkingOverlay
        active={active}
        cloudCount={cloudCount}
        cloudRadius={cloudRadius}
        gridSize={gridSize}
        dotRadius={dotRadius}
        fillClassName={fillClassName}
      />
      <div className={cn("relative z-[1]", contentClassName)}>{children}</div>
    </div>
  )
}
