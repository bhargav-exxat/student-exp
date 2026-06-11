"use client"

/**
 * Pill action from Question hub → Create a question (e.g. "Draft with Leo" + AI badge).
 * Single implementation — do not duplicate classes on other routes.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

export interface LibraryHubCreateTileButtonProps {
  label: string
  icon: string
  onClick: () => void
  /** When `"AI"`, renders duotone Leo star + uppercase AI chip (hub Leo tile). */
  badge?: "AI" | null
  disabled?: boolean
  "aria-busy"?: boolean
  /** Shown instead of `label` when `aria-busy` is true. */
  busyLabel?: string
  className?: string
}

export function LibraryHubCreateTileButton({
  label,
  icon,
  onClick,
  badge = null,
  disabled = false,
  "aria-busy": ariaBusy,
  busyLabel,
  className,
}: LibraryHubCreateTileButtonProps) {
  const displayLabel = ariaBusy && busyLabel ? busyLabel : label

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={ariaBusy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition",
        "hover:border-interactive-hover hover:bg-interactive-hover/30 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <i
        className={cn(
          badge === "AI" ? "fa-duotone fa-solid" : "fa-light",
          icon,
          "text-xs",
          badge === "AI" ? "text-brand" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      {displayLabel}
      {badge === "AI" ? (
        <span className="rounded-full bg-brand/10 px-1.5 py-px text-[11px] font-bold uppercase tracking-wider text-brand">
          AI
        </span>
      ) : null}
    </button>
  )
}
