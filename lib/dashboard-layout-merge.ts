/**
 * Merge saved layout with defaults for any dashboard canvas (Placements, Team, Compliance).
 */

export const KEY_METRICS_KPI_COUNT_MIN = 1
export const KEY_METRICS_KPI_COUNT_MAX = 4
export const KEY_METRICS_KPI_COUNT_DEFAULT = 4

export function clampKeyMetricsKpiCount(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : KEY_METRICS_KPI_COUNT_DEFAULT
  return Math.min(KEY_METRICS_KPI_COUNT_MAX, Math.max(KEY_METRICS_KPI_COUNT_MIN, x))
}

export interface DashboardLayoutV1 {
  visible: string[]
  order: string[]
  spans?: Record<string, 1 | 2>
  chartTypes?: Record<string, string>
  /** How many KPI cells to show on the key-metrics dashboard card (1–4). */
  keyMetricsKpiCount?: number
}

export function mergeDashboardLayoutGeneric(
  saved: DashboardLayoutV1 | null,
  defaults: {
    visible: string[]
    order: string[]
    spans: Record<string, 1 | 2>
    chartTypes: Record<string, string>
    keyMetricsKpiCount?: number
  },
  allCardIds: string[],
): DashboardLayoutV1 {
  const defaultKpi = clampKeyMetricsKpiCount(defaults.keyMetricsKpiCount)
  if (!saved) {
    return {
      visible: [...defaults.visible],
      order: [...defaults.order],
      spans: { ...defaults.spans },
      chartTypes: { ...defaults.chartTypes },
      keyMetricsKpiCount: defaultKpi,
    }
  }
  let order = saved.order.length ? [...saved.order] : [...defaults.order]
  let visible = saved.visible.length ? [...saved.visible] : [...defaults.visible]
  for (const id of allCardIds) {
    if (!order.includes(id)) order = [id, ...order.filter(x => x !== id)]
    if (!visible.includes(id) && defaults.visible.includes(id)) {
      visible = [...visible, id]
    }
  }
  order = order.filter(id => allCardIds.includes(id))
  visible = visible.filter(id => allCardIds.includes(id))
  return {
    visible: visible.length ? visible : [...defaults.visible],
    order: order.length ? order : [...defaults.order],
    spans: { ...defaults.spans, ...saved.spans },
    chartTypes: { ...defaults.chartTypes, ...saved.chartTypes },
    keyMetricsKpiCount: clampKeyMetricsKpiCount(
      saved.keyMetricsKpiCount ?? defaultKpi,
    ),
  }
}
