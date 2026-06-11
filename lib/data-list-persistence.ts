/**
 * @deprecated Placements-specific shim around the generic
 * `@/lib/table-state-lifecycle`. New code SHOULD import the generic helpers
 * (and the `useTableStateLifecycle` hook) directly. This file preserves the
 * old API + the old storage key prefix (`exxat-ds:data-list:*`) so existing
 * placements `localStorage` payloads continue to work during the migration.
 */

import {
  applyLifecyclePersisted as applyLifecyclePersistedGeneric,
  loadLifecycleFromStorage as loadLifecycleFromStorageGeneric,
  loadPageFromStorage as loadPageFromStorageGeneric,
  lifecycleStorageKey as lifecycleStorageKeyGeneric,
  pageStorageKey,
  parsePersistedLifecycle,
  parsePersistedPage,
  scheduleLifecycleSave as scheduleLifecycleSaveGeneric,
  schedulePageSave as schedulePageSaveGeneric,
  serializeLifecycle as serializeLifecycleGeneric,
  type PersistedLifecycleV1,
  type PersistedPageV1,
  type TableStatePersistSlice,
} from "@/lib/table-state-lifecycle"
import type { ConditionalRule } from "@/components/table-properties/types"

/** Legacy namespace — kept so existing placements payloads remain readable. */
const PLACEMENTS_NAMESPACE = "data-list"

export const DATA_LIST_PAGE_STORAGE_KEY = pageStorageKey(PLACEMENTS_NAMESPACE)

export function lifecycleStorageKey(lifecycleTabId: string): string {
  return lifecycleStorageKeyGeneric(PLACEMENTS_NAMESPACE, lifecycleTabId)
}

export {
  parsePersistedLifecycle,
  parsePersistedPage,
  applyLifecyclePersistedGeneric as applyLifecyclePersisted,
  type PersistedLifecycleV1,
  type PersistedPageV1,
  type TableStatePersistSlice,
}

export function loadLifecycleFromStorage(lifecycleTabId: string): PersistedLifecycleV1 | null {
  return loadLifecycleFromStorageGeneric(PLACEMENTS_NAMESPACE, lifecycleTabId)
}

export function scheduleLifecycleSave(
  lifecycleTabId: string,
  payload: PersistedLifecycleV1,
): void {
  scheduleLifecycleSaveGeneric(PLACEMENTS_NAMESPACE, lifecycleTabId, payload)
}

export function loadPageFromStorage(): PersistedPageV1 | null {
  return loadPageFromStorageGeneric(PLACEMENTS_NAMESPACE)
}

export function schedulePageSave(payload: PersistedPageV1): void {
  schedulePageSaveGeneric(PLACEMENTS_NAMESPACE, payload)
}

/**
 * Placements lifecycle includes a few extra fields next to the table state.
 * The generic serializer takes a free-form `extras` record; this thin
 * adapter keeps the original call sites typed and ergonomic.
 */
export interface PlacementsLifecycleExtras extends Record<string, unknown> {
  conditionalRules: ConditionalRule[]
  pagination: boolean
  paginationPage: number
  paginationPageSize: number
}

export function serializeLifecycle(
  ts: TableStatePersistSlice,
  extras: PlacementsLifecycleExtras,
): PersistedLifecycleV1 {
  return serializeLifecycleGeneric(ts, extras)
}
