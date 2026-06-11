"use client"

/**
 * ChartVariantContext
 * Shared state for the active chart card style on the dashboard.
 * Consumed by NavUser (sidebar profile menu) and DashboardTabs (page content).
 */

import * as React from "react"

export type ChartVariant = "normal" | "tabs" | "selector" | "metrics-tabs" | "kpi-chart"

interface ChartVariantContextValue {
  chartVariant: ChartVariant
  setChartVariant: (v: ChartVariant) => void
}

export const ChartVariantContext = React.createContext<ChartVariantContextValue>({
  chartVariant: "normal",
  setChartVariant: () => {},
})

export function ChartVariantProvider({ children }: { children: React.ReactNode }) {
  const [chartVariant, setChartVariant] = React.useState<ChartVariant>("kpi-chart")
  const value = React.useMemo(() => ({ chartVariant, setChartVariant }), [chartVariant])
  return (
    <ChartVariantContext.Provider value={value}>
      {children}
    </ChartVariantContext.Provider>
  )
}

export function useChartVariant() {
  return React.useContext(ChartVariantContext)
}
