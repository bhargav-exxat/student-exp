/**
 * Namespaced recent-query storage for dedicated search routes (localStorage + sync event).
 * Hub code creates one controller per surface (namespace) and passes it into
 * {@link DedicatedSearchRecents} / {@link DedicatedSearchUrlComposer}.
 */

const MAX_RECENTS = 12

function parseStored(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map(s => s.trim())
      .slice(0, MAX_RECENTS)
  } catch {
    return []
  }
}

export interface DedicatedSearchRecentsController {
  /** Pass to `addEventListener` / `removeEventListener` (CustomEvent, no detail). */
  readonly eventName: string
  read: () => string[]
  record: (query: string) => void
  clear: () => void
}

export type DedicatedSearchRecentsLegacyKeys = {
  storageKey: string
  eventName: string
}

/**
 * @param namespace — Stable id when not using `legacy` (storage key + event name derive from it).
 * @param legacy — Optional stable keys for an existing shipped surface (avoid resetting users’ saved recents).
 */
export function createDedicatedSearchRecentsController(
  namespace: string,
  legacy?: DedicatedSearchRecentsLegacyKeys,
): DedicatedSearchRecentsController {
  const storageKey = legacy?.storageKey ?? `exxat-ds.dedicated-search.recents.${namespace}.v1`
  const eventName = legacy?.eventName ?? `exxat-dedicated-search-recents-${namespace}`

  const read = (): string[] => {
    if (typeof window === "undefined") return []
    return parseStored(window.localStorage.getItem(storageKey))
  }

  const record = (query: string): void => {
    const q = query.trim()
    if (!q || typeof window === "undefined") return
    const prev = read()
    const deduped = [q, ...prev.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENTS)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(deduped))
    } catch {
      /* ignore quota / private mode */
    }
    window.dispatchEvent(new CustomEvent(eventName))
  }

  const clear = (): void => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(eventName))
  }

  return { eventName, read, record, clear }
}
