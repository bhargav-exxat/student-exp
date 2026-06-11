"use client"

/**
 * Student score bands — linear bars (min–max scale, class avg marker, student score)
 * and radial summary. ChartFigure wiring for the radial lives in charts-overview.tsx.
 */

import * as React from "react"
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { isEditableTarget } from "@/lib/editable-target"
import {
  DASHBOARD_STUDENT_SCORES,
  formatBandScore,
  scoreToTrackPercent,
  type DashboardStudentScoresData,
  type StudentScoreMetric,
  type StudentScoreRadial,
} from "@/lib/mock/dashboard"

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

const scoreRadialCfg: ChartConfig = {
  score: { label: "Student score", color: "var(--brand-color)" },
}

/** Same structure as ChartDataTable — local to avoid importing charts-overview (cycle). */
function SrOnlyMetricTable({
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

const scaleEndsClass =
  "flex justify-between gap-2 px-0.5 text-xs tabular-nums leading-none text-muted-foreground"

const linearProgressFocusClass =
  "rounded-md p-1.5 -m-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function StudentScoreProgressRow({
  label,
  scaleMin,
  scaleMax,
  classAverage,
  studentScore,
  averageMarkerLabel = "Class avg",
}: {
  label: string
  scaleMin: number
  scaleMax: number
  classAverage: number
  studentScore: number
  averageMarkerLabel?: string
}) {
  const fillPct = scoreToTrackPercent(studentScore, scaleMin, scaleMax)
  const avgPct = scoreToTrackPercent(classAverage, scaleMin, scaleMax)
  const minStr = formatBandScore(scaleMin)
  const maxStr = formatBandScore(scaleMax)
  const labelId = React.useId()
  const kbdHintId = React.useId()
  const valueText = `Score ${formatBandScore(studentScore)}. ${averageMarkerLabel} ${formatBandScore(classAverage)}. Scale ${minStr} through ${maxStr}.`

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape") return
    if (isEditableTarget(e.target)) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.blur()
  }

  /** Clicks on the track do not always move focus — align with ChartFigure pointer focus. */
  function handlePointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    const root = e.currentTarget
    const el = e.target as HTMLElement | null
    if (
      el?.closest?.(
        "button, a, [role='tab'], [role='option'], input, select, textarea, [contenteditable='true']",
      )
    )
      return
    queueMicrotask(() => root.focus())
  }

  return (
    <div>
      <p id={labelId} className="text-xs font-medium text-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-start gap-3 sm:gap-4">
        <div
          tabIndex={0}
          role="progressbar"
          aria-labelledby={labelId}
          aria-describedby={kbdHintId}
          aria-valuemin={scaleMin}
          aria-valuemax={scaleMax}
          aria-valuenow={studentScore}
          aria-valuetext={valueText}
          onKeyDown={handleKeyDown}
          onPointerDownCapture={handlePointerDownCapture}
          className={cn("min-w-0 flex-1", linearProgressFocusClass)}
        >
          <span id={kbdHintId} className="sr-only">
            Tab to focus this score bar. Press Escape to leave focus.
          </span>
          <div className={cn(scaleEndsClass, "mb-1")} aria-hidden="true">
            <span>{minStr}</span>
            <span>{maxStr}</span>
          </div>
          <div className="relative pb-7">
            {/* High-contrast (data-contrast="high") & Windows forced-colors:
                without these overrides the track, fill, and avg marker all
                collapse to the same value in HC themes (see a11y bug).
                - track: keep an outlined container so it's visible on the HC bg
                - fill:  use foreground color (full contrast) instead of tinted brand
                - pill:  invert with a visible border so label stays legible */}
            {/* HC dark: track = transparent with a thin border (so card bg
                shows through), fill = foreground (white on dark HC). Light HC:
                same pattern — fill resolves to near-black on light. Never
                invert: the FILL must be the high-contrast stroke, never the
                track. */}
            <div className="relative h-3 w-full overflow-visible rounded-full bg-muted hc:border hc:border-foreground hc:bg-transparent forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-brand hc:bg-foreground forced-colors:bg-[Highlight]"
                style={{ width: `${fillPct}%` }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 z-[1] w-0 -translate-x-1/2 border-l border-dashed border-muted-foreground/70 hc:border-foreground forced-colors:border-[CanvasText]"
                style={{ left: `${avgPct}%` }}
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                "pointer-events-none absolute top-[calc(0.75rem+0.375rem)] max-w-[5.5rem] -translate-x-1/2 rounded-md px-1.5 py-0.5 text-center",
                "bg-foreground text-xs font-medium leading-tight text-background",
                "hc:border hc:border-foreground hc:bg-background hc:text-foreground",
                "forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
              )}
              style={{ left: `${avgPct}%` }}
              aria-hidden="true"
            >
              {averageMarkerLabel}
            </span>
          </div>
          <div className={cn(scaleEndsClass, "mt-1")} aria-hidden="true">
            <span>{minStr}</span>
            <span>{maxStr}</span>
          </div>
        </div>
        <p
          className="shrink-0 text-xl font-bold tabular-nums text-foreground sm:text-2xl"
          aria-hidden="true"
        >
          {formatBandScore(studentScore)}
        </p>
      </div>
    </div>
  )
}

/** Recharts radial: ring = position of student score on scale; center shows raw score. */
export function QuotaRadialChartInner({
  radial,
  activeIndex,
}: {
  radial: StudentScoreRadial
  activeIndex: number | null
}) {
  const fill = scoreToTrackPercent(radial.studentScore, radial.scaleMin, radial.scaleMax)
  /* Fill + track reference CSS vars so HC mode can override them without
     re-rendering the chart. Default: brand fill over muted track.
     HC (`data-contrast="high"`): fill = foreground (full contrast), track =
     transparent with a visible ring via strokeOpacity on the bg bar. */
  const chartData = [{ name: "score", value: fill, fill: "var(--progress-fill, var(--brand-color))" }]

  return (
    <div
      className="relative mx-auto w-full max-w-[220px] hc:[--progress-fill:var(--foreground)] hc:[--progress-track:transparent] hc:[--progress-track-stroke:var(--foreground)] forced-colors:[--progress-fill:Highlight] forced-colors:[--progress-track:Canvas] forced-colors:[--progress-track-stroke:CanvasText]"
    >
      <ChartContainer config={scoreRadialCfg} className="mx-auto aspect-square w-full max-h-[220px]">
        <RadialBarChart
          data={chartData}
          innerRadius="58%"
          outerRadius="92%"
          startAngle={90}
          endAngle={-270}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <ChartTooltip
            key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props}
            content={(
              <ChartTooltipContent
                hideLabel
                formatter={() => (
                  <span className="tabular-nums">
                    Score {formatBandScore(radial.studentScore)} · {formatBandScore(radial.scaleMin)}–
                    {formatBandScore(radial.scaleMax)} · Class avg {formatBandScore(radial.classAverage)}
                  </span>
                )}
              />
            )}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{
              fill: "var(--progress-track, var(--muted))",
              stroke: "var(--progress-track-stroke, transparent)",
              strokeWidth: 1,
            }}
            {...activeIndexProps(activeIndex)}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatBandScore(radial.studentScore)}
        </span>
        <span className="mt-0.5 max-w-[10rem] text-center text-xs text-muted-foreground leading-snug">
          {radial.caption}
        </span>
      </div>
    </div>
  )
}

export function QuotaRadialGaugeStatic({ radial }: { radial: StudentScoreRadial }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <QuotaRadialChartInner radial={radial} activeIndex={null} />
      <p className="text-xs text-muted-foreground tabular-nums">
        Class avg{" "}
        <span className="font-medium text-foreground">{formatBandScore(radial.classAverage)}</span>
        <span className="text-muted-foreground">
          {" "}
          · scale {formatBandScore(radial.scaleMin)}–{formatBandScore(radial.scaleMax)}
        </span>
      </p>
    </div>
  )
}

export function QuotaLinearProgressCardBody({
  metric,
  suiteContext,
}: {
  metric: StudentScoreMetric
  suiteContext: string
}) {
  const summaryId = React.useId()
  const { scaleMin, scaleMax, classAverage, studentScore } = metric

  return (
    <div
      className="flex min-h-[120px] flex-1 flex-col justify-center"
      role="region"
      aria-describedby={summaryId}
    >
      <p id={summaryId} className="sr-only">
        {metric.label}: student score {formatBandScore(studentScore)}. Class average {formatBandScore(classAverage)}. Scale
        from {formatBandScore(scaleMin)} to {formatBandScore(scaleMax)}. {suiteContext}
      </p>
      <StudentScoreProgressRow
        label={metric.label}
        scaleMin={scaleMin}
        scaleMax={scaleMax}
        classAverage={classAverage}
        studentScore={studentScore}
        averageMarkerLabel={metric.averageMarkerLabel}
      />
      <SrOnlyMetricTable
        caption={metric.label}
        headers={["Assessment", "Student score", "Class average", "Scale min", "Scale max"]}
        rows={[[
          metric.label,
          formatBandScore(studentScore),
          formatBandScore(classAverage),
          formatBandScore(scaleMin),
          formatBandScore(scaleMax),
        ]]}
      />
    </div>
  )
}

export function DashboardQuotaProgressCard({
  data = DASHBOARD_STUDENT_SCORES,
  className,
}: {
  data?: DashboardStudentScoresData
  className?: string
}) {
  const desc = data.description ?? ""

  return (
    <div
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
      role="group"
      aria-label={`${data.title}. ${desc}`}
    >
      {data.metrics.map((m) => (
        <Card
          key={m.id}
          className="flex flex-col overflow-visible shadow-xs"
          role="figure"
          aria-label={`${m.label}. ${m.description ?? desc}`}
        >
          <CardHeader className="shrink-0 pb-2">
            <CardTitle className="text-sm font-semibold leading-tight">{m.label}</CardTitle>
            <CardDescription className="text-xs">{m.description ?? desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pb-4 pt-0">
            <QuotaLinearProgressCardBody metric={m} suiteContext={desc} />
          </CardContent>
        </Card>
      ))}
      <Card
        className="flex flex-col overflow-visible shadow-xs"
        role="figure"
        aria-label={`${data.radial.title}. ${desc}`}
      >
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="text-sm font-semibold leading-tight">{data.radial.title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center pb-4 pt-0">
          <QuotaRadialGaugeStatic radial={data.radial} />
          <SrOnlyMetricTable
            caption={data.radial.title}
            headers={["Measure", "Student score", "Class average", "Scale"]}
            rows={[[
              data.radial.title,
              formatBandScore(data.radial.studentScore),
              formatBandScore(data.radial.classAverage),
              `${formatBandScore(data.radial.scaleMin)}–${formatBandScore(data.radial.scaleMax)}`,
            ]]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
