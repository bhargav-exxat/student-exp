"use client"

/**
 * DashboardReportCharts — single reusable layout for the main `/dashboard` “Report” tab and
 * list-page **dashboard** view types (Placements, Team, etc.).
 *
 * Composes **`KeyMetrics`** (flat) + chart middle section + **`KeyMetrics`** (period comparison card).
 * - Default **`ChartsOverview`** = placement-themed demo gallery (used by `/dashboard` and Placements).
 * - Pass **`chartsSection`** for entity-specific charts (e.g. Team roster metrics) so graphs match the page.
 */

import * as React from "react"
import { DashboardPromoBanner } from "@/components/dashboard-promo-banner"
import { GettingStarted } from "@/components/onboarding/getting-started"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { ChartsOverview, type ChartCardVariant } from "@/components/charts-overview"
import { useChartVariant } from "@/contexts/chart-variant-context"

export interface DashboardReportChartsProps {
  metrics: MetricItem[]
  insight: MetricInsight
  /** Override app-wide chart card style (e.g. tests). */
  chartVariant?: ChartCardVariant
  /** When set, replaces `ChartsOverview` (placement demo). Use for Team / other hubs with their own data. */
  chartsSection?: React.ReactNode
  comparisonTitle?: string
  comparisonDescription?: string
  /** Use on dense list hubs; main dashboard Report tab omits this. */
  metricsSingleRow?: boolean
}

export function DashboardReportCharts({
  metrics,
  insight,
  chartVariant: chartVariantProp,
  chartsSection,
  comparisonTitle = "Period Comparison",
  comparisonDescription = "Same metrics across comparison periods",
  metricsSingleRow = false,
}: DashboardReportChartsProps) {
  const { chartVariant: ctxVariant } = useChartVariant()
  const v = (chartVariantProp ?? ctxVariant) as ChartCardVariant

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="px-4 lg:px-6">
        <DashboardPromoBanner />
      </div>
      <KeyMetrics
        variant="flat"
        metrics={metrics}
        insight={insight}
        showHeader={false}
        metricsSingleRow={metricsSingleRow}
      />
      {chartsSection ?? <ChartsOverview variant={v} />}
      <GettingStarted />
      <div className="px-4 lg:px-6">
        <KeyMetrics
          variant="card"
          title={comparisonTitle}
          description={comparisonDescription}
          metrics={metrics}
          defaultPeriod="month"
        />
      </div>
    </div>
  )
}
