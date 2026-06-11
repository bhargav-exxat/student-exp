"use client"

/**
 * Leo recents — session-only recent prompts the user has sent from the
 * `/<product>/leo` landing canvas. Persisted to localStorage and shared
 * across components in the same tab through a singleton store, so the
 * canvas (`LeoLandingClient`) and the sidebar drill-in
 * (`LeoSidebarDrillInPanel`) stay in lock-step without prop-drilling.
 *
 * Why not `usePersistedState`? That hook subscribes to the browser
 * `storage` event for cross-tab sync — and `storage` events do NOT fire
 * in the same tab that wrote them. Two hook instances in the same tab
 * would silently diverge after the first write. The singleton + custom
 * subscriber set below fixes that without giving up cross-tab sync (the
 * `storage` handler at the bottom keeps the store fresh from other tabs).
 *
 * v1 is intentionally client-only. When the conversation route lands
 * (out of scope for this turn), swap `setStorageItem` for a server call —
 * the call sites keep the same `{ recents, push, remove, clear }` API.
 */

import * as React from "react"

import { productPersistKey } from "@/stores/app-store"
import { useProduct } from "@/contexts/product-context"

export interface LeoRecent {
  id: string
  /** Trimmed prompt text — capped at 240 chars for the list label. */
  prompt: string
  /** Timestamp in ms (Date.now()) so recents sort newest-first. */
  at: number
  /**
   * Route the user was on when they submitted the prompt — surfaced so
   * the row caption can recall the scope ("from /prism/placements").
   */
  fromRoute?: string
}

const RECENT_CAP = 10
const PROMPT_LABEL_CAP = 240
const EXXAT_STORAGE_PREFIX = "exxat-ds:"
const PERSIST_VERSION = 1

// ─────────────────────────────────────────────────────────────────────────────
// Singleton store — one slot per (product) recents key
// ─────────────────────────────────────────────────────────────────────────────

interface RecentsStore {
  state: LeoRecent[]
  subscribers: Set<() => void>
}

const STORES = new Map<string, RecentsStore>()
const EMPTY: LeoRecent[] = []

function fullKey(key: string): string {
  return `${EXXAT_STORAGE_PREFIX}${key}`
}

function safeRead(key: string): LeoRecent[] {
  if (typeof window === "undefined") return EMPTY
  try {
    const raw = window.localStorage.getItem(fullKey(key))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    // `usePersistedState` writes `{ v, d }` envelopes — accept both shapes
    // so a v1 key written before this rewrite still loads.
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.d)) return parsed.d
    return EMPTY
  } catch {
    return EMPTY
  }
}

function safeWrite(key: string, value: LeoRecent[]): void {
  if (typeof window === "undefined") return
  try {
    const payload = JSON.stringify({ v: PERSIST_VERSION, d: value })
    window.localStorage.setItem(fullKey(key), payload)
  } catch {
    // Quota / private mode — swallow; in-memory state still works.
  }
}

function getStore(key: string): RecentsStore {
  let store = STORES.get(key)
  if (!store) {
    store = { state: safeRead(key), subscribers: new Set() }
    STORES.set(key, store)
  }
  return store
}

function subscribe(key: string, cb: () => void): () => void {
  const store = getStore(key)
  store.subscribers.add(cb)
  return () => {
    store.subscribers.delete(cb)
  }
}

function notify(key: string): void {
  const store = STORES.get(key)
  if (!store) return
  store.subscribers.forEach((cb) => cb())
}

function updateState(
  key: string,
  updater: (prev: LeoRecent[]) => LeoRecent[],
): void {
  const store = getStore(key)
  const next = updater(store.state)
  if (next === store.state) return
  store.state = next
  safeWrite(key, next)
  notify(key)
}

// Cross-tab sync — keep all open tabs of /leo on the same recents list.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith(EXXAT_STORAGE_PREFIX)) return
    const localKey = e.key.slice(EXXAT_STORAGE_PREFIX.length)
    if (!STORES.has(localKey)) return
    const store = STORES.get(localKey)!
    store.state = safeRead(localKey)
    notify(localKey)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook API
// ─────────────────────────────────────────────────────────────────────────────

export interface UseLeoRecents {
  recents: LeoRecent[]
  /**
   * Push a prompt onto the recents list. Empty / blank prompts are skipped.
   * Consecutive identical prompts update the existing head row in place
   * (refresh the timestamp) instead of stacking duplicates. Returns the
   * row that was stored so callers can chain it into navigation.
   */
  push: (prompt: string, fromRoute?: string) => LeoRecent | null
  remove: (id: string) => void
  clear: () => void
}

export function useLeoRecents(): UseLeoRecents {
  const { product, customProducts, activeCustomIndex } = useProduct()
  const key = React.useMemo(
    () => productPersistKey(product, "leo:recents", customProducts, activeCustomIndex),
    [product, customProducts, activeCustomIndex],
  )

  const subscribeKey = React.useCallback((cb: () => void) => subscribe(key, cb), [key])
  const getSnapshot = React.useCallback(() => getStore(key).state, [key])
  const getServerSnapshot = React.useCallback(() => EMPTY, [])

  const recents = React.useSyncExternalStore(subscribeKey, getSnapshot, getServerSnapshot)

  const push = React.useCallback<UseLeoRecents["push"]>(
    (prompt, fromRoute) => {
      const trimmed = prompt.trim()
      if (!trimmed) return null
      const row: LeoRecent = {
        id: crypto.randomUUID(),
        prompt: trimmed.slice(0, PROMPT_LABEL_CAP),
        at: Date.now(),
        fromRoute,
      }
      updateState(key, (prev) => {
        const head = prev[0]
        if (head && head.prompt === row.prompt) {
          const next = [...prev]
          next[0] = { ...head, at: row.at, fromRoute }
          return next
        }
        return [row, ...prev].slice(0, RECENT_CAP)
      })
      return row
    },
    [key],
  )

  const remove = React.useCallback(
    (id: string) => updateState(key, (prev) => prev.filter((r) => r.id !== id)),
    [key],
  )

  const clear = React.useCallback(() => updateState(key, () => EMPTY), [key])

  return { recents, push, remove, clear }
}

/**
 * Format a Leo recent timestamp as a short relative label ("2h ago",
 * "yesterday", "Tue", "Apr 4"). Pure — safe to call from render.
 */
export function formatLeoRecentTime(at: number, now: number = Date.now()): string {
  const ms = Math.max(0, now - at)
  const min = Math.floor(ms / 60_000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return "yesterday"
  if (day < 7) {
    return new Date(at).toLocaleDateString(undefined, { weekday: "short" })
  }
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
