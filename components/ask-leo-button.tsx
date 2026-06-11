"use client"

/**
 * AskLeoButton — chart-card Leo CTA (outline sm, duotone star + label).
 *
 * Default `onClick` toggles the Ask Leo sidebar (`useAskLeo`). Pass `onClick`
 * to override (e.g. inline draft on the new-question composer).
 *
 * @see charts-overview.tsx — ChartCard header (canonical usage)
 * @see AGENTS.md / charts-overview file header — Ask Leo icon guideline
 */

import * as React from "react"

import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-sidebar"
import { Button } from "@/components/ui/button"
import { LeoIcon } from "@/components/ui/leo-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface AskLeoButtonProps {
  /** Matches chart card header (`sm`) or page header actions (`lg`, e.g. Save question). */
  size?: "sm" | "lg"
  /** When true, hides the text label (chart selector variant). */
  iconOnly?: boolean
  /** Button label. Default `"Ask Leo"`. */
  label?: string
  /** Overrides sidebar toggle — use for route-local Leo actions. */
  onClick?: () => void
  disabled?: boolean
  "aria-busy"?: boolean
  /** Accessible name; defaults to `label`. */
  ariaLabel?: string
  /** Shown instead of `label` when `aria-busy` is true. */
  busyLabel?: string
  /** Tooltip body before shortcut chips. Defaults to `label`. */
  tooltipLabel?: string
  /** When false, tooltip omits ⌘⌥K hints (non-sidebar actions). Default true. */
  showShortcut?: boolean
  /**
   * Animated Leo star (`LeoIcon` ambient). Defaults to true when `size="lg"`.
   * Chart cards keep the static duotone glyph (`size="sm"`).
   */
  animatedStar?: boolean
  className?: string
}

export function AskLeoButton({
  size = "sm",
  iconOnly = false,
  label = "Ask Leo",
  onClick: onClickProp,
  disabled = false,
  "aria-busy": ariaBusy,
  ariaLabel,
  busyLabel,
  tooltipLabel,
  showShortcut = true,
  animatedStar,
  className,
}: AskLeoButtonProps) {
  const { toggle } = useAskLeo()
  const displayLabel = ariaBusy && busyLabel ? busyLabel : label
  const tipText = tooltipLabel ?? label
  const useAnimatedStar = animatedStar ?? size === "lg"

  const leoFillClass =
    "[--leo-icon-fill:var(--brand-color-dark)] dark:[--leo-icon-fill:var(--brand-color-light)]"

  const starMark = useAnimatedStar ? (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        leoFillClass,
        size === "lg" ? "size-9 min-w-9" : "size-8 min-w-8",
      )}
    >
      <LeoIcon
        variant="ambient"
        size="sm"
        sparkleCadence="default"
        orbitingSparkles={false}
        className="pointer-events-none overflow-visible"
      />
    </span>
  ) : (
    <i
      className={cn(
        "fa-duotone fa-solid fa-star-christmas text-[color:var(--brand-color-dark)] dark:text-[color:var(--brand-color-light)]",
        size === "lg" ? "text-[13px]" : "text-xs",
      )}
      aria-hidden="true"
    />
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size={size}
          variant="outline"
          disabled={disabled}
          aria-busy={ariaBusy}
          className={cn(
            "shrink-0 gap-1.5",
            size === "sm" && "h-7 px-2 text-xs",
            useAnimatedStar && "overflow-visible",
            className,
          )}
          aria-label={ariaLabel ?? displayLabel}
          onClick={onClickProp ?? toggle}
        >
          {starMark}
          {!iconOnly ? <span>{displayLabel}</span> : null}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{tipText}</span>
        {showShortcut ? <AskLeoShortcutKbds /> : null}
      </TooltipContent>
    </Tooltip>
  )
}
