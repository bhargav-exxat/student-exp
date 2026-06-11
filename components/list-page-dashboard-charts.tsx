"use client"

/**
 * List-page **dashboard** view — thin alias over {@link DashboardReportCharts}.
 * Uses a single-row KPI strip (`metricsSingleRow`) for dense hubs.
 */

import * as React from "react"
import {
  DashboardReportCharts,
  type DashboardReportChartsProps,
} from "@/components/dashboard-report-charts"

export type ListPageDashboardChartsProps = Omit<DashboardReportChartsProps, "metricsSingleRow">

export function ListPageDashboardCharts(props: ListPageDashboardChartsProps) {
  return <DashboardReportCharts {...props} metricsSingleRow />
}
