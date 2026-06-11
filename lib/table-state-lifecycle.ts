"use client"

/**
 * Generic, opt-in lifecycle persistence for `useTableState`.
 *
 * - Any hub can persist its `DataTable` lifecycle (sort / search / filters /
 *   column order / pin / width / hidden / row height / gridlines / etc.) to
 *   `localStorage` by calling `useTableStateLifecycle({ namespace, tabId,
 *   tableState, columnKeys })`. Don't call it → no persistence (the table
 *   still works fine in memory).
 * - Storage keys are namespaced (`exxat-ds:<namespace>:lifecycle:v1:<tabId>`)
 *   so each hub owns its own keyspace and can't clobber another hub.
 * - Hubs that need to persist EXTRA state alongside the table (e.g. the
 *   placements table also persists `conditionalRules` + pagination) pass an
 *   `extras` object and an `onLoadExtras` callback.
 * - Saves are debounced (~400ms) and SSR-safe (no-op on the server).
 *
 * Replaces the older `lib/data-list-persistence.ts`, which was hard-coded to
 * the placements / "data-list" route. That file now re-exports from here for
 * back-compat so existing imports keep working during the migration window.
 */

import * as React from "react"
import type { Dispatch, SetStateAction } from "react"
import type { RowHeight } from "@/lib/row-height"
import type { DataListDisplayOptions } from "@/lib/data-list-display-options"
import type { ActiveFilter, ConditionalRule, SortRule } from "@/components/table-properties/types"
import type { ViewTab } from "@/components/templates/list-page"
import type { DataListViewType } from "@/lib/data-list-view"

// ─────────────────────────────────────────────────────────────────────────────
// Storage key + debounce config
// ─────────────────────────────────────────────────────────────────────────────

const LIFECYCLE_SAVE_DEBOUNCE_MS = 400
const PAGE_SAVE_DEBOUNCE_MS = 400

/** Public so hubs that want to clear or namespace-scan storage can. */
export function lifecycleStorageKey(namespace: string, tabId: string): string {
  return `exxat-ds:${namespace}:lifecycle:v1:${tabId}`
}

export function pageStorageKey(namespace: string): string {
  return `exxat-ds:${namespace}:page:v1`
}

// Module-level timer maps — one per namespace+tabId combo and one per page key.
const lifecycleTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pageTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ─────────────────────────────────────────────────────────────────────────────
// Persisted shapes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Versioned snapshot of a single table's lifecycle state. The fields under
 * `extras` are entity-specific (e.g. placements stuff `conditionalRules` and
 * pagination there) and opaque to this module. Older v1 records (pre-extras
 * rollout) may have those entity-specific fields at the top level — the
 * parser accepts both shapes for back-compat.
 */
export interface PersistedLifecycleV1 {
  v: 1
  sortRules: SortRule[]
  search: string
  activeFilters: ActiveFilter[]
  filterConnectors: Record<string, "and" | "or">
  groupBy: string | null
  colOrder: string[]
  hiddenCols: string[]
  colWidths: Record<string, number>
  colPins: Record<string, "left" | "right">
  colWrap: Record<string, boolean>
  colMenuSearch: Record<string, string>
  rowHeight: RowHeight
  showGridlines: boolean
  filterBarVisible: boolean
  searchOpen: boolean
  /** Generic hub-defined extras. Persisted as JSON. */
  extras?: Record<string, unknown>
  /**
   * @deprecated Legacy top-level fields (used by placements pre-extras
   * rollout). New code SHOULD live under `extras`. Kept here so existing
   * placements `localStorage` payloads still parse.
   */
  conditionalRules?: ConditionalRule[]
  pagination?: boolean
  paginationPage?: number
  paginationPageSize?: number
}

export interface PersistedPageV1 {
  v: 1
  displayOptions: DataListDisplayOptions
  showMetrics: boolean
  tabs: ViewTab[]
  activeTabId: string
}

/**
 * Narrow surface the lifecycle hook needs from `useTableState` — getters +
 * setters for every persisted slice. Defined as a structural type so
 * callers can pass `tableState` directly (it satisfies this shape).
 */
export interface TableStatePersistSlice {
  sortRules: SortRule[]
  search: string
  activeFilters: ActiveFilter[]
  filterConnectors: Record<string, "and" | "or">
  groupBy: string | null
  colOrder: string[]
  hiddenCols: Set<string>
  colWidths: Record<string, number>
  colPins: Record<string, "left" | "right">
  colWrap: Record<string, boolean>
  colMenuSearch: Record<string, string>
  rowHeight: RowHeight
  showGridlines: boolean
  filterBarVisible: boolean
  searchOpen: boolean
  setSortRules: Dispatch<SetStateAction<SortRule[]>>
  setSearch: Dispatch<SetStateAction<string>>
  setActiveFilters: Dispatch<SetStateAction<ActiveFilter[]>>
  setFilterConnectors: Dispatch<SetStateAction<Record<string, "and" | "or">>>
  setGroupBy: Dispatch<SetStateAction<string | null>>
  setColOrder: Dispatch<SetStateAction<string[]>>
  setHiddenCols: Dispatch<SetStateAction<Set<string>>>
  setColWidths: Dispatch<SetStateAction<Record<string, number>>>
  setColPins: Dispatch<SetStateAction<Record<string, "left" | "right">>>
  setColWrap: Dispatch<SetStateAction<Record<string, boolean>>>
  setColMenuSearch: Dispatch<SetStateAction<Record<string, string>>>
  setRowHeight: Dispatch<SetStateAction<RowHeight>>
  setShowGridlines: Dispatch<SetStateAction<boolean>>
  setFilterBarVisible: Dispatch<SetStateAction<boolean>>
  setSearchOpen: Dispatch<SetStateAction<boolean>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers + validators
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_TYPES: DataListViewType[] = ["table", "list", "board", "dashboard"]

function isViewType(v: unknown): v is DataListViewType {
  return typeof v === "string" && (VIEW_TYPES as string[]).includes(v)
}

function parseViewTab(raw: unknown): ViewTab | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.label !== "string") return null
  if (!isViewType(o.viewType)) return null
  if (typeof o.icon !== "string" || typeof o.filterId !== "string") return null
  return { id: o.id, label: o.label, viewType: o.viewType, icon: o.icon, filterId: o.filterId }
}

export function parsePersistedPage(raw: string | null): PersistedPageV1 | null {
  if (!raw) return null
  try {
    const j = JSON.parse(raw) as unknown
    if (!j || typeof j !== "object") return null
    const o = j as Record<string, unknown>
    if (o.v !== 1) return null
    if (!o.displayOptions || typeof o.displayOptions !== "object") return null
    if (typeof o.showMetrics !== "boolean") return null
    if (!Array.isArray(o.tabs) || typeof o.activeTabId !== "string") return null
    const tabs = o.tabs.map(parseViewTab).filter((t): t is ViewTab => t !== null)
    if (tabs.length === 0) return null
    return {
      v: 1,
      displayOptions: o.displayOptions as DataListDisplayOptions,
      showMetrics: o.showMetrics,
      tabs,
      activeTabId: o.activeTabId,
    }
  } catch {
    return null
  }
}

export function parsePersistedLifecycle(raw: string | null): PersistedLifecycleV1 | null {
  if (!raw) return null
  try {
    const j = JSON.parse(raw) as unknown
    if (!j || typeof j !== "object") return null
    const o = j as Record<string, unknown>
    if (o.v !== 1) return null
    if (!Array.isArray(o.sortRules)) return null
    if (typeof o.search !== "string") return null
    if (!Array.isArray(o.activeFilters)) return null
    if (!o.filterConnectors || typeof o.filterConnectors !== "object") return null
    if (o.groupBy !== null && typeof o.groupBy !== "string") return null
    if (!Array.isArray(o.colOrder)) return null
    if (!Array.isArray(o.hiddenCols)) return null
    if (!o.colWidths || typeof o.colWidths !== "object") return null
    if (!o.colPins || typeof o.colPins !== "object") return null
    if (!o.colWrap || typeof o.colWrap !== "object") return null
    if (!o.colMenuSearch || typeof o.colMenuSearch !== "object") return null
    if (typeof o.rowHeight !== "string") return null
    if (typeof o.showGridlines !== "boolean") return null
    if (typeof o.filterBarVisible !== "boolean") return null
    if (typeof o.searchOpen !== "boolean") return null
    // `extras` is optional; legacy placements payloads kept these at the top
    // level instead and we accept those for back-compat.
    if (o.extras !== undefined && (typeof o.extras !== "object" || o.extras === null)) return null
    return o as unknown as PersistedLifecycleV1
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply / serialize
// ─────────────────────────────────────────────────────────────────────────────

function mergeColOrder(saved: string[], columnKeys: Set<string>): string[] {
  const ordered = saved.filter(k => columnKeys.has(k))
  for (const k of columnKeys) {
    if (!ordered.includes(k)) ordered.push(k)
  }
  return ordered
}

function filterRecordKeys<T extends Record<string, unknown>>(obj: T, keys: Set<string>): T {
  const out = { ...obj }
  for (const k of Object.keys(out)) {
    if (!keys.has(k)) delete out[k]
  }
  return out
}

function sanitizeActiveFilters(
  filters: ActiveFilter[],
  columnKeys: Set<string>,
): ActiveFilter[] {
  return filters.filter(f => columnKeys.has(f.fieldKey))
}

function sanitizeSortRules(rules: SortRule[], columnKeys: Set<string>): SortRule[] {
  return rules.filter(r => columnKeys.has(r.fieldKey))
}

/** Column layout only — keeps in-memory search / filters when the column set changes. */
export function applyLifecycleColumnLayout(
  ts: TableStatePersistSlice,
  p: PersistedLifecycleV1,
  columnKeys: Set<string>,
): void {
  const colOrder = mergeColOrder(p.colOrder, columnKeys)
  const hidden = new Set(p.hiddenCols.filter(k => columnKeys.has(k)))
  const colWidths = filterRecordKeys(p.colWidths, columnKeys) as Record<string, number>
  const colPins = filterRecordKeys(p.colPins, columnKeys) as Record<string, "left" | "right">
  const colWrap = filterRecordKeys(p.colWrap, columnKeys) as Record<string, boolean>
  const colMenuSearch = filterRecordKeys(p.colMenuSearch, columnKeys) as Record<string, string>

  ts.setColOrder(colOrder)
  ts.setHiddenCols(hidden)
  ts.setColWidths(colWidths)
  ts.setColPins(colPins)
  ts.setColWrap(colWrap)
  ts.setColMenuSearch(colMenuSearch)
  ts.setRowHeight(p.rowHeight)
  ts.setShowGridlines(p.showGridlines)
}

export function applyLifecyclePersisted(
  ts: TableStatePersistSlice,
  p: PersistedLifecycleV1,
  columnKeys: Set<string>,
): void {
  applyLifecycleColumnLayout(ts, p, columnKeys)

  ts.setSortRules(sanitizeSortRules(p.sortRules, columnKeys))
  ts.setSearch(p.search)
  ts.setActiveFilters(sanitizeActiveFilters(p.activeFilters, columnKeys))
  ts.setFilterConnectors(p.filterConnectors)
  ts.setGroupBy(p.groupBy != null && columnKeys.has(p.groupBy) ? p.groupBy : null)
  ts.setFilterBarVisible(p.filterBarVisible)
  ts.setSearchOpen(p.searchOpen)
}

export function serializeLifecycle(
  ts: TableStatePersistSlice,
  extras?: Record<string, unknown>,
): PersistedLifecycleV1 {
  return {
    v: 1,
    sortRules: ts.sortRules,
    search: ts.search,
    activeFilters: ts.activeFilters,
    filterConnectors: ts.filterConnectors,
    groupBy: ts.groupBy,
    colOrder: ts.colOrder,
    hiddenCols: [...ts.hiddenCols],
    colWidths: { ...ts.colWidths },
    colPins: { ...ts.colPins },
    colWrap: { ...ts.colWrap },
    colMenuSearch: { ...ts.colMenuSearch },
    rowHeight: ts.rowHeight,
    showGridlines: ts.showGridlines,
    filterBarVisible: ts.filterBarVisible,
    searchOpen: ts.searchOpen,
    extras,
  }
}

/**
 * Read merged extras from a payload, falling back to the legacy top-level
 * placements fields when `extras` isn't set yet. Generic so hubs can cast to
 * their own extras shape.
 */
export function readLifecycleExtras<TExtras extends Record<string, unknown>>(
  p: PersistedLifecycleV1,
): TExtras | undefined {
  if (p.extras) return p.extras as TExtras
  // Legacy placements payload — synthesise extras from known top-level keys.
  if (
    p.conditionalRules !== undefined ||
    p.pagination !== undefined ||
    p.paginationPage !== undefined ||
    p.paginationPageSize !== undefined
  ) {
    const legacy: Record<string, unknown> = {}
    if (p.conditionalRules !== undefined) legacy.conditionalRules = p.conditionalRules
    if (p.pagination !== undefined) legacy.pagination = p.pagination
    if (p.paginationPage !== undefined) legacy.paginationPage = p.paginationPage
    if (p.paginationPageSize !== undefined) legacy.paginationPageSize = p.paginationPageSize
    return legacy as TExtras
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct storage IO (rarely needed — prefer the hook)
// ─────────────────────────────────────────────────────────────────────────────

export function loadLifecycleFromStorage(
  namespace: string,
  tabId: string,
): PersistedLifecycleV1 | null {
  if (typeof window === "undefined") return null
  return parsePersistedLifecycle(localStorage.getItem(lifecycleStorageKey(namespace, tabId)))
}

export function scheduleLifecycleSave(
  namespace: string,
  tabId: string,
  payload: PersistedLifecycleV1,
): void {
  if (typeof window === "undefined") return
  const key = lifecycleStorageKey(namespace, tabId)
  const prev = lifecycleTimers.get(key)
  if (prev) clearTimeout(prev)
  const t = setTimeout(() => {
    lifecycleTimers.delete(key)
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      /* quota / private mode */
    }
  }, LIFECYCLE_SAVE_DEBOUNCE_MS)
  lifecycleTimers.set(key, t)
}

export function loadPageFromStorage(namespace: string): PersistedPageV1 | null {
  if (typeof window === "undefined") return null
  return parsePersistedPage(localStorage.getItem(pageStorageKey(namespace)))
}

export function schedulePageSave(namespace: string, payload: PersistedPageV1): void {
  if (typeof window === "undefined") return
  const key = pageStorageKey(namespace)
  const prev = pageTimers.get(key)
  if (prev) clearTimeout(prev)
  const t = setTimeout(() => {
    pageTimers.delete(key)
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      /* quota */
    }
  }, PAGE_SAVE_DEBOUNCE_MS)
  pageTimers.set(key, t)
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook (the recommended entry point)
// ─────────────────────────────────────────────────────────────────────────────

export interface UseTableStateLifecycleOptions<TExtras extends Record<string, unknown> | void = void> {
  /** Storage namespace, e.g. `"placements"`, `"team"`, `"library"`. */
  namespace: string
  /**
   * Sub-key per lifecycle tab. A hub with only one lifecycle should pass a
   * stable constant like `"main"`. A hub with multiple lifecycle scopes
   * (e.g. placements' "all / mine / shared" tabs) passes the active scope id.
   */
  tabId: string
  /** `useTableState(...)` return value. Satisfies `TableStatePersistSlice`. */
  tableState: TableStatePersistSlice
  /**
   * Valid column keys for the active table. Persisted column references that
   * are no longer present (e.g. column was renamed / removed) are dropped on
   * load.
   */
  columnKeys: Set<string>
  /**
   * Current value of extra state to persist alongside the table (optional).
   * Pass `undefined` / omit entirely if the hub only persists the table.
   */
  extras?: TExtras
  /**
   * Called once when the persisted record is loaded, with whatever `extras`
   * it contained (or legacy top-level fields). Use this to rehydrate the
   * matching React state in the consumer.
   */
  onLoadExtras?: (extras: TExtras | Record<string, unknown> | undefined) => void
}

/**
 * Opt-in lifecycle persistence for a `DataTable`. Wires up:
 *
 * 1. **Load** (`useLayoutEffect`, once per `tabId` / `columnKeys` change) —
 *    reads from `localStorage` and pushes the persisted state back into
 *    `tableState` setters; then calls `onLoadExtras` so the consumer can
 *    restore hub-specific state too.
 * 2. **Save** (`useEffect`, debounced ~400ms) — re-serializes whenever any
 *    persisted slice changes and writes to `localStorage`.
 *
 * Behaviour:
 *
 * - SSR-safe (`localStorage` reads are guarded; the layout effect only runs
 *   on the client).
 * - No render hits: setters are called inside the effect, not during render.
 * - Doesn't depend on the full `tableState` object — it depends on each
 *   persisted slice individually so the table object identity (which is fresh
 *   every render) doesn't force re-saves.
 */
export function useTableStateLifecycle<TExtras extends Record<string, unknown> | void = void>(
  opts: UseTableStateLifecycleOptions<TExtras>,
): void {
  const { namespace, tabId, tableState, columnKeys, extras, onLoadExtras } = opts

  // Keep `onLoadExtras` in a ref so the load effect doesn't refire when the
  // consumer passes a new function reference each render.
  const onLoadExtrasRef = React.useRef(onLoadExtras)
  React.useEffect(() => {
    onLoadExtrasRef.current = onLoadExtras
  })

  const columnKeysFingerprint = React.useMemo(
    () => [...columnKeys].sort().join("\0"),
    [columnKeys],
  )

  const loadedScopeRef = React.useRef<string | null>(null)
  const appliedColumnFingerprintRef = React.useRef<string | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────
  // useLayoutEffect so the rehydrated state paints in the first frame after
  // mount instead of flashing the unhydrated defaults first.
  React.useLayoutEffect(() => {
    // Wait until column defs exist — applying persisted sort/filters against an
    // empty key set would sanitize everything away and look like Properties broke.
    if (columnKeys.size === 0) return

    const scope = `${namespace}:${tabId}`
    const raw = loadLifecycleFromStorage(namespace, tabId)

    if (loadedScopeRef.current !== scope) {
      loadedScopeRef.current = scope
      appliedColumnFingerprintRef.current = columnKeysFingerprint
      if (!raw) return
      applyLifecyclePersisted(tableState, raw, columnKeys)
      const e = readLifecycleExtras<Record<string, unknown>>(raw)
      onLoadExtrasRef.current?.(e as TExtras | Record<string, unknown> | undefined)
      return
    }

    if (appliedColumnFingerprintRef.current === columnKeysFingerprint) return
    appliedColumnFingerprintRef.current = columnKeysFingerprint
    if (!raw) return
    // Column defs changed (e.g. hub scope / dynamic filter options) — re-merge
    // layout only; do not wipe in-memory filters the user set in Properties.
    applyLifecycleColumnLayout(tableState, raw, columnKeys)
    // `tableState` is freshly returned each render; depending on it would
    // re-apply persisted state on every keystroke and undo edits. Depend only
    // on the load scope (namespace + tabId + column fingerprint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, tabId, columnKeysFingerprint])

  // ── Save ────────────────────────────────────────────────────────────────
  // Serialise + debounce on every persisted slice change. Don't depend on
  // the full `tableState` (fresh per render); depend on each slice instead so
  // a no-op render doesn't trigger a no-op save.
  const extrasJson = React.useMemo(() => (extras ? JSON.stringify(extras) : ""), [extras])
  React.useEffect(() => {
    const payload = serializeLifecycle(tableState, extras as Record<string, unknown> | undefined)
    scheduleLifecycleSave(namespace, tabId, payload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    namespace,
    tabId,
    extrasJson,
    tableState.sortRules,
    tableState.search,
    tableState.activeFilters,
    tableState.filterConnectors,
    tableState.groupBy,
    tableState.colOrder,
    tableState.hiddenCols,
    tableState.colWidths,
    tableState.colPins,
    tableState.colWrap,
    tableState.colMenuSearch,
    tableState.rowHeight,
    tableState.showGridlines,
    tableState.filterBarVisible,
    tableState.searchOpen,
  ])
}
