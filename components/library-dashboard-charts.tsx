"use client"

/**
 * Library **Data** view — KPI strip + Recharts cards. Loaded via `next/dynamic`
 * from `library-table` so table/list/board/folder routes do not eagerly bundle Recharts.
 */

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { ChartCard, ChartDataTable, ChartFigure } from "@/components/charts-overview"
import { KeyMetrics } from "@/components/key-metrics"
import {
  ChartContainer,
  ChartTooltip,
  chartTooltipKeyboardSyncProps,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CHART_KBD_ACTIVE_BAR } from "@/lib/chart-keyboard-selection"
import type { LibraryItem, LibraryItemType } from "@/lib/mock/library"
import { libraryKpiInsight, libraryKpiMetrics } from "@/lib/mock/library-kpi"

const activeIndexProps = (activeIndex: number | null) =>
  activeIndex == null ? {} : ({ activeIndex } as Record<string, unknown>)

const BAR_CFG: ChartConfig = {
  count: { label: "Questions", color: "var(--color-chart-2)" },
}

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  short_answer: "Short answer",
}

function aggregateByType(rows: LibraryItem[]) {
  const c: Record<LibraryItemType, number> = {
    multiple_choice: 0,
    true_false: 0,
    short_answer: 0,
  }
  for (const r of rows) c[r.type]++
  return (Object.keys(c) as LibraryItemType[]).map(key => ({
    name: TYPE_LABEL[key],
    value: c[key],
    key,
  }))
}

function aggregateByTopic(rows: LibraryItem[]) {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.topic, (map.get(r.topic) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, value]) => ({ name: name.length > 20 ? `${name.slice(0, 18)}…` : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function QuestionsByTypeChart({ rows }: { rows: LibraryItem[] }) {
  const data = React.useMemo(() => aggregateByType(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `Item types: ${data.map(d => `${d.name} ${d.value}`).join(", ")}. Total ${rows.length}.`
  return (
    <ChartFigure label="Questions by item type" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} width={32} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                activeBar={CHART_KBD_ACTIVE_BAR}
                {...activeIndexProps(activeIndex)}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-2)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Questions by item type"
            headers={["Type", "Count"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

function QuestionsByTopicChart({ rows }: { rows: LibraryItem[] }) {
  const data = React.useMemo(() => aggregateByTopic(rows), [rows])
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground" role="status">
        No questions in this view.
      </div>
    )
  }
  const summary = `${data.length} topics shown. Total ${rows.length} questions.`
  return (
    <ChartFigure label="Questions by topic" summary={summary} dataLength={data.length}>
      {(activeIndex) => (
        <>
          <ChartContainer config={BAR_CFG} className="h-[220px] w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-chart-4)"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                activeBar={CHART_KBD_ACTIVE_BAR}
                {...activeIndexProps(activeIndex)}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-4)" />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            caption="Questions by topic"
            headers={["Topic", "Count"]}
            rows={data.map(d => [d.name, d.value])}
          />
        </>
      )}
    </ChartFigure>
  )
}

export function LibraryDashboardChartsSection({ rows }: { rows: LibraryItem[] }) {
  const kpi = React.useMemo(
    () => ({
      metrics: libraryKpiMetrics(rows),
      insight: libraryKpiInsight(rows),
    }),
    [rows],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
      <KeyMetrics
        variant="flat"
        metrics={kpi.metrics}
        insight={kpi.insight}
        showHeader={false}
        metricsSingleRow
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard variant="normal" title="By item type" description="Filtered question set">
          <QuestionsByTypeChart rows={rows} />
        </ChartCard>
        <ChartCard variant="normal" title="By topic" description="Up to eight topics">
          <QuestionsByTopicChart rows={rows} />
        </ChartCard>
      </div>
    </div>
  )
}
