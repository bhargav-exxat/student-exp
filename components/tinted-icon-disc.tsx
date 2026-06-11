"use client"

/**
 * Dashboard / feed — decorative icon on a tinted disc. Colors come from `app/globals.css`
 * `--icon-disc-*` tokens (WCAG 1.4.11-friendly pairings). Prefer this over ad-hoc `oklch(from …)`.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type TintedIconDiscTone = "chart-2" | "chart-4" | "brand" | "destructive"

const TONE_CLASS: Record<TintedIconDiscTone, string> = {
  "chart-2":
    "bg-[var(--icon-disc-chart-2-bg)] text-[var(--icon-disc-chart-2-fg)]",
  "chart-4":
    "bg-[var(--icon-disc-chart-4-bg)] text-[var(--icon-disc-chart-4-fg)]",
  brand: "bg-[var(--icon-disc-brand-bg)] text-[var(--icon-disc-brand-fg)]",
  destructive:
    "bg-[var(--icon-disc-danger-bg)] text-[var(--icon-disc-danger-fg)]",
}

export interface TintedIconDiscProps {
  /** Font Awesome icon class suffix, e.g. `fa-arrow-trend-up` (paired with `fa-light`). */
  icon: string
  tone: TintedIconDiscTone
  size?: "sm" | "md" | "lg"
  className?: string
}

export function TintedIconDisc({
  icon,
  tone,
  size = "md",
  className,
}: TintedIconDiscProps) {
  const sizeClass =
    size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-12 w-12 text-xl" : "h-7 w-7 text-xs"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full hc:border hc:border-foreground forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
        sizeClass,
        TONE_CLASS[tone],
        className,
      )}
      aria-hidden="true"
    >
      <i className={cn("fa-light", icon)} />
    </span>
  )
}
