"use client"

/**
 * ChartsOverview — Dashboard chart gallery
 *
 * ── ChartCard variants ───────────────────────────────────────────────────────
 *   normal       — plain card with Ask Leo
 *   tabs         — "Chart" | "Trend (Line)" tabs + Ask Leo
 *   selector     — quick-filter Select + Ask Leo
 *   metrics-tabs — metric cells ARE the tab triggers (label + value + trend)
 *
 * ── ASK LEO ICON GUIDELINE ───────────────────────────────────────────────────
 *   Always use: <i className="fa-duotone fa-solid fa-star-christmas" />
 *   Never use:  fa-wand-magic-sparkles  (retired, inconsistent)
 *   Size:       text-xs (11px via --text-xs)  with  aria-hidden="true"
 *   Label:      "Ask Leo"  (never truncate or omit the text label)
 *   Applies to: ALL Ask Leo buttons across the entire app —
 *               ChartCard headers, KeyMetrics card, GreetingWidget, NavUser, etc.
 *
 * ── WCAG AA STANDARDS FOR GRAPHS ─────────────────────────────────────────────
 *   1. Container landmark
 *      • Wrap each chart in a <figure> (or div with role="figure") +
 *        aria-label="<chart title>" + aria-describedby="<id of summary>"
 *      • Add a visually-hidden <figcaption id="<id>"> with a plain-text
 *        summary of the key trend (e.g. "Placements rose 12% in Q1 2026").
 *
 *   2. Keyboard navigation
 *      • The ChartContainer wrapper must have tabIndex={0} so it receives focus.
 *      • On focus, announce title + summary via aria-label / aria-describedby.
 *      • Arrow keys (←/→) cycle through data points; announce value via
 *        a live region (role="status" aria-live="polite").
 *      • Esc clears the selection and returns focus to the container.
 *
 *   3. Accessible data table (hidden fallback)
 *      • Immediately after the SVG/canvas, render a <table> wrapped in
 *        <span className="sr-only"> (visually hidden, in DOM).
 *      • Columns mirror the chart axes; each data point is a <td>.
 *      • Screen-reader users can navigate data with standard table shortcuts.
 *
 *   4. Colour & contrast
 *      • Chart series colours must achieve ≥ 3:1 contrast against the card bg.
 *      • Never use colour as the ONLY differentiator — pair with:
 *          - Dashed vs solid line strokes
 *          - Direct inline labels on lines/segments
 *          - Shape markers on data points (circle vs square vs triangle)
 *      • Text labels inside charts: ≥ 4.5:1 on their local background.
 *
 *   5. Focus ring on data points
 *      • Active/focused data point: 3px outline, ≥ 3:1 contrast, distinct
 *        from the hover state (use outline-offset to separate).
 *
 *   6. Tooltip accessibility
 *      • Tooltips must appear on keyboard focus, not only on mouse hover.
 *      • Tooltip content must be announced to the live region.
 *      • Tooltip must remain visible while it has focus (no auto-dismiss).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as React from "react"
import {
  Area,   AreaChart,
  Bar,    BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel, FunnelChart, LabelList,
  Line,   LineChart,
  Pie,    PieChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar,  RadarChart,
  RadialBar, RadialBarChart,
  Scatter,   ScatterChart,
  XAxis, YAxis, ZAxis,
  type DotItemDotProps,
} from "recharts"
import {
  QuotaLinearProgressCardBody,
  QuotaRadialChartInner,
} from "@/components/dashboard-quota-progress-card"
import {
  DASHBOARD_STUDENT_SCORES,
  formatBandScore,
  type StudentScoreRadial,
} from "@/lib/mock/dashboard"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AskLeoButton } from "@/components/ask-leo-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isEditableTarget } from "@/lib/editable-target"
import { chartLineStrokeDash } from "@/lib/chart-line-dash"
import { rafThrottle } from "@/lib/raf-throttle"
import { cn } from "@/lib/utils"
import { metricTrendTone, type MetricTrendPolarity } from "@/components/key-metrics"

/** Recharts passes `index` into Line `dot` renderers; keep the callback typed against the v3 dot contract. */
type LineDotRenderProps = DotItemDotProps & { index?: number }

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

type MiniMetric = {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
  /** Same semantics as `MetricItem.trendPolarity` on `KeyMetrics`. */
  trendPolarity?: MetricTrendPolarity
}

/* ── Colour tokens ────────────────────────────────────────────────────────── */
const BRAND       = "var(--brand-color)"
const CHART_1     = "var(--color-chart-1)"
const CHART_2     = "var(--color-chart-2)"
const CHART_3     = "var(--color-chart-3)"
const CHART_4     = "var(--color-chart-4)"
const CHART_5     = "var(--color-chart-5)"
const SUCCESS     = "var(--chart-2)"
const WARNING     = "var(--chart-4)"
const DESTRUCTIVE = "var(--destructive)"

/* ── Period filter options (reused across selector cards) ─────────────────── */
const PERIOD_OPTIONS = [
  { value: "7d",  label: "Last 7 days"  },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last quarter" },
  { value: "1y",  label: "Last year"   },
]

const PROGRAM_OPTIONS = [
  { value: "all",      label: "All programs" },
  { value: "nursing",  label: "Nursing"      },
  { value: "pt",       label: "PT"           },
  { value: "ot",       label: "OT"           },
  { value: "pharmacy", label: "Pharmacy"     },
]

/* ════════════════════════════════════════════════════════════════════════════
   REUSABLE ChartCard — supports 3 variants
   ════════════════════════════════════════════════════════════════════════════ */

export type ChartCardVariant = "normal" | "tabs" | "selector" | "metrics-tabs" | "kpi-chart"

/** ChartCard tabs no longer force `text-xs` — use default `text-sm` scale and ≥24px hit area. */
const chartCardTabTriggerClass = "min-h-9 px-3 py-2 text-sm gap-2"

import {
  LeoInsightIndicator,
  LEO_TOKENS,
  type ChartLeoInsight,
  type ChartLeoInsightAnchor,
  type ChartLeoInsightKind,
} from "@/components/leo-insight-indicator"
export type { ChartLeoInsight, ChartLeoInsightAnchor, ChartLeoInsightKind }

type ChartLeoInsightBundle = { insight: ChartLeoInsight; chartTitle: string }

const ChartLeoInsightContext = React.createContext<ChartLeoInsightBundle | null>(null)

function resolveChartLeoAnchorY(
  row: Record<string, unknown>,
  xDataKey: string,
  anchor: ChartLeoInsightAnchor,
): number | null {
  if (typeof anchor.yValue === "number" && !Number.isNaN(anchor.yValue)) {
    return anchor.yValue
  }
  const keys =
    anchor.yDataKeys?.filter((k) => k !== xDataKey) ??
    Object.keys(row).filter((k) => k !== xDataKey)
  const nums = keys
    .map((k) => row[k])
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v))
  if (nums.length === 0) return null
  const combine = anchor.yCombine ?? "max"
  return combine === "sum" ? nums.reduce((a, b) => a + b, 0) : Math.max(...nums)
}

function chartLeoNumericDomainMax(
  data: ReadonlyArray<Record<string, string | number | null | undefined>>,
  xDataKey: string,
): number {
  let m = 0
  for (const row of data) {
    for (const [k, v] of Object.entries(row)) {
      if (k === xDataKey) continue
      if (typeof v === "number" && !Number.isNaN(v) && v > m) m = v
    }
  }
  return m > 0 ? m : 1
}

/**
 * Static brand-coloured dot drawn on the exact data point Leo is calling out.
 * A card-coloured knockout ring keeps it readable on top of grid lines and
 * area fills. No pulsing animation — the dashed connector line + chip do the
 * attention work, and this keeps the chart calm.
 */
function LeoPlotPointDot() {
  return (
    <span
      aria-hidden
      className={cn("block size-2.5 rounded-full", LEO_TOKENS.dotClass)}
      style={{
        boxShadow: `0 0 0 3px oklch(from var(--card) l c h / 0.95)`,
      }}
    />
  )
}

/**
 * Read the Recharts SVG rendered by a sibling `ChartContainer` and project
 * the insight anchor's `(xValue, yNum)` into pixel coordinates relative to
 * the overlay's wrapper.
 *
 * Strategy — chart-type-agnostic:
 *   1. Find the `<svg>` inside the parent (`.relative` wrapper).
 *   2. Plot rect = bounding box of `.recharts-cartesian-grid`.
 *      Fallback = area between y-axis right edge and x-axis top edge.
 *   3. X position = matching x-axis tick's centre, matched by text content.
 *      Fallback = `(idx + 0.5) / n * plotWidth` band formula.
 *   4. Y position = interpolated from y-axis tick values (handles non-zero
 *      domain bases automatically — e.g. recharts auto-domains that start at
 *      non-zero and charts with cropped y-ranges). Fallback = `1 - y/yMax`.
 *
 * Works on: Line/Area/Bar/StackedBar/Composed charts — anything with Cartesian
 * axes. Pie/Radar/Funnel charts don't expose axes, so the overlay skips with
 * a null return (anchor concept isn't meaningful there).
 */
function useChartAnchorPixelPosition({
  xValue,
  xDataKey,
  yNum,
  data,
}: {
  xValue: string
  xDataKey: string
  yNum: number
  data: ReadonlyArray<Record<string, string | number | null | undefined>>
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{ x: number; y: number; plotTop: number } | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    const compute = () => {
      const svg = parent.querySelector("svg") as SVGSVGElement | null
      if (!svg) return
      const parentRect = parent.getBoundingClientRect()

      const toLocal = (el: Element) => {
        const r = (el as SVGGraphicsElement).getBoundingClientRect()
        return {
          left: r.left - parentRect.left,
          right: r.right - parentRect.left,
          top: r.top - parentRect.top,
          bottom: r.bottom - parentRect.top,
          width: r.width,
          height: r.height,
          cx: r.left + r.width / 2 - parentRect.left,
          cy: r.top + r.height / 2 - parentRect.top,
        }
      }

      // Plot rect — prefer cartesian-grid; fall back to axis bounds.
      const grid = svg.querySelector(".recharts-cartesian-grid")
      const xAxis = svg.querySelector(".recharts-xAxis")
      const yAxis = svg.querySelector(".recharts-yAxis")
      if (!xAxis || !yAxis) return

      const plot = grid ? toLocal(grid) : (() => {
        const y = toLocal(yAxis)
        const x = toLocal(xAxis)
        return {
          left: y.right, right: x.right, top: y.top,
          bottom: x.top, width: x.right - y.right, height: x.top - y.top,
          cx: 0, cy: 0,
        }
      })()

      // X position: find matching x-tick by text content (chart-agnostic).
      const xTicks = Array.from(
        xAxis.querySelectorAll(".recharts-cartesian-axis-tick"),
      ) as SVGGElement[]
      let xPx: number | null = null
      for (const t of xTicks) {
        if ((t.textContent ?? "").trim() === xValue) {
          xPx = toLocal(t).cx
          break
        }
      }
      if (xPx === null) {
        const idx = data.findIndex((d) => String(d[xDataKey]) === xValue)
        if (idx < 0) return
        xPx = plot.left + ((idx + 0.5) / Math.max(data.length, 1)) * plot.width
      }

      // Y position: interpolate from y-axis tick values (handles non-zero domains).
      const yTickEls = Array.from(
        yAxis.querySelectorAll(".recharts-cartesian-axis-tick"),
      ) as SVGGElement[]
      const yTickPairs: Array<{ v: number; y: number }> = []
      for (const t of yTickEls) {
        const raw = (t.textContent ?? "").trim()
        if (!raw) continue
        const v = parseFloat(raw.replace(/[^0-9.\-]/g, ""))
        if (Number.isNaN(v)) continue
        yTickPairs.push({ v, y: toLocal(t).cy })
      }
      let yPx: number | null = null
      if (yTickPairs.length >= 2) {
        const sorted = [...yTickPairs].toSorted((a, b) => a.v - b.v)
        const lo = sorted[0], hi = sorted[sorted.length - 1]
        if (hi.v !== lo.v) {
          yPx = lo.y + ((yNum - lo.v) / (hi.v - lo.v)) * (hi.y - lo.y)
        }
      }
      if (yPx === null) {
        // Conservative fallback when y-axis ticks cannot be parsed.
        const yMax = chartLeoNumericDomainMax(data, xDataKey)
        yPx = plot.top + (1 - yNum / yMax) * plot.height
      }

      // Equality-guard: ResizeObserver + MutationObserver fire on every frame
      // of the sidebar's 200ms width transition (and on every Recharts attribute
      // mutation during its own enter animation). Without this guard, each
      // sub-pixel shift triggers a React re-render of the overlay subtree —
      // multiplied by every chart on the page that's worth dozens of renders
      // per frame on a wide dashboard. 0.5px tolerance is well below any
      // visible misalignment of the dashed-line overlay.
      setPos((prev) => {
        if (
          prev !== null &&
          Math.abs(prev.x - xPx) < 0.5 &&
          Math.abs(prev.y - (yPx as number)) < 0.5 &&
          Math.abs(prev.plotTop - plot.top) < 0.5
        ) {
          return prev
        }
        return { x: xPx, y: yPx as number, plotTop: plot.top }
      })
    }

    // Recharts mounts/animates after our first paint; measure a few times.
    compute()
    let raf1 = requestAnimationFrame(() => {
      compute()
      raf1 = requestAnimationFrame(compute)
    })

    // rAF-coalesce: ResizeObserver + MutationObserver can each fire many times
    // per frame during the sidebar's `transition-[width]` (200ms ease-linear)
    // and during Recharts' own enter animation. Without throttling, `compute`
    // walks the SVG + parses tick text on every fire — which on the dashboard
    // (multiple chart cards × per-chart insight overlays) saturates the main
    // thread and makes the sidebar collapse/expand feel sluggish. One sample
    // per frame is plenty for sub-pixel anchor positioning. Same pattern as
    // `apps/web/hooks/use-sidebar-reflow-zoom.ts`.
    const scheduled = rafThrottle(compute)

    const ro = new ResizeObserver(scheduled)
    ro.observe(parent)

    const mo = new MutationObserver(scheduled)
    mo.observe(parent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["width", "height", "transform", "d", "x", "y"],
    })

    return () => {
      cancelAnimationFrame(raf1)
      scheduled.cancel()
      ro.disconnect()
      mo.disconnect()
    }
  }, [xValue, xDataKey, yNum, data])

  return { ref, pos }
}

/**
 * HTML overlay on the chart plot (sibling of `ChartContainer`, inside a `relative` wrapper).
 *
 * Visual structure, top → bottom:
 *   1. Chip (`LeoInsightIndicator` in plot-marker layout) — floats above
 *   2. Dashed connector line in the kind colour joining chip to dot
 *   3. Pulsing dot anchored on the real data point
 *
 * Positioning is measured from the Recharts SVG at runtime (see
 * `useChartAnchorPixelPosition`) so the dot lands on the actual data point
 * regardless of chart type, y-domain, or plot margin.
 */
export function ChartLeoPlotInsightOverlay({
  data,
  xDataKey,
  markerLiftPx = 44,
}: {
  data: ReadonlyArray<Record<string, string | number | null | undefined>>
  xDataKey: string
  /** @deprecated retained for call-site compatibility. */
  insetPct?: { left: number; right: number; top: number; bottom: number }
  /** @deprecated retained for call-site compatibility. */
  xAxisLabelReservePct?: number
  /** @deprecated retained for call-site compatibility. */
  markerLiftPct?: number
  /** @deprecated retained for call-site compatibility. */
  markerLiftExtraPx?: number
  /** Vertical distance from dot to the bottom of the floating chip, in px. */
  markerLiftPx?: number
}) {
  // Lift the chip well clear of the default Recharts tooltip so they never
  // fight for the same cursor area on hover.
  const effectiveLift = markerLiftPx ?? 56
  const bundle = React.useContext(ChartLeoInsightContext)
  const anchor = bundle?.insight.anchor

  const idx = anchor
    ? data.findIndex((d) => String(d[xDataKey]) === anchor.xValue)
    : -1
  const row = idx >= 0 ? (data[idx] as Record<string, unknown>) : null
  const yNum = row && anchor ? resolveChartLeoAnchorY(row, xDataKey, anchor) : null

  // NOTE: Hook must always run (React rules). Pass safe defaults when not ready.
  const { ref, pos } = useChartAnchorPixelPosition({
    xValue: anchor?.xValue ?? "",
    xDataKey,
    yNum: yNum ?? 0,
    data,
  })

  if (!bundle || !anchor || idx < 0 || yNum === null || Number.isNaN(yNum)) return null

  // Clamp the chip so it never renders above the plot rect.
  const chipBottomY = pos
    ? Math.max((pos.plotTop ?? 0) + 28, pos.y - effectiveLift)
    : 0

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-20"
      data-chart-leo-anchor=""
    >
      {pos && (
        <>
          {/* Dashed connector — chip bottom → ~7px above the dot, brand-coloured. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: pos.x,
              top: chipBottomY,
              height: Math.max(0, pos.y - chipBottomY - 7),
              transform: "translateX(-50%)",
              borderLeft: `2px dashed oklch(from ${LEO_TOKENS.cssVar} l c h / 0.7)`,
            }}
          />

          {/* Static brand dot anchored on the real data point */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <LeoPlotPointDot />
          </div>

          {/* Chip trigger — bottom edge meets the top of the dashed connector */}
          <div
            className="pointer-events-auto absolute"
            style={{
              left: pos.x,
              top: chipBottomY,
              transform: "translate(-50%, -100%)",
            }}
          >
            <LeoInsightIndicator
              insight={bundle.insight}
              chartTitle={bundle.chartTitle}
              triggerLayout="plot-marker"
            />
          </div>
        </>
      )}
    </div>
  )
}


/** Supplies Leo insight to chart bodies; optional corner control when there is no plot anchor. */
function ChartLeoInsightOverlay({
  leoInsight,
  chartTitle,
  children,
}: {
  leoInsight?: ChartLeoInsight | null
  chartTitle: string
  children: React.ReactNode
}) {
  const contextValue = React.useMemo(
    () => (leoInsight ? { insight: leoInsight, chartTitle } : null),
    [leoInsight, chartTitle],
  )
  if (!leoInsight || !contextValue) return <>{children}</>
  const showCorner = !leoInsight.anchor
  return (
    <ChartLeoInsightContext.Provider value={contextValue}>
      {showCorner ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {children}
          <div className="pointer-events-none absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
            <div className="pointer-events-auto">
              <LeoInsightIndicator insight={leoInsight} chartTitle={chartTitle} triggerLayout="toolbar" />
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </ChartLeoInsightContext.Provider>
  )
}

/** Screen-reader data fallback for charts — shared with list-page dashboards. */
export function ChartDataTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Keyboard-focusable chart region (arrow keys, Escape) + live announcement when a point is selected.
 * Shared by the `/dashboard` gallery and **Data** view dashboards (Placements / Team / Compliance): same
 * interaction model; visual differences come from `ChartCard` chrome and per-chart renderers (bar vs pie),
 * not from a separate chart implementation.
 */
export function ChartFigure({
  label,
  summary,
  dataLength,
  leoInsight,
  children,
}: {
  label: string
  summary: string
  dataLength: number
  /** Optional Ask-Leo insight context for chart bodies (same as `ChartCard`). */
  leoInsight?: ChartLeoInsight | null
  children: (activeIndex: number | null) => React.ReactNode
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const prevActiveIndexRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const prev = prevActiveIndexRef.current
    prevActiveIndexRef.current = activeIndex
    if (prev === null || activeIndex !== null) return
    const wrapper = ref.current?.querySelector<HTMLElement>(".recharts-wrapper")
    if (!wrapper) return
    wrapper.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, cancelable: true }),
    )
  }, [activeIndex])

  const navigateKeys = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!dataLength) return
      if (isEditableTarget(e.target)) return
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex((i) => (i === null ? 0 : Math.min(i + 1, dataLength - 1)))
          break
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex((i) => (i === null ? dataLength - 1 : Math.max(i - 1, 0)))
          break
        case "Escape":
          e.preventDefault()
          e.stopPropagation()
          setActiveIndex(null)
          ref.current?.blur()
          break
        default:
          break
      }
    },
    [dataLength],
  )

  /** Clicks on Recharts SVG do not focus this node — focus so Arrow keys work without extra Tab stops. */
  function handlePointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    if (!dataLength) return
    const root = ref.current
    if (!root?.contains(e.target as Node)) return
    const el = e.target as HTMLElement | null
    if (el?.closest?.("button, a, [role='tab'], [role='option'], input, select, textarea, [contenteditable='true']"))
      return
    queueMicrotask(() => root.focus())
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label={`${label}. ${summary}. Click the chart or press Tab to focus, then use arrow keys to explore data points. Press Escape to clear selection.`}
      onKeyDownCapture={(e) => {
        if (!ref.current?.contains(e.target as Node)) return
        if (isEditableTarget(e.target)) return
        if (
          e.key === "ArrowRight" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowUp" ||
          e.key === "Escape"
        ) {
          navigateKeys(e)
        }
      }}
      onPointerDownCapture={handlePointerDownCapture}
      className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
    >
      <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={label}>
        {children(activeIndex)}
      </ChartLeoInsightOverlay>
      {activeIndex !== null && (
        <div role="status" aria-live="polite" className="sr-only">
          Data point {activeIndex + 1} of {dataLength} selected
        </div>
      )}
    </div>
  )
}

function ChartCardHeader({
  title,
  description,
  variant,
  filterOptions,
  filter,
  onFilter,
}: {
  title: string
  description: string
  variant: ChartCardVariant
  filterOptions?: { value: string; label: string }[]
  filter?: string
  onFilter?: (v: string) => void
}) {
  const isSelector = variant === "selector" && Array.isArray(filterOptions) && filterOptions.length > 0
  return (
    <CardHeader className="shrink-0 pb-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
          <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Reveal on card hover/focus — pointer-events guarded so the hidden button is not reachable */}
          <span className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 inline-flex">
            <AskLeoButton
              iconOnly={isSelector}
              ariaLabel="Ask Leo about this chart"
            />
          </span>
          {isSelector && filterOptions && onFilter && (
            <Select value={filter || filterOptions[0]?.value} onValueChange={(v) => onFilter(v)}>
              <SelectTrigger
                className="h-8 w-auto min-w-[9rem] shrink-0 text-sm"
                aria-label="Filter chart data"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" sideOffset={4}>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </CardHeader>
  )
}

export function ChartCard({
  title,
  description,
  children,
  className = "",
  variant = "normal",
  trendContent,
  filterOptions,
  defaultFilter,
  onFilterChange,
  miniMetrics,
  tabOptions,
  leoInsight,
}: {
  title: string
  description: string
  children: React.ReactNode | ((filter: string) => React.ReactNode)
  className?: string
  variant?: ChartCardVariant
  /** "tabs" / "metrics-tabs" variant: content shown in the "Trend" tab */
  trendContent?: React.ReactNode
  /** "selector" variant: options for the filter dropdown */
  filterOptions?: { value: string; label: string }[]
  defaultFilter?: string
  onFilterChange?: (value: string) => void
  /** "metrics-tabs" variant: compact KPI strip shown above the chart */
  miniMetrics?: MiniMetric[]
  /** "tabs" variant: override the default Chart/Trend tabs with custom options.
   *  The selected value is passed to the children function. */
  tabOptions?: { value: string; label: string }[]
  /**
   * Smart Leo summary: opens a popover + Ask Leo CTA.
   * With `anchor`, mount `ChartLeoPlotInsightOverlay` beside `ChartContainer` for on-plot guide + marker; otherwise a corner Insight control is shown.
   */
  leoInsight?: ChartLeoInsight | null
}) {
  const [filter, setFilter] = React.useState(
    () => defaultFilter || filterOptions?.[0]?.value || miniMetrics?.[0]?.label || tabOptions?.[0]?.value || ""
  )

  // Sync when defaultFilter or first miniMetric changes (React may reuse across ternary branches)
  React.useEffect(() => {
    const next = defaultFilter || filterOptions?.[0]?.value || miniMetrics?.[0]?.label
    if (next) setFilter(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFilter, miniMetrics?.[0]?.label])

  const handleFilter = (v: string) => { setFilter(v); onFilterChange?.(v) }

  const resolvedChildren =
    typeof children === "function" ? children(filter) : children

  /* ── Default Chart / Trend tabs (no custom tabOptions) ───────────────────── */
  const defaultTabsBlock = (
    <Tabs defaultValue="trend" className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pb-1">
        <TabsList variant="line">
          <TabsTrigger value="chart" className={chartCardTabTriggerClass}>
            <i className="fa-light fa-chart-mixed text-sm" aria-hidden="true" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="trend" className={chartCardTabTriggerClass}>
            <i className="fa-light fa-chart-line text-sm" aria-hidden="true" />
            Trend
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="chart" className="flex-1 flex flex-col min-h-0 m-0">
        <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </TabsContent>
      <TabsContent value="trend" className="flex-1 flex flex-col min-h-0 m-0">
        <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {trendContent ?? resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </TabsContent>
    </Tabs>
  )

  if (variant === "tabs") {
    /* Custom tab labels (e.g. period picker for key metrics) */
    if (tabOptions && tabOptions.length > 0) {
      const selectedTab = filter || tabOptions[0].value
      return (
        <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
          <ChartCardHeader title={title} description={description} variant="normal" />
          <Tabs defaultValue={tabOptions[0].value} value={selectedTab} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 pb-1">
              <TabsList variant="line">
                {tabOptions.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={chartCardTabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabOptions.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="flex-1 flex flex-col min-h-0 m-0">
                <CardContent className="flex-1 flex flex-col min-h-[200px] pb-4">
                  <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
                    {typeof children === "function" ? children(tab.value) : children}
                  </ChartLeoInsightOverlay>
                </CardContent>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )
    }

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />
        {defaultTabsBlock}
      </Card>
    )
  }

  if (variant === "metrics-tabs") {
    const metrics = miniMetrics && miniMetrics.length > 0 ? miniMetrics : null
    const selectedMetric = filter || metrics?.[0]?.label || ""

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {metrics ? (
          /* Metrics ARE the tabs — each metric cell is a clickable TabsTrigger */
          <Tabs value={selectedMetric} onValueChange={handleFilter} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 px-2">
              <TabsList
                variant="line"
                className="h-auto w-full gap-0 rounded-none p-0 justify-start !items-end border-b border-border"
              >
                {metrics.map((m) => {
                  const isUp   = m.trend === "up"
                  const isDown = m.trend === "down"
                  const tone = metricTrendTone(m.trend ?? "neutral", m.trendPolarity)
                  const upClass =
                    tone === "positive"
                      ? "text-emerald-600"
                      : tone === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  const downClass =
                    tone === "positive"
                      ? "text-emerald-600"
                      : tone === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  return (
                    <TabsTrigger
                      key={m.label}
                      value={m.label}
                      className="h-auto flex-col items-start gap-1 px-3 pt-2 pb-3 rounded-none min-w-0 flex-none -mb-px border-b-2 border-transparent data-active:border-b-foreground after:![opacity:0] opacity-60 data-active:opacity-100"
                    >
                      <span className="text-sm font-normal text-muted-foreground leading-none">{m.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tabular-nums leading-none text-foreground">{m.value}</span>
                        {isUp   && <i className={cn("fa-light fa-arrow-trend-up text-xs", upClass)}   aria-hidden="true" />}
                        {isDown && <i className={cn("fa-light fa-arrow-trend-down text-xs", downClass)} aria-hidden="true" />}
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
            {/* All metric tabs show the same chart — tab selection is a context indicator */}
            {metrics.map((m) => (
              <TabsContent key={m.label} value={m.label} className="flex-1 flex flex-col min-h-0 m-0">
                <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
                  <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
                    {resolvedChildren}
                  </ChartLeoInsightOverlay>
                </CardContent>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          defaultTabsBlock
        )}
      </Card>
    )
  }

  /* ── kpi-chart: prominent metric on top, chart below ─────────────────────── */
  if (variant === "kpi-chart") {
    const kpi    = miniMetrics?.[0]
    const isUp   = kpi?.trend === "up"
    const isDown = kpi?.trend === "down"
    const tone = metricTrendTone(kpi?.trend ?? "neutral", kpi?.trendPolarity)
    const trendClass =
      tone === "positive"
        ? "text-emerald-600"
        : tone === "negative"
          ? "text-destructive"
          : "text-muted-foreground"

    return (
      <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} variant="normal" />

        {kpi && (
          <div className="px-6 pb-2 shrink-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {kpi.value}
              </span>
              {isUp && (
                <span className={cn("flex items-center gap-1 text-sm font-medium", trendClass)}>
                  <i className="fa-light fa-arrow-trend-up" aria-hidden="true" />
                  <span className="sr-only">trending up</span>
                </span>
              )}
              {isDown && (
                <span className={cn("flex items-center gap-1 text-sm font-medium", trendClass)}>
                  <i className="fa-light fa-arrow-trend-down" aria-hidden="true" />
                  <span className="sr-only">trending down</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        )}

        <CardContent className="flex-1 flex flex-col min-h-0 pb-4 pt-0">
          <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
            {resolvedChildren}
          </ChartLeoInsightOverlay>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`flex flex-col h-full ${className}`} role="figure" aria-label={title}>
      <ChartCardHeader
        title={title}
        description={description}
        variant={variant}
        filterOptions={filterOptions}
        filter={filter}
        onFilter={handleFilter}
      />
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        <ChartLeoInsightOverlay leoInsight={leoInsight} chartTitle={title}>
          {resolvedChildren}
        </ChartLeoInsightOverlay>
      </CardContent>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   DATA & CHART COMPONENTS
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Area ─────────────────────────────────────────────────────────────────── */
const areaCfg: ChartConfig = {
  placements:   { label: "Placements",   color: BRAND   },
  applications: { label: "Applications", color: CHART_2 },
  reviews:      { label: "Reviews",      color: CHART_4 },
}
const areaData = [
  { month: "Aug", placements: 42, applications: 78,  reviews: 31 },
  { month: "Sep", placements: 58, applications: 91,  reviews: 44 },
  { month: "Oct", placements: 53, applications: 85,  reviews: 39 },
  { month: "Nov", placements: 67, applications: 102, reviews: 52 },
  { month: "Dec", placements: 49, applications: 76,  reviews: 37 },
  { month: "Jan", placements: 74, applications: 118, reviews: 60 },
  { month: "Feb", placements: 81, applications: 124, reviews: 68 },
  { month: "Mar", placements: 89, applications: 137, reviews: 72 },
]

function AreaChartContent() {
  return (
    <ChartFigure label="Placement Trends" summary="Multi-line area chart showing placements, applications and reviews from Aug to Mar" dataLength={areaData.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <AreaChart data={areaData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPlace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND}   stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_2} stopOpacity={0.3}  />
                    <stop offset="95%" stopColor={CHART_2} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_4} stopOpacity={0.3}  />
                    <stop offset="95%" stopColor={CHART_4} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="url(#gApps)"  strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="url(#gRev)"   strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={areaData} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={areaData.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

function AreaLineTrendContent() {
  return (
    <ChartFigure label="Placement Trends" summary="Line chart showing placement trends Aug to Mar" dataLength={areaData.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <LineChart data={areaData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Line type="monotone" dataKey="placements"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="applications" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
                <Line type="monotone" dataKey="reviews"      stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              </LineChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={areaData} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={areaData.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

/* Selector variant — filter data by period */
const areaDataByPeriod: Record<string, typeof areaData> = {
  "7d":  areaData.slice(-2),
  "30d": areaData.slice(-4),
  "90d": areaData.slice(-6),
  "1y":  areaData,
}

function AreaSelectorContent({ filter }: { filter: string }) {
  const data = areaDataByPeriod[filter] ?? areaData
  return (
    <ChartFigure label="Placement Trends" summary={`Area chart for ${filter} period`} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={areaCfg} className="h-full min-h-[180px] w-full flex-1">
              <AreaChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPlace2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND}   stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Area key="placements" type="monotone" dataKey="placements"   stroke={BRAND}   fill="url(#gPlace2)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="applications" type="monotone" dataKey="applications" stroke={CHART_2} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
                <Area key="reviews" type="monotone" dataKey="reviews"      stroke={CHART_4} fill="none"           strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--ring)", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={data} xDataKey="month" />
          </div>
          <ChartDataTable caption="Placement Trends" headers={["Month", "Placements", "Applications", "Reviews"]} rows={data.map(d => [d.month, d.placements, d.applications, d.reviews])} />
        </>
      )}
    </ChartFigure>
  )
}

/* ── Donut ─────────────────────────────────────────────────────────────────── */
const donutCfg: ChartConfig = {
  confirmed: { label: "Confirmed", color: SUCCESS     },
  pending:   { label: "Pending",   color: WARNING     },
  rejected:  { label: "Rejected",  color: DESTRUCTIVE },
  review:    { label: "In Review", color: CHART_1     },
}
const donutDataAll = [
  { name: "confirmed", value: 58, fill: SUCCESS     },
  { name: "pending",   value: 24, fill: WARNING     },
  { name: "rejected",  value: 9,  fill: DESTRUCTIVE },
  { name: "review",    value: 9,  fill: CHART_1     },
]

function DonutChartContent({ data = donutDataAll }: { data?: typeof donutDataAll }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ChartFigure label="Placement Status" summary="Donut chart showing confirmed, pending, rejected and in-review placement distribution" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_DONUT}>
      {(activeIndex) => (
        <>
          <ChartContainer config={donutCfg} className="flex-1 min-h-[140px] w-full">
            <PieChart>
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name"
                innerRadius="50%" outerRadius="78%" strokeWidth={2} stroke="var(--card)"
                {...activeIndexProps(activeIndex)} activeShape={{ strokeWidth: 3, stroke: "var(--ring)" }}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 shrink-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground">{donutCfg[d.name]?.label}</span>
                <span className="ms-auto font-medium tabular-nums">
                  {Math.round(d.value / total * 100)}%
                </span>
              </div>
            ))}
          </div>
          <ChartDataTable
            caption="Placement Status"
            headers={["Status", "Count"]}
            rows={data.map(d => {
              const raw = donutCfg[d.name]?.label ?? d.name
              const label =
                typeof raw === "string" || typeof raw === "number" ? String(raw) : String(d.name)
              return [label, d.value] as [string, number]
            })}
          />
        </>
      )}
    </ChartFigure>
  )
}

const donutBarTrendData = [
  { month: "Jan", confirmed: 52, pending: 20, rejected: 7 },
  { month: "Feb", confirmed: 60, pending: 18, rejected: 6 },
  { month: "Mar", confirmed: 68, pending: 24, rejected: 9 },
]

/* Donut trend — bar chart version */
function DonutBarTrendContent() {
  return (
    <ChartContainer config={donutCfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={donutBarTrendData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="confirmed" fill={SUCCESS}     stackId="a" />
        <Bar dataKey="pending"   fill={WARNING}     stackId="a" />
        <Bar dataKey="rejected"  fill={DESTRUCTIVE} stackId="a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/* Donut — selector by program */
const donutByProgram: Record<string, typeof donutDataAll> = {
  all:      donutDataAll,
  nursing:  [{ name: "confirmed", value: 72, fill: SUCCESS }, { name: "pending", value: 18, fill: WARNING }, { name: "rejected", value: 5, fill: DESTRUCTIVE }, { name: "review", value: 5, fill: CHART_1 }],
  pt:       [{ name: "confirmed", value: 55, fill: SUCCESS }, { name: "pending", value: 28, fill: WARNING }, { name: "rejected", value: 10, fill: DESTRUCTIVE }, { name: "review", value: 7, fill: CHART_1 }],
  ot:       [{ name: "confirmed", value: 48, fill: SUCCESS }, { name: "pending", value: 30, fill: WARNING }, { name: "rejected", value: 14, fill: DESTRUCTIVE }, { name: "review", value: 8, fill: CHART_1 }],
  pharmacy: [{ name: "confirmed", value: 40, fill: SUCCESS }, { name: "pending", value: 35, fill: WARNING }, { name: "rejected", value: 15, fill: DESTRUCTIVE }, { name: "review", value: 10, fill: CHART_1 }],
}

/* ── Grouped Bar ─────────────────────────────────────────────────────────── */
const barCfg: ChartConfig = {
  new:      { label: "New",      color: BRAND   },
  returned: { label: "Returned", color: CHART_2 },
}
const barData = [
  { program: "Nursing", new: 34, returned: 22 },
  { program: "PT",      new: 28, returned: 18 },
  { program: "OT",      new: 21, returned: 14 },
  { program: "SW",      new: 19, returned: 11 },
  { program: "Pharm",   new: 15, returned: 9  },
  { program: "Rad",     new: 12, returned: 7  },
]

function GroupedBarContent() {
  return (
    <ChartFigure label="Applications by Program" summary="Grouped bar chart showing new and returned applications across 6 programs" dataLength={barData.length} leoInsight={CHART_GALLERY_LEO_APPLICATIONS}>
      {(activeIndex) => (
        <>
          <ChartContainer config={barCfg} className="flex-1 min-h-[180px] w-full">
            <BarChart data={barData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="program" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
              <Bar dataKey="new"      fill={BRAND}   radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              <Bar dataKey="returned" fill={CHART_2} radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable caption="Applications by Program" headers={["Program", "New", "Returned"]} rows={barData.map(d => [d.program, d.new, d.returned])} />
        </>
      )}
    </ChartFigure>
  )
}

function GroupedBarLineTrend() {
  return (
    <ChartContainer config={barCfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={barData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="program" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="new"      stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="returned" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Stacked Bar ─────────────────────────────────────────────────────────── */
const stackCfg: ChartConfig = {
  approved: { label: "Approved", color: SUCCESS     },
  pending:  { label: "Pending",  color: WARNING     },
  rejected: { label: "Rejected", color: DESTRUCTIVE },
}
const stackData = [
  { month: "Oct", approved: 38, pending: 12, rejected: 4 },
  { month: "Nov", approved: 44, pending: 15, rejected: 6 },
  { month: "Dec", approved: 31, pending: 8,  rejected: 3 },
  { month: "Jan", approved: 52, pending: 18, rejected: 7 },
  { month: "Feb", approved: 60, pending: 14, rejected: 5 },
  { month: "Mar", approved: 68, pending: 20, rejected: 8 },
]

function StackedBarContent() {
  return (
    <ChartFigure label="Monthly Reviews" summary="Stacked bar chart showing approved, pending and rejected reviews Oct to Mar" dataLength={stackData.length}>
      {(activeIndex) => (
        <>
          <div className="relative w-full min-h-[180px] flex-1">
            <ChartContainer config={stackCfg} className="h-full min-h-[180px] w-full flex-1">
              <BarChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
                <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
                <Bar dataKey="approved" fill={SUCCESS}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar dataKey="pending"  fill={WARNING}     stackId="a" activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
                <Bar dataKey="rejected" fill={DESTRUCTIVE} stackId="a" radius={[4, 4, 0, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              </BarChart>
            </ChartContainer>
            <ChartLeoPlotInsightOverlay data={stackData} xDataKey="month" insetPct={{ left: 12, right: 4, top: 5, bottom: 18 }} />
          </div>
          <ChartDataTable caption="Monthly Reviews" headers={["Month", "Approved", "Pending", "Rejected"]} rows={stackData.map(d => [d.month, d.approved, d.pending, d.rejected])} />
        </>
      )}
    </ChartFigure>
  )
}

function StackedBarLineTrend() {
  return (
    <div className="relative w-full min-h-[180px] flex-1">
      <ChartContainer config={stackCfg} className="h-full min-h-[180px] w-full flex-1">
        <LineChart data={stackData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
          <Line type="monotone" dataKey="approved" stroke={SUCCESS}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="pending"  stroke={WARNING}     strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="rejected" stroke={DESTRUCTIVE} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay data={stackData} xDataKey="month" insetPct={{ left: 12, right: 4, top: 5, bottom: 18 }} />
    </div>
  )
}

/* ── Line ─────────────────────────────────────────────────────────────────── */
const lineCfg: ChartConfig = {
  logins:      { label: "Logins",      color: BRAND   },
  submissions: { label: "Submissions", color: CHART_2 },
  evaluations: { label: "Evaluations", color: CHART_4 },
}
const lineData = [
  { week: "W1", logins: 148, submissions: 42, evaluations: 29 },
  { week: "W2", logins: 162, submissions: 51, evaluations: 35 },
  { week: "W3", logins: 139, submissions: 38, evaluations: 27 },
  { week: "W4", logins: 175, submissions: 63, evaluations: 48 },
  { week: "W5", logins: 182, submissions: 69, evaluations: 52 },
  { week: "W6", logins: 196, submissions: 75, evaluations: 58 },
  { week: "W7", logins: 211, submissions: 82, evaluations: 63 },
  { week: "W8", logins: 204, submissions: 78, evaluations: 60 },
]

const lineDataByPeriod: Record<string, typeof lineData> = {
  "7d":  lineData.slice(-2),
  "30d": lineData.slice(-4),
  "90d": lineData.slice(-6),
  "1y":  lineData,
}

function LineChartContent({ data = lineData }: { data?: typeof lineData }) {
  return (
    <ChartFigure label="Portal Activity" summary="Line chart showing logins, submissions and evaluations by week" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_LINE}>
      {(activeIndex) => (
        <>
          <ChartContainer config={lineCfg} className="flex-1 min-h-[180px] w-full">
            <LineChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
              <Line type="monotone" dataKey="logins"      stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="submissions" stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
              <Line type="monotone" dataKey="evaluations" stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={props.stroke} />} />
            </LineChart>
          </ChartContainer>
          <ChartDataTable caption="Portal Activity" headers={["Week", "Logins", "Submissions", "Evaluations"]} rows={data.map(d => [d.week, d.logins, d.submissions, d.evaluations])} />
        </>
      )}
    </ChartFigure>
  )
}

function LineAreaTrend() {
  return (
    <ChartContainer config={lineCfg} className="flex-1 min-h-[180px] w-full">
      <AreaChart data={lineData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gLogin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={BRAND}   stopOpacity={0.3} />
            <stop offset="95%" stopColor={BRAND}   stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Area key="logins" type="monotone" dataKey="logins"      stroke={BRAND}   fill="url(#gLogin)" strokeWidth={2} dot={false} />
        <Area key="submissions" type="monotone" dataKey="submissions" stroke={CHART_2} fill="none"          strokeWidth={2} dot={false} />
        <Area key="evaluations" type="monotone" dataKey="evaluations" stroke={CHART_4} fill="none"          strokeWidth={2} dot={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/* ── Radial Bar ──────────────────────────────────────────────────────────── */
const radialCfg: ChartConfig = {
  nursing:  { label: "Nursing",     color: BRAND   },
  pt:       { label: "PT",          color: CHART_2 },
  ot:       { label: "OT",          color: SUCCESS },
  pharmacy: { label: "Pharmacy",    color: WARNING },
  social:   { label: "Social Work", color: CHART_4 },
}
const radialData = [
  { name: "nursing",  score: 98, fill: BRAND   },
  { name: "pt",       score: 94, fill: CHART_2 },
  { name: "ot",       score: 91, fill: SUCCESS },
  { name: "pharmacy", score: 87, fill: WARNING },
  { name: "social",   score: 82, fill: CHART_4 },
]

function RadialBarContent({ data = radialData }: { data?: typeof radialData }) {
  return (
    <ChartFigure label="Compliance Score" summary="Radial bar chart showing compliance scores by program" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_COMPLIANCE}>
      {(activeIndex) => (
        <>
          <ChartContainer config={radialCfg} className="flex-1 min-h-[140px] w-full">
            <RadialBarChart data={data} innerRadius="20%" outerRadius="85%"
              startAngle={90} endAngle={-270} barSize={10}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <RadialBar dataKey="score" cornerRadius={5} background={{ fill: "var(--muted)" }} {...activeIndexProps(activeIndex)}>
                {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </RadialBar>
            </RadialBarChart>
          </ChartContainer>
          <div className="grid grid-cols-1 gap-1 text-xs mt-2 shrink-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-muted-foreground flex-1">{radialCfg[d.name]?.label}</span>
                <span className="font-semibold tabular-nums">{d.score}%</span>
              </div>
            ))}
          </div>
          <ChartDataTable
            caption="Compliance Score"
            headers={["Program", "Score"]}
            rows={data.map(d => {
              const raw = radialCfg[d.name]?.label ?? d.name
              const label =
                typeof raw === "string" || typeof raw === "number" ? String(raw) : String(d.name)
              return [label, `${d.score}%`] as [string, string]
            })}
          />
        </>
      )}
    </ChartFigure>
  )
}

const radialLineTrendCfg: ChartConfig = {
  score: { label: "Current", color: BRAND   },
  prev:  { label: "Previous", color: CHART_2 },
}

function RadialLineTrend() {
  const data = radialData.map((d, i) => ({
    name: d.name,
    score: d.score,
    prev: d.score - [4, 7, 2, 9, 5][i],
  }))
  return (
    <ChartContainer config={radialLineTrendCfg} className="flex-1 min-h-[180px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="prev"  fill={CHART_2} radius={[4, 4, 0, 0]} opacity={0.5} />
        <Bar dataKey="score" fill={BRAND}   radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/** Quota radial — ChartFigure, keyboard tooltip sync, sr-only table (same pattern as RadialBarContent). */
function QuotaRadialGalleryContent({ radial }: { radial: StudentScoreRadial }) {
  const summary =
    `Radial gauge for ${radial.title}. Student score ${formatBandScore(radial.studentScore)}. Class average ${formatBandScore(radial.classAverage)}. Scale ${formatBandScore(radial.scaleMin)} to ${formatBandScore(radial.scaleMax)}. ${radial.caption}.`

  return (
    <ChartFigure label={radial.title} summary={summary} dataLength={1} leoInsight={CHART_GALLERY_LEO_QUOTA}>
      {(activeIndex) => (
        <>
          <div className="flex flex-col items-center gap-2">
            <QuotaRadialChartInner radial={radial} activeIndex={activeIndex} />
            <p className="text-xs text-muted-foreground tabular-nums">
              Class avg{" "}
              <span className="font-medium text-foreground">{formatBandScore(radial.classAverage)}</span>
              <span className="text-muted-foreground">
                {" "}
                · scale {formatBandScore(radial.scaleMin)}–{formatBandScore(radial.scaleMax)}
              </span>
            </p>
          </div>
          <ChartDataTable
            caption={radial.title}
            headers={["Measure", "Value"]}
            rows={[
              ["Student score", formatBandScore(radial.studentScore)],
              ["Class average", formatBandScore(radial.classAverage)],
              ["Scale", `${formatBandScore(radial.scaleMin)}–${formatBandScore(radial.scaleMax)}`],
            ]}
          />
        </>
      )}
    </ChartFigure>
  )
}

/* ── Horizontal Bar ─────────────────────────────────────────────────────── */
const hBarCfg: ChartConfig = {
  placements: { label: "Placements", color: BRAND },
}
const hBarData = [
  { site: "City Med",      placements: 42 },
  { site: "Westside Hosp", placements: 37 },
  { site: "North Clinic",  placements: 31 },
  { site: "Bay Health",    placements: 28 },
  { site: "Eastview",      placements: 22 },
  { site: "Lakeshore",     placements: 18 },
  { site: "Pinehill",      placements: 14 },
]

const hBarByPeriod: Record<string, typeof hBarData> = {
  "7d":  hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 0.35) })),
  "30d": hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 0.6)  })),
  "90d": hBarData,
  "1y":  hBarData.map((d) => ({ ...d, placements: Math.round(d.placements * 4.2)  })),
}

function HorizontalBarContent({ data = hBarData }: { data?: typeof hBarData }) {
  return (
    <ChartFigure label="Placements by Site" summary="Horizontal bar chart showing placement count by clinical site" dataLength={data.length} leoInsight={CHART_GALLERY_LEO_HORIZONTAL}>
      {(activeIndex) => (
        <>
          <ChartContainer config={hBarCfg} className="flex-1 min-h-[200px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="site" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={82} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar dataKey="placements" fill={BRAND} radius={[0, 4, 4, 0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable caption="Placements by Site" headers={["Site", "Placements"]} rows={data.map(d => [d.site, d.placements])} />
        </>
      )}
    </ChartFigure>
  )
}

function HBarLineTrend() {
  return (
    <ChartContainer config={hBarCfg} className="flex-1 min-h-[200px] w-full">
      <LineChart data={hBarData} margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="site" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="placements" stroke={BRAND} strokeWidth={2} dot={{ r: 4, fill: BRAND }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Composed ─────────────────────────────────────────────────────────────── */
const composedCfg: ChartConfig = {
  placements: { label: "Placements",  color: BRAND   },
  capacity:   { label: "Capacity",    color: CHART_3 },
  rate:       { label: "Fill Rate %", color: CHART_4 },
}
const composedData = [
  { month: "Sep", placements: 44, capacity: 60, rate: 73 },
  { month: "Oct", placements: 53, capacity: 65, rate: 82 },
  { month: "Nov", placements: 67, capacity: 80, rate: 84 },
  { month: "Dec", placements: 49, capacity: 70, rate: 70 },
  { month: "Jan", placements: 74, capacity: 85, rate: 87 },
  { month: "Feb", placements: 81, capacity: 90, rate: 90 },
  { month: "Mar", placements: 89, capacity: 95, rate: 94 },
]

function ComposedChartContent() {
  return (
    <ChartFigure label="Site Capacity vs Fill Rate" summary="Composed chart showing placement volume against site capacity and fill rate percentage" dataLength={composedData.length} leoInsight={CHART_GALLERY_LEO_COMPOSED}>
      {(activeIndex) => (
        <>
          <ChartContainer config={composedCfg} className="flex-1 min-h-[180px] w-full">
            <ComposedChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left"  tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false}
                tick={{ fontSize: 12 }} width={32} unit="%" domain={[0, 100]} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
              <Bar  yAxisId="left"  dataKey="capacity"   fill={CHART_3} radius={[4,4,0,0]} opacity={0.45} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              <Bar  yAxisId="left"  dataKey="placements" fill={BRAND}   radius={[4,4,0,0]} activeBar={{ stroke: "var(--ring)", strokeWidth: 2, fillOpacity: 1 }} {...activeIndexProps(activeIndex)} />
              <Line yAxisId="right" dataKey="rate"       stroke={CHART_4} strokeWidth={2}
                dot={(props: LineDotRenderProps) => props.index === activeIndex ? <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={props.stroke} stroke="var(--ring)" strokeWidth={2} /> : <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={CHART_4} />} type="monotone" />
            </ComposedChart>
          </ChartContainer>
          <ChartDataTable caption="Site Capacity vs Fill Rate" headers={["Month", "Placements", "Capacity", "Fill Rate %"]} rows={composedData.map(d => [d.month, d.placements, d.capacity, `${d.rate}%`])} />
        </>
      )}
    </ChartFigure>
  )
}

function ComposedLineTrend() {
  return (
    <ChartContainer config={composedCfg} className="flex-1 min-h-[180px] w-full">
      <LineChart data={composedData} margin={{ left: -8, right: 28, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="placements" stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="capacity"   stroke={CHART_3} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="rate"       stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Radar ───────────────────────────────────────────────────────────────── */
const radarCfg: ChartConfig = {
  nursing:  { label: "Nursing", color: BRAND   },
  physical: { label: "PT/OT",   color: CHART_2 },
}
const radarData = [
  { skill: "Clinical",  nursing: 92, physical: 88 },
  { skill: "Comm.",     nursing: 85, physical: 79 },
  { skill: "Critical",  nursing: 78, physical: 84 },
  { skill: "Teamwork",  nursing: 91, physical: 90 },
  { skill: "Ethics",    nursing: 96, physical: 93 },
  { skill: "Technical", nursing: 80, physical: 87 },
]

function RadarChartContent() {
  return (
    <ChartFigure label="Competency Radar" summary="Radar chart comparing nursing vs PT/OT competency scores across 6 skill dimensions" dataLength={radarData.length} leoInsight={CHART_GALLERY_LEO_RADAR}>
      {(activeIndex) => (
        <>
          <ChartContainer config={radarCfg} className="flex-1 min-h-[200px] w-full">
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 10 }} tickCount={3} stroke="var(--border)" />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
              <Radar name="nursing"  dataKey="nursing"  stroke={BRAND}   fill={BRAND}   fillOpacity={0.25} strokeWidth={2} activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }} />
              <Radar name="physical" dataKey="physical" stroke={CHART_2} fill={CHART_2} fillOpacity={0.2}  strokeWidth={2} activeDot={{ r: 6, stroke: "var(--ring)", strokeWidth: 2 }} />
            </RadarChart>
          </ChartContainer>
          <ChartDataTable caption="Competency Scores" headers={["Skill", "Nursing", "PT/OT"]} rows={radarData.map(d => [d.skill, d.nursing, d.physical])} />
        </>
      )}
    </ChartFigure>
  )
}

function RadarBarTrend() {
  return (
    <ChartContainer config={radarCfg} className="flex-1 min-h-[200px] w-full">
      <BarChart data={radarData} barGap={4} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="skill" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Bar dataKey="nursing"  fill={BRAND}   radius={[4, 4, 0, 0]} />
        <Bar dataKey="physical" fill={CHART_2} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/* ── Scatter ─────────────────────────────────────────────────────────────── */
const scatterCfg: ChartConfig = {
  nursing:  { label: "Nursing",  color: BRAND   },
  pt:       { label: "PT",       color: CHART_2 },
  ot:       { label: "OT",       color: SUCCESS },
  pharmacy: { label: "Pharmacy", color: WARNING },
}
const scatterNursing  = [{ x: 80, y: 94, z: 42 }, { x: 65, y: 88, z: 35 }, { x: 55, y: 78, z: 28 }, { x: 90, y: 97, z: 51 }, { x: 70, y: 91, z: 38 }]
const scatterPT       = [{ x: 40, y: 85, z: 22 }, { x: 50, y: 90, z: 27 }, { x: 35, y: 80, z: 18 }, { x: 60, y: 93, z: 31 }]
const scatterOT       = [{ x: 30, y: 88, z: 16 }, { x: 45, y: 92, z: 24 }, { x: 38, y: 84, z: 19 }]
const scatterPharmacy = [{ x: 25, y: 76, z: 12 }, { x: 35, y: 82, z: 17 }, { x: 20, y: 71, z: 9  }]

function ScatterChartContent() {
  return (
    <ChartContainer config={scatterCfg} className="flex-1 min-h-[200px] w-full">
      <ScatterChart margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="x" name="Capacity" tickLine={false} axisLine={false} tick={{ fontSize: 12 }}
          label={{ value: "Capacity", position: "insideBottom", offset: -2, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name="Fill Rate" tickLine={false} axisLine={false}
          tick={{ fontSize: 12 }} unit="%" domain={[60, 100]} width={38} />
        <ZAxis type="number" dataKey="z" range={[40, 280]} name="Students" />
        <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Scatter name="nursing"  data={scatterNursing}  fill={BRAND}   fillOpacity={0.75} />
        <Scatter name="pt"       data={scatterPT}       fill={CHART_2} fillOpacity={0.75} />
        <Scatter name="ot"       data={scatterOT}       fill={SUCCESS} fillOpacity={0.75} />
        <Scatter name="pharmacy" data={scatterPharmacy} fill={WARNING} fillOpacity={0.75} />
      </ScatterChart>
    </ChartContainer>
  )
}

const scatterLineTrendCfg: ChartConfig = {
  nursing:  { label: "Nursing",  color: BRAND   },
  pt:       { label: "PT",       color: CHART_2 },
}
const scatterLineTrendData = [
  { month: "Oct", nursing: 88, pt: 80 },
  { month: "Nov", nursing: 91, pt: 82 },
  { month: "Dec", nursing: 89, pt: 79 },
  { month: "Jan", nursing: 93, pt: 84 },
  { month: "Feb", nursing: 95, pt: 87 },
  { month: "Mar", nursing: 94, pt: 85 },
]

function ScatterLineTrend() {
  return (
    <ChartContainer config={scatterLineTrendCfg} className="flex-1 min-h-[200px] w-full">
      <LineChart data={scatterLineTrendData} margin={{ left: -8, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} unit="%" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="nursing" stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pt"      stroke={CHART_2} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ── Funnel ──────────────────────────────────────────────────────────────── */
const funnelCfg: ChartConfig = {
  applied:   { label: "Applied",   color: BRAND   },
  screened:  { label: "Screened",  color: CHART_2 },
  matched:   { label: "Matched",   color: SUCCESS },
  placed:    { label: "Placed",    color: CHART_4 },
  completed: { label: "Completed", color: CHART_5 },
}
const funnelData = [
  { name: "Applied",   value: 320, fill: BRAND   },
  { name: "Screened",  value: 240, fill: CHART_2 },
  { name: "Matched",   value: 175, fill: SUCCESS },
  { name: "Placed",    value: 128, fill: CHART_4 },
  { name: "Completed", value: 98,  fill: CHART_5 },
]
const funnelDataByPeriod: Record<string, typeof funnelData> = {
  "7d":  funnelData.map((d) => ({ ...d, value: Math.round(d.value * 0.08) })),
  "30d": funnelData.map((d) => ({ ...d, value: Math.round(d.value * 0.3)  })),
  "90d": funnelData,
  "1y":  funnelData.map((d) => ({ ...d, value: d.value * 4               })),
}

function FunnelChartContent({ data = funnelData }: { data?: typeof funnelData }) {
  const summary = `Funnel with ${data.length} stages from ${data[0]?.name ?? ""} to ${data[data.length - 1]?.name ?? ""}.`
  return (
    <ChartFigure label="Application Pipeline" summary={summary} dataLength={data.length} leoInsight={CHART_GALLERY_LEO_FUNNEL}>
      {(activeIndex) => (
        <>
          <ChartContainer config={funnelCfg} className="flex-1 min-h-[220px] w-full">
            <FunnelChart margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent hideLabel />} />
              <Funnel dataKey="value" data={data} isAnimationActive>
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={d.fill}
                    stroke={activeIndex === i ? "var(--ring)" : undefined}
                    strokeWidth={activeIndex === i ? 2 : 0}
                  />
                ))}
                <LabelList dataKey="name"  position="right"  style={{ fontSize: 12, fill: "var(--foreground)" }} />
                <LabelList dataKey="value" position="center" style={{ fontSize: 12, fontWeight: 600, fill: "var(--foreground)" }} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
          <ChartDataTable caption="Application Pipeline data" headers={["Stage", "Count"]} rows={data.map(d => [d.name, d.value])} />
        </>
      )}
    </ChartFigure>
  )
}

const funnelLineTrendCfg: ChartConfig = {
  applied:   { label: "Applied",   color: BRAND   },
  placed:    { label: "Placed",    color: CHART_4 },
  completed: { label: "Completed", color: CHART_5 },
}
const funnelLineTrendData = [
  { month: "Oct", applied: 210, placed: 95,  completed: 68  },
  { month: "Nov", applied: 245, placed: 108, completed: 82  },
  { month: "Dec", applied: 180, placed: 88,  completed: 64  },
  { month: "Jan", applied: 280, placed: 120, completed: 91  },
  { month: "Feb", applied: 300, placed: 124, completed: 95  },
  { month: "Mar", applied: 320, placed: 128, completed: 98  },
]

function FunnelLineTrend() {
  return (
    <ChartContainer config={funnelLineTrendCfg} className="flex-1 min-h-[220px] w-full">
      <LineChart data={funnelLineTrendData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={({ payload, verticalAlign }) => <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />} />
        <Line type="monotone" dataKey="applied"   stroke={BRAND}   strokeWidth={2} strokeDasharray={chartLineStrokeDash(0)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="placed"    stroke={CHART_4} strokeWidth={2} strokeDasharray={chartLineStrokeDash(1)} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completed" stroke={CHART_5} strokeWidth={2} strokeDasharray={chartLineStrokeDash(2)} dot={{ r: 3 }} />
      </LineChart>
    </ChartContainer>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Chart rows — shared across variants
   ════════════════════════════════════════════════════════════════════════════ */

const CHART_GALLERY_LEO_DONUT: ChartLeoInsight = {
  headline: "Confirmed placements dominate the current pipeline",
  explanation:
    "87% of placements are already confirmed, with only 9% pending and 4% in review. This is a healthy distribution suggesting strong conversion from applications to confirmed offers.",
  kind: "spike",
  delta: { value: "+12%", label: "vs. last month" },
  bullets: [
    "Confirmed count has grown steadily across nursing, PT, and OT programs.",
    "Rejection rate remains low at 1% — applications are well-qualified.",
  ],
}

const CHART_GALLERY_LEO_APPLICATIONS: ChartLeoInsight = {
  headline: "Nursing program leads application volume",
  explanation:
    "Nursing consistently attracts the most new applicants, with 34 this period. PT and OT follow closely. Returned applications suggest strong re-engagement.",
  kind: "trend",
  delta: { value: "+8%", label: "new vs. prior period" },
  bullets: [
    "Nursing: 34 new, 22 returned — highest volume and strong re-engagement.",
    "PT and OT: steady demand — balanced load across clinical programs.",
  ],
}

const CHART_GALLERY_LEO_LINE: ChartLeoInsight = {
  headline: "Portal activity peaks mid-week",
  explanation:
    "Login, submission, and evaluation activity cluster around Tuesday–Thursday, with weekends showing predictable dips. This pattern is consistent and expected for an academic schedule.",
  kind: "trend",
  delta: { value: "—", label: "stable pattern" },
  bullets: [
    "Logins peak at ~450 on Wednesdays.",
    "Submissions highest Monday–Friday, near-zero on weekends.",
  ],
}

const CHART_GALLERY_LEO_COMPLIANCE: ChartLeoInsight = {
  headline: "PT/OT programs lead compliance scoring",
  explanation:
    "PT and OT average 88–89% compliance, outpacing Nursing (82%) and Pharmacy (76%). Radiology lags at 71% — may need targeted support.",
  kind: "dip",
  delta: { value: "-8%", label: "Radiology vs. PT/OT" },
  bullets: [
    "PT/OT: consistent excellence across all 6 dimensions.",
    "Pharmacy: scoring gaps in documentation and timeliness.",
    "Radiology: needs support in scheduling and follow-up processes.",
  ],
}

const CHART_GALLERY_LEO_HORIZONTAL: ChartLeoInsight = {
  headline: "Large clinical sites carry most placements",
  explanation:
    "The three largest sites (University Hospital, Metro Clinic, Regional Center) account for 58% of all placements. Mid-size sites are under-utilized.",
  kind: "anomaly",
  delta: { value: "+22%", label: "top 3 sites total" },
  bullets: [
    "University Hospital: 156 placements (28% of total).",
    "Capacity constraints may limit placement growth at smaller sites.",
  ],
}

const CHART_GALLERY_LEO_COMPOSED: ChartLeoInsight = {
  headline: "Site capacity is healthy; fill rates peak Q2",
  explanation:
    "Most sites run 85–92% capacity utilization. Fill rate (placements / capacity) averages 78%, with spring months (Feb–Mar) consistently hitting 82%+.",
  kind: "spike",
  delta: { value: "+6%", label: "fill rate increase" },
  bullets: [
    "March shows the strongest fill rate at 84%.",
    "Only 2 sites are below 70% utilization — opportunity to rebalance.",
  ],
}

const CHART_GALLERY_LEO_RADAR: ChartLeoInsight = {
  headline: "Nursing and PT/OT competencies are well-balanced",
  explanation:
    "Both programs score 80+ on all six dimensions. Nursing edges slightly on patient care; PT/OT lead in mobility and assessment. Ready for expanded placements.",
  kind: "trend",
  delta: { value: "—", label: "strong across programs" },
  bullets: [
    "6-dimension average: Nursing 84%, PT/OT 86%.",
    "Lowest dimension: patient care (Nursing 79%) — room to develop.",
  ],
}

const CHART_GALLERY_LEO_SCATTER: ChartLeoInsight = {
  headline: "Application-to-placement funnel is healthy",
  explanation:
    "Applications feed steadily into offers; offer-to-confirmation conversion hovers around 72%. A small number of dropouts from offer-to-start, typical for clinical placements.",
  kind: "trend",
  delta: { value: "+4%", label: "confirmation rate" },
  bullets: [
    "Applications → Offers: 63% convert (typical for competitive placements).",
    "Offers → Confirmed: 72% accept (strong acceptance rate).",
  ],
}

const CHART_GALLERY_LEO_FUNNEL: ChartLeoInsight = {
  headline: "Funnel shape is expected; strong at top of pipe",
  explanation:
    "4,200 applications narrow to 842 offers (20% funnel rate) and 604 confirmed placements (72% offer acceptance). Losses are proportional—no anomalous drops.",
  kind: "trend",
  delta: { value: "+8%", label: "application volume" },
  bullets: [
    "Application → Offer: drop-off is typical for screening.",
    "Offer → Confirmed: acceptance rate of 72% is healthy.",
  ],
}

const CHART_GALLERY_LEO_QUOTA: ChartLeoInsight = {
  headline: "Student performance tracking and cohort comparison",
  explanation:
    "Track individual student progress against class averages and scale benchmarks. Identify outliers above or below cohort norms.",
  kind: "anomaly",
  bullets: [
    "Performance visualized on a consistent scale across cohorts.",
    "Class average provides immediate context for comparison.",
  ],
}

const CHART_GALLERY_LEO_TRENDS: ChartLeoInsight = {
  headline: "December dips across placements, applications, and reviews",
  explanation:
    "All three series pull back in December—often seasonal (holidays, academic breaks) or a real pipeline stall. Worth confirming whether approvals or site capacity paused.",
  kind: "dip",
  delta: { value: "-24%", label: "vs. November" },
  bullets: [
    "Placements are 18% below the 6-month trailing average.",
    "Reviews dropped sharply in the last 2 weeks of the month.",
    "Same pattern appeared in Dec '24 — seasonal signal is plausible.",
  ],
  anchor: {
    xValue: "Dec",
    yDataKeys: ["placements", "applications", "reviews"],
    yCombine: "max",
  },
}

const CHART_GALLERY_LEO_REVIEWS: ChartLeoInsight = {
  headline: "December is the low point in review throughput",
  explanation:
    "Totals drop before recovering — worth confirming whether fewer submissions arrived or reviewers were out. Pending and rejected slices still matter once volume returns.",
  kind: "dip",
  delta: { value: "-31%", label: "vs. November total" },
  bullets: [
    "Approved reviews fell from 68 to 47 month-over-month.",
    "Pending queue grew by 9 items — backlog forming.",
    "Two reviewers were OOO for most of the last two weeks.",
  ],
  anchor: {
    xValue: "Dec",
    yDataKeys: ["approved", "pending", "rejected"],
    yCombine: "sum",
  },
}

function ChartRows({ v }: { v: ChartCardVariant }) {
  const isTabs = v === "tabs"
  const isSel  = v === "selector"
  const isMT   = v === "metrics-tabs"
  const isKpi  = v === "kpi-chart"

  return (
    <>
      {/* Row 1 · Area (2/3) + Donut (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard
              key="area-sel"
              variant="selector"
              title="Placement Trends"
              description="Filter by time period"
              filterOptions={PERIOD_OPTIONS}
              defaultFilter="90d"
              leoInsight={CHART_GALLERY_LEO_TRENDS}
            >
              {(f) => <AreaSelectorContent filter={f} />}
            </ChartCard>
          ) : (
            <ChartCard
              key="area"
              variant={v}
              title="Placement Trends"
              description="Aug 2025 — Mar 2026"
              leoInsight={CHART_GALLERY_LEO_TRENDS}
              trendContent={<AreaLineTrendContent />}
              tabOptions={isTabs ? [
                { value: "overview", label: "Overview" },
                { value: "by-program", label: "By Program" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Placements", value: "89",  trend: "up"   },
                { label: "Fill rate",  value: "94%", trend: "up"   },
                { label: "Avg. weeks", value: "6.2", trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <AreaLineTrendContent /> : <AreaChartContent />
                : <AreaChartContent />}
            </ChartCard>
          )}
        </div>
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="donut-sel" variant="selector" title="Placement Status" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_DONUT}>
              {(f) => <DonutChartContent data={donutByProgram[f] ?? donutDataAll} />}
            </ChartCard>
          ) : (
            <ChartCard key="donut" variant={v} title="Placement Status" description="Current cycle distribution"
              leoInsight={CHART_GALLERY_LEO_DONUT}
              trendContent={<DonutBarTrendContent />}
              tabOptions={isTabs ? [
                { value: "current", label: "Current Cycle" },
                { value: "previous", label: "Previous Cycle" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Placed",   value: "128", trend: "up"   },
                { label: "Pending",  value: "23",  trend: "down" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => <DonutChartContent data={tab === "previous" ? donutByProgram["pt"] : undefined} />
                : <DonutChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 1b · Quota suite — one ChartCard per metric + radial (ChartFigure on radial only) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {DASHBOARD_STUDENT_SCORES.metrics.map((m) => (
          <ChartCard
            key={`quota-${m.id}`}
            variant={v}
            title={m.label}
            description={m.description ?? DASHBOARD_STUDENT_SCORES.description ?? ""}
            className="overflow-visible"
          >
            <QuotaLinearProgressCardBody
              metric={m}
              suiteContext={DASHBOARD_STUDENT_SCORES.description ?? "Reference data."}
            />
          </ChartCard>
        ))}
        <ChartCard
          key="quota-radial"
          variant={v}
          title={DASHBOARD_STUDENT_SCORES.radial.title}
          description={DASHBOARD_STUDENT_SCORES.description ?? ""}
          className="overflow-visible"
        >
          <QuotaRadialGalleryContent radial={DASHBOARD_STUDENT_SCORES.radial} />
        </ChartCard>
      </div>

      {/* Row 2 · Grouped Bar + Stacked Bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
        {isSel ? (
          <ChartCard key="gbar-sel" variant="selector" title="Applications by Program" description="Filter by time period"
            filterOptions={PERIOD_OPTIONS} defaultFilter="30d" leoInsight={CHART_GALLERY_LEO_APPLICATIONS}>
            {() => <GroupedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard key="gbar" variant={v} title="Applications by Program" description="New vs. returning students"
            leoInsight={CHART_GALLERY_LEO_APPLICATIONS}
            trendContent={<GroupedBarLineTrend />}
            tabOptions={isTabs ? [
              { value: "all", label: "All Students" },
              { value: "new", label: "New" },
              { value: "trend", label: "Trend" },
            ] : undefined}
            miniMetrics={(isMT || isKpi) ? [
              { label: "Total",     value: "320", trend: "up"   },
              { label: "New",       value: "78%", trend: "up"   },
              { label: "Returning", value: "22%", trend: "neutral" },
            ] : undefined}>
            {isTabs
              ? (tab: string) => tab === "trend" ? <GroupedBarLineTrend /> : <GroupedBarContent />
              : <GroupedBarContent />}
          </ChartCard>
        )}
        {isSel ? (
          <ChartCard
            key="sbar-sel"
            variant="selector"
            title="Monthly Reviews"
            description="Filter by time period"
            filterOptions={PERIOD_OPTIONS}
            defaultFilter="30d"
            leoInsight={CHART_GALLERY_LEO_REVIEWS}
          >
            {() => <StackedBarContent />}
          </ChartCard>
        ) : (
          <ChartCard
            key="sbar"
            variant={v}
            title="Monthly Reviews"
            description="Review outcomes by status"
            leoInsight={CHART_GALLERY_LEO_REVIEWS}
            trendContent={<StackedBarLineTrend />}
            tabOptions={isTabs ? [
              { value: "status", label: "By Status" },
              { value: "reviewer", label: "By Reviewer" },
              { value: "trend", label: "Trend" },
            ] : undefined}
            miniMetrics={(isMT || isKpi) ? [
              { label: "Approved", value: "68",  trend: "up"   },
              { label: "Pending",  value: "14",  trend: "down" },
              { label: "Rejected", value: "6",   trend: "neutral" },
            ] : undefined}>
            {isTabs
              ? (tab: string) => tab === "trend" ? <StackedBarLineTrend /> : <StackedBarContent />
              : <StackedBarContent />}
          </ChartCard>
        )}
      </div>

      {/* Row 3 · Line (2/3) + Radial (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="line-sel" variant="selector" title="Weekly Activity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_LINE}>
              {(f) => <LineChartContent data={lineDataByPeriod[f] ?? lineData} />}
            </ChartCard>
          ) : (
            <ChartCard key="line" variant={v} title="Weekly Activity" description="Logins, submissions & evaluations"
              leoInsight={CHART_GALLERY_LEO_LINE}
              trendContent={<LineAreaTrend />}
              tabOptions={isTabs ? [
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Logins",      value: "1.2k", trend: "up"   },
                { label: "Submissions", value: "340",  trend: "up"   },
                { label: "Evals",       value: "88",   trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <LineAreaTrend /> : <LineChartContent />
                : <LineChartContent />}
            </ChartCard>
          )}
        </div>
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="radial-sel" variant="selector" title="Compliance Scores" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_COMPLIANCE}>
              {() => <RadialBarContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radial" variant={v} title="Compliance Scores" description="By program — current cycle"
              leoInsight={CHART_GALLERY_LEO_COMPLIANCE}
              trendContent={<RadialLineTrend />}
              tabOptions={isTabs ? [
                { value: "current", label: "Current" },
                { value: "historical", label: "Historical" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Avg. score", value: "91%", trend: "up"   },
                { label: "At risk",    value: "3",   trend: "down" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "historical" ? <RadialLineTrend /> : <RadialBarContent />
                : <RadialBarContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 4 · H-Bar (1/3) + Composed (2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="hbar-sel" variant="selector" title="Top Placement Sites" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_HORIZONTAL}>
              {(f) => <HorizontalBarContent data={hBarByPeriod[f] ?? hBarData} />}
            </ChartCard>
          ) : (
            <ChartCard key="hbar" variant={v} title="Top Placement Sites" description="Active placements by facility"
              leoInsight={CHART_GALLERY_LEO_HORIZONTAL}
              trendContent={<HBarLineTrend />}
              tabOptions={isTabs ? [
                { value: "by-facility", label: "By Facility" },
                { value: "by-capacity", label: "By Capacity" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Sites",     value: "7",   trend: "up"   },
                { label: "Capacity",  value: "94%", trend: "up"   },
              ] : undefined}>
              {isTabs
                ? () => <HorizontalBarContent />
                : <HorizontalBarContent />}
            </ChartCard>
          )}
        </div>
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="composed-sel" variant="selector" title="Placements vs Capacity" description="Filter by time period"
              filterOptions={PERIOD_OPTIONS} defaultFilter="1y" leoInsight={CHART_GALLERY_LEO_COMPOSED}>
              {() => <ComposedChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="composed" variant={v} title="Placements vs Capacity" description="Monthly fill rate overlay"
              leoInsight={CHART_GALLERY_LEO_COMPOSED}
              trendContent={<ComposedLineTrend />}
              tabOptions={isTabs ? [
                { value: "overlay", label: "Overlay" },
                { value: "comparison", label: "Side by Side" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Fill rate", value: "94%", trend: "up"   },
                { label: "Capacity",  value: "95",  trend: "up"   },
                { label: "Placed",    value: "89",  trend: "up"   },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <ComposedLineTrend /> : <ComposedChartContent />
                : <ComposedChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 5 · Radar (1/3) + Scatter (2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <div className="flex flex-col">
          {isSel ? (
            <ChartCard key="radar-sel" variant="selector" title="Competency Radar" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_RADAR}>
              {() => <RadarChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="radar" variant={v} title="Competency Radar" description="Avg. scores by skill domain"
              leoInsight={CHART_GALLERY_LEO_RADAR}
              trendContent={<RadarBarTrend />}
              tabOptions={isTabs ? [
                { value: "radar", label: "Radar" },
                { value: "breakdown", label: "Breakdown" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Avg.",   value: "88%", trend: "up"      },
                { label: "Top",    value: "Clinical", trend: "neutral" },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "breakdown" ? <RadarBarTrend /> : <RadarChartContent />
                : <RadarChartContent />}
            </ChartCard>
          )}
        </div>
        <div className="lg:col-span-2 flex flex-col">
          {isSel ? (
            <ChartCard key="scatter-sel" variant="selector" title="Site Performance" description="Filter by program"
              filterOptions={PROGRAM_OPTIONS} defaultFilter="all" leoInsight={CHART_GALLERY_LEO_SCATTER}>
              {() => <ScatterChartContent />}
            </ChartCard>
          ) : (
            <ChartCard key="scatter" variant={v} title="Site Performance" description="Capacity vs. fill rate · bubble = student count"
              leoInsight={CHART_GALLERY_LEO_SCATTER}
              trendContent={<ScatterLineTrend />}
              tabOptions={isTabs ? [
                { value: "scatter", label: "Scatter" },
                { value: "ranking", label: "Ranking" },
                { value: "trend", label: "Trend" },
              ] : undefined}
              miniMetrics={(isMT || isKpi) ? [
                { label: "Sites",    value: "12",  trend: "up"   },
                { label: "Avg. rate", value: "87%", trend: "up"  },
                { label: "Students", value: "320", trend: "up"   },
              ] : undefined}>
              {isTabs
                ? (tab: string) => tab === "trend" ? <ScatterLineTrend /> : <ScatterChartContent />
                : <ScatterChartContent />}
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 6 · Funnel full width */}
      {isSel ? (
        <ChartCard key="funnel-sel" variant="selector" title="Application Pipeline" description="Filter by time period"
          filterOptions={PERIOD_OPTIONS} defaultFilter="90d" leoInsight={CHART_GALLERY_LEO_FUNNEL}>
          {(f) => <FunnelChartContent data={funnelDataByPeriod[f] ?? funnelData} />}
        </ChartCard>
      ) : (
        <ChartCard key="funnel" variant={v} title="Application Pipeline" description="Funnel from application to completed placement"
          leoInsight={CHART_GALLERY_LEO_FUNNEL}
          trendContent={<FunnelLineTrend />}
          miniMetrics={(isMT || isKpi) ? [
            { label: "Applied",   value: "320", trend: "up"   },
            { label: "Placed",    value: "128", trend: "up"   },
            { label: "Completed", value: "98",  trend: "up"   },
            { label: "Drop-off",  value: "69%", trend: "down" },
          ] : undefined}>
          <FunnelChartContent />
        </ChartCard>
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════════════════ */

export function ChartsOverview({ variant = "normal" }: { variant?: ChartCardVariant }) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-2 lg:px-6">
      <ChartRows v={variant} />
    </div>
  )
}
