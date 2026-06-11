/**
 * Centralized localStorage for **Data** view dashboard canvas (Placements, Team, Compliance).
 * Single bundle key; per-scope slices. Migrates legacy per-hub keys when a scope is missing.
 */

import type { DashboardLayoutV1 } from "@/lib/dashboard-layout-merge"

const BUNDLE_KEY = "exxat-ds:data-view-dashboards:v1"

/** Legacy keys (pre-bundle) — read when that scope is absent from the bundle. */
const LEGACY_KEYS: Record<DataViewScope, string> = {
  placements: "exxat-dashboard-cards",
  team: "exxat-team-dashboard-cards",
  compliance: "exxat-compliance-dashboard-cards",
}

export type DataViewScope = "placements" | "team" | "compliance"

type LayoutBundle = Partial<Record<DataViewScope, DashboardLayoutV1>>

function parseLayout(raw: unknown): DashboardLayoutV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.visible) || !Array.isArray(o.order)) return null
  const km = typeof o.keyMetricsKpiCount === "number" ? o.keyMetricsKpiCount : undefined
  return {
    visible: o.visible as string[],
    order: o.order as string[],
    spans:
      o.spans && typeof o.spans === "object" && !Array.isArray(o.spans)
        ? (o.spans as Record<string, 1 | 2>)
        : undefined,
    chartTypes:
      o.chartTypes && typeof o.chartTypes === "object" && !Array.isArray(o.chartTypes)
        ? (o.chartTypes as Record<string, string>)
        : undefined,
    keyMetricsKpiCount: km,
  }
}

function readBundleRaw(): LayoutBundle {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(BUNDLE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return parsed as LayoutBundle
  } catch {
    return {}
  }
}

function writeBundle(bundle: LayoutBundle) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(BUNDLE_KEY, JSON.stringify(bundle))
  } catch {
    /* ignore quota */
  }
}

/**
 * Merge any missing scopes from legacy keys into the bundle (one-time per scope per session edge cases OK).
 */
function ensureBundleWithLegacy(): LayoutBundle {
  let bundle = readBundleRaw()
  let changed = false
  for (const scope of ["placements", "team", "compliance"] as const) {
    if (bundle[scope]) continue
    try {
      const raw = localStorage.getItem(LEGACY_KEYS[scope])
      if (!raw) continue
      const layout = parseLayout(JSON.parse(raw) as unknown)
      if (layout) {
        bundle = { ...bundle, [scope]: layout }
        changed = true
      }
    } catch {
      /* ignore */
    }
  }
  if (changed) writeBundle(bundle)
  return bundle
}

/**
 * Load persisted layout for a hub (Placements / Team / Compliance Data view).
 */
export function loadDataViewLayout(scope: DataViewScope): DashboardLayoutV1 | null {
  const bundle = ensureBundleWithLegacy()
  return bundle[scope] ?? null
}

/**
 * Save layout for one hub; updates the shared bundle atomically.
 */
export function saveDataViewLayout(scope: DataViewScope, layout: DashboardLayoutV1) {
  const bundle = ensureBundleWithLegacy()
  writeBundle({ ...bundle, [scope]: layout })
}
