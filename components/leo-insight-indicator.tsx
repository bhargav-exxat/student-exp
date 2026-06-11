"use client"

/**
 * LeoInsightIndicator — reusable AI insight chip + popover.
 *
 * Usage:
 *   <LeoInsightIndicator insight={leoInsight} chartTitle="Placement Trends" />
 *   <LeoInsightIndicator insight={leoInsight} chartTitle="..." triggerLayout="plot-marker" />
 *
 * Two trigger layouts:
 *   "toolbar"     — compact "Insight" pill in a card header corner (default)
 *   "plot-marker" — sits above an anchored data point on the chart canvas
 *
 * Palette is brand-only. Direction is communicated via icon SHAPE + kind LABEL
 * + signed delta value (never colour alone — WCAG 1.4.1).
 */

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-sidebar"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Optional anchor for drawing Leo on the plot (reference line + marker). */
export type ChartLeoInsightAnchor = {
  /** Categorical value on the chart's X axis (e.g. month label). */
  xValue: string
  /** Fixed Y in data space; overrides yDataKeys / yCombine when set. */
  yValue?: number
  /** Row keys to combine; required when yValue is omitted. */
  yDataKeys?: string[]
  /** How to derive Y from yDataKeys: top of stacked bars = "sum", overlaid lines = "max". */
  yCombine?: "max" | "sum"
}

/**
 * Semantic kind of the insight — drives color, icon, and chip label.
 * Defaults to "anomaly" when unset.
 */
export type ChartLeoInsightKind = "spike" | "dip" | "anomaly" | "trend"

/** Smart scan copy for a chart — opens in a popover; CTA can prefill Ask Leo. */
export type ChartLeoInsight = {
  /** Short attention line (what stands out). */
  headline: string
  /** Plain-language explanation. */
  explanation: string
  /** Overrides the default prompt sent to Ask Leo. */
  askLeoPrompt?: string
  /**
   * When set, pair with `ChartLeoPlotInsightOverlay` for an on-point pulse
   * + guide line + chip positioned directly on the chart.
   */
  anchor?: ChartLeoInsightAnchor
  /** Semantic shape of the insight. Defaults to "anomaly". */
  kind?: ChartLeoInsightKind
  /** Magnitude chip, e.g. `{ value: "-24%", label: "vs last Dec" }`. */
  delta?: { value: string; label?: string }
  /** 2–4 supporting facts shown as bullets in the popover. */
  bullets?: string[]
  /** Optional secondary quick-actions alongside the Ask Leo CTA. */
  actions?: Array<{
    label: string
    icon?: string
    onSelect?: () => void
    href?: string
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal constants
// ─────────────────────────────────────────────────────────────────────────────

const LEO_KIND_META: Record<ChartLeoInsightKind, { icon: string; label: string }> = {
  spike:   { icon: "fa-arrow-trend-up",   label: "Spike"   },
  dip:     { icon: "fa-arrow-trend-down", label: "Dip"     },
  anomaly: { icon: "fa-wave-pulse",       label: "Anomaly" },
  trend:   { icon: "fa-sparkles",         label: "Insight" },
}

export const LEO_TOKENS = {
  dotClass:    "bg-brand",
  iconClass:   "text-brand",
  softBgClass: "bg-brand/10",
  borderClass: "border-brand/50",
  cssVar:      "var(--brand-color)",
} as const

function resolveLeoMeta(insight: ChartLeoInsight) {
  return LEO_KIND_META[insight.kind ?? "anomaly"]
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reusable Leo insight chip + popover.
 *
 * Renders a pill trigger button that opens a Radix Popover containing:
 *   - Header: "Leo spotted" serif label + kind chip + close button
 *   - Body: headline, delta label, explanation, optional bullets
 *   - Footer: optional secondary actions + full-width "Ask Leo" CTA
 */
export function LeoInsightIndicator({
  insight,
  chartTitle,
  triggerLayout = "toolbar",
}: {
  insight: ChartLeoInsight
  chartTitle: string
  triggerLayout?: "toolbar" | "plot-marker"
}) {
  const { openWithPrompt } = useAskLeo()
  const [open, setOpen] = React.useState(false)
  const titleId = React.useId()
  const descriptionId = React.useId()

  const defaultPrompt =
    insight.askLeoPrompt ??
    `For the chart "${chartTitle}": ${insight.headline} — ${insight.explanation} What should we do next?`

  const meta = resolveLeoMeta(insight)
  const isPlot = triggerLayout === "plot-marker"
  const deltaValue = insight.delta?.value

  const directionLabel =
    insight.kind === "dip"     ? "decreased" :
    insight.kind === "spike"   ? "increased" :
    insight.kind === "anomaly" ? "anomaly detected" : "insight"

  const ariaFull = deltaValue
    ? `Leo insight: ${directionLabel} ${deltaValue}. ${insight.headline}.`
    : `Leo insight: ${insight.headline}.`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaFull}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            // WCAG 2.5.5 Target Size (AA): 28×28 min.
            "relative inline-flex h-7 min-h-7 shrink-0 items-center gap-1.5 rounded-full border bg-card px-2.5 text-xs font-semibold shadow-sm",
            "text-foreground",
            LEO_TOKENS.borderClass,
            "transition-[transform,background-color] duration-150",
            "hover:-translate-y-[0.5px] hover:bg-card",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {/* Soft brand fill */}
          <span
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 rounded-full", LEO_TOKENS.softBgClass)}
          />
          <i
            className={cn("fa-solid", meta.icon, "relative text-[12px]", LEO_TOKENS.iconClass)}
            aria-hidden="true"
          />
          {deltaValue ? (
            <span className="relative tabular-nums">{deltaValue}</span>
          ) : !isPlot ? (
            <span className="relative hidden sm:inline">Insight</span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "relative w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden p-0",
          "border border-border bg-background shadow-xl",
          "hc:border-border hc:bg-card hc:shadow-none",
          "forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:shadow-none",
        )}
        align={isPlot ? "center" : "end"}
        side={isPlot ? "top" : "bottom"}
        sideOffset={isPlot ? 12 : 6}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {/* Ambient brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 forced-colors:hidden"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 100%, oklch(from var(--brand-color) l c h / 0.08) 0%, transparent 68%)",
          }}
        />

        {/* Screen-reader announcement */}
        <span className="sr-only">
          {`Leo spotted a ${meta.label.toLowerCase()}${deltaValue ? ` of ${deltaValue}` : ""}: ${insight.headline}`}
        </span>

        <div className="relative">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 border-b border-border px-3.5 pb-3 pt-3">
            <span
              aria-hidden
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10"
            >
              <i className="fa-duotone fa-solid fa-star-christmas text-[11px] text-brand" aria-hidden="true" />
            </span>

            {/* Serif "Leo spotted" heading */}
            <h2
              className="text-base font-bold leading-tight tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Leo spotted
            </h2>

            {/* Kind + delta chip */}
            <span
              className={cn(
                "ms-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold text-foreground",
                LEO_TOKENS.softBgClass,
                LEO_TOKENS.borderClass,
              )}
            >
              <i
                className={cn("fa-solid", meta.icon, "text-[10px]", LEO_TOKENS.iconClass)}
                aria-hidden="true"
              />
              <span>{meta.label}</span>
              {deltaValue ? (
                <>
                  <span aria-hidden className="text-muted-foreground">·</span>
                  <span className="tabular-nums">{deltaValue}</span>
                </>
              ) : null}
            </span>

            {/* Close — WCAG 2.5.5: 28×28 target + Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Close insight"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "icon-button-chrome inline-flex size-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md",
                    "transition-colors hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <i className="fa-solid fa-xmark text-[12px]" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="flex items-center gap-1.5">
                <span>Close</span>
                <Kbd>Esc</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="px-3.5 pb-3 pt-3">
            <h3
              id={titleId}
              className="text-[13px] font-semibold leading-snug text-foreground"
            >
              {insight.headline}
            </h3>
            {insight.delta?.label ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {insight.delta.label}
              </p>
            ) : null}
            <p
              id={descriptionId}
              className="mt-2 text-[12.5px] leading-relaxed text-foreground"
            >
              {insight.explanation}
            </p>

            {insight.bullets && insight.bullets.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {insight.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px] leading-snug text-foreground"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 inline-block size-1.5 shrink-0 rounded-full",
                        LEO_TOKENS.dotClass,
                      )}
                    />
                    <span className="min-w-0 flex-1">{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5 border-t border-border px-2.5 py-2">
            {insight.actions?.map((a) => {
              const content = (
                <>
                  {a.icon ? (
                    <i className={cn("fa-light", a.icon, "text-[11px]")} aria-hidden="true" />
                  ) : null}
                  <span>{a.label}</span>
                </>
              )
              return (
                <Button
                  key={a.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 min-h-8 w-full justify-center gap-1.5 px-2 text-[11.5px] text-foreground hover:text-foreground"
                  onClick={() => {
                    setOpen(false)
                    a.onSelect?.()
                  }}
                  asChild={!!a.href}
                >
                  {a.href ? <a href={a.href}>{content}</a> : content}
                </Button>
              )
            })}
            <Button
              type="button"
              size="sm"
              className="h-8 min-h-8 w-full justify-center gap-1.5 px-3 text-[11.5px]"
              onClick={() => {
                setOpen(false)
                openWithPrompt(defaultPrompt)
              }}
            >
              <i
                className="fa-duotone fa-solid fa-star-christmas text-[11px] text-primary-foreground"
                aria-hidden="true"
              />
              <span>Ask Leo</span>
              <AskLeoShortcutKbds
                variant="bare"
                className="ms-0.5 hidden sm:inline-flex"
              />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
