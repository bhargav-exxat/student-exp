"use client"

/**
 * DashboardViewContext
 * Shared state for the active dashboard view (report | simple | mix).
 * Consumed by NavUser (sidebar profile menu) and DashboardTabs (page content).
 */

import * as React from "react"

export type DashboardView = "report" | "simple" | "mix"

interface DashboardViewContextValue {
  activeView: DashboardView
  setActiveView: (v: DashboardView) => void
}

export const DashboardViewContext = React.createContext<DashboardViewContextValue>({
  activeView: "report",
  setActiveView: () => {},
})

export function useDashboardView() {
  return React.useContext(DashboardViewContext)
}

export function DashboardViewProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = React.useState<DashboardView>("report")
  const value = React.useMemo(() => ({ activeView, setActiveView }), [activeView])
  return (
    <DashboardViewContext.Provider value={value}>
      {children}
    </DashboardViewContext.Provider>
  )
}
