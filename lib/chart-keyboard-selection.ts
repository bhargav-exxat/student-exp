/**
 * Keyboard selection styling for Recharts — matches `charts-overview` (dashboard gallery)
 * so Data view dashboards use the same ring-on-active pattern instead of opacity-only dimming.
 */

/** Passed to `<Bar activeBar={…} activeIndex={…} />` */
export const CHART_KBD_ACTIVE_BAR = {
  stroke: "var(--ring)",
  strokeWidth: 2,
  fillOpacity: 1,
} as const

/** Passed to `<Pie activeShape={…} activeIndex={…} />` (see DonutChartContent) */
export const CHART_KBD_ACTIVE_PIE_SHAPE = {
  strokeWidth: 3,
  stroke: "var(--ring)",
} as const
