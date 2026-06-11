"use client"

/**
 * SystemBannerContext — the top-of-app system banner is now user-configurable
 * from Settings. We persist the config in `localStorage` so a product owner
 * (or a demo) can preview "maintenance notice", "new feature", "promo", etc.
 * without a redeploy. In production this would be backed by an admin API, but
 * the storage shape + provider surface already match what that API would need.
 *
 * Usage:
 *   - `<SystemBannerProvider>` wraps the app in (app)/layout.tsx.
 *   - Layout reads the config via `useSystemBanner()` and renders `<SystemBanner>` only when enabled.
 *   - Settings page calls `updateConfig()` / `setEnabled()` to change it.
 */

import * as React from "react"

export type SystemBannerVariant = "info" | "warning" | "error" | "success" | "promo"

export type SystemBannerEmphasis = "prominent" | "subtle"

export interface SystemBannerConfig {
  enabled: boolean
  variant: SystemBannerVariant
  emphasis: SystemBannerEmphasis
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  dismissible: boolean
}

export const DEFAULT_SYSTEM_BANNER_CONFIG: SystemBannerConfig = {
  enabled: true,
  variant: "promo",
  emphasis: "prominent",
  title: "Exxat One Premium",
  message: "Unlock advanced analytics, AI insights, and priority support.",
  actionLabel: "Learn more",
  actionHref: "#",
  dismissible: true,
}

const STORAGE_KEY = "exxat:system-banner-config"

const ALLOWED_VARIANTS: ReadonlySet<SystemBannerVariant> = new Set([
  "info",
  "warning",
  "error",
  "success",
  "promo",
])

const ALLOWED_EMPHASIS: ReadonlySet<SystemBannerEmphasis> = new Set([
  "prominent",
  "subtle",
])

/**
 * Strip any `actionHref` whose URL scheme could execute script when the
 * banner CTA is clicked (`javascript:`, `data:`, `vbscript:`, etc.).
 *
 * The banner UI renders `actionHref` as a plain `<a href>`, so a malicious
 * value in `localStorage` — written by an extension, a victim of a
 * same-origin bug elsewhere, or a future feature that accepts user input —
 * would become a one-click XSS or open-redirect vector on every tab that
 * receives the storage event. We accept only:
 *
 *   - Absolute http(s) URLs.
 *   - Absolute mailto: / tel: URIs (banner CTAs sometimes deep-link these).
 *   - Same-origin relative paths (`/foo`, `./bar`, `../baz`).
 *   - The single legacy placeholder `"#"` shipped in the default config.
 *
 * Anything else collapses to `undefined`, which the banner treats as
 * "no CTA link".
 */
function sanitizeActionHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined
  const trimmed = href.trim()
  if (!trimmed) return undefined
  if (trimmed === "#") return trimmed

  // Same-origin relative paths.
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return trimmed
  }

  // Absolute URLs — only allow http(s) / mailto: / tel:.
  try {
    // Use a dummy base so `new URL` accepts both absolute and protocol-relative inputs.
    const url = new URL(trimmed, "https://exxat.invalid")
    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:" ||
      url.protocol === "tel:"
    ) {
      return trimmed
    }
  } catch {
    /* fallthrough to reject */
  }

  return undefined
}

/**
 * Coerce an unknown JSON payload (from `localStorage` or a cross-tab
 * `storage` event) into a `SystemBannerConfig`. Unknown fields are dropped,
 * known fields are type-narrowed, and any string field is capped so a
 * malformed/oversized payload cannot stall the renderer.
 *
 * Returns `null` when the payload cannot be coerced — callers fall back to
 * the shipped default rather than render attacker-controlled content.
 */
function coerceConfig(raw: unknown): SystemBannerConfig | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const str = (v: unknown, max = 280): string | undefined =>
    typeof v === "string" ? v.slice(0, max) : undefined

  const variant = ALLOWED_VARIANTS.has(r.variant as SystemBannerVariant)
    ? (r.variant as SystemBannerVariant)
    : DEFAULT_SYSTEM_BANNER_CONFIG.variant
  const emphasis = ALLOWED_EMPHASIS.has(r.emphasis as SystemBannerEmphasis)
    ? (r.emphasis as SystemBannerEmphasis)
    : DEFAULT_SYSTEM_BANNER_CONFIG.emphasis

  return {
    enabled:
      typeof r.enabled === "boolean"
        ? r.enabled
        : DEFAULT_SYSTEM_BANNER_CONFIG.enabled,
    variant,
    emphasis,
    title: str(r.title, 120) ?? DEFAULT_SYSTEM_BANNER_CONFIG.title,
    message: str(r.message, 280) ?? DEFAULT_SYSTEM_BANNER_CONFIG.message,
    actionLabel: str(r.actionLabel, 60),
    actionHref: sanitizeActionHref(r.actionHref),
    dismissible:
      typeof r.dismissible === "boolean"
        ? r.dismissible
        : DEFAULT_SYSTEM_BANNER_CONFIG.dismissible,
  }
}

interface SystemBannerContextValue {
  config: SystemBannerConfig
  updateConfig: (patch: Partial<SystemBannerConfig>) => void
  setEnabled: (enabled: boolean) => void
  /** Apply an arbitrary config snapshot wholesale (used by Settings "Apply" button). */
  applyConfig: (next: SystemBannerConfig) => void
  /** Restore the shipped default. */
  reset: () => void
}

const SystemBannerContext = React.createContext<SystemBannerContextValue>({
  config: DEFAULT_SYSTEM_BANNER_CONFIG,
  updateConfig: () => {},
  setEnabled: () => {},
  applyConfig: () => {},
  reset: () => {},
})

function readStored(): SystemBannerConfig {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_BANNER_CONFIG
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SYSTEM_BANNER_CONFIG
    const coerced = coerceConfig(JSON.parse(raw))
    return coerced ?? DEFAULT_SYSTEM_BANNER_CONFIG
  } catch {
    return DEFAULT_SYSTEM_BANNER_CONFIG
  }
}

export function SystemBannerProvider({ children }: { children: React.ReactNode }) {
  // Start from default on SSR; hydrate from storage on mount so server and client markup match.
  const [config, setConfig] = React.useState<SystemBannerConfig>(DEFAULT_SYSTEM_BANNER_CONFIG)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setConfig(readStored())
    setHydrated(true)
  }, [])

  // Persist whenever config changes post-hydration.
  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* storage full / disabled — silently ignore, the UI still works for the session. */
    }
  }, [config, hydrated])

  // Cross-tab sync — if you change the banner in one tab, others follow.
  // The payload is treated as untrusted (an extension or future bug could
  // write into the same key) so we route it through `coerceConfig` to drop
  // unknown fields and `sanitizeActionHref` to refuse `javascript:` URLs.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const coerced = coerceConfig(JSON.parse(e.newValue))
        if (coerced) setConfig(coerced)
      } catch {
        /* ignore malformed payloads */
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const value = React.useMemo<SystemBannerContextValue>(
    () => ({
      config,
      updateConfig: (patch) => setConfig((prev) => ({ ...prev, ...patch })),
      setEnabled: (enabled) => setConfig((prev) => ({ ...prev, enabled })),
      applyConfig: (next) => setConfig(next),
      reset: () => setConfig(DEFAULT_SYSTEM_BANNER_CONFIG),
    }),
    [config],
  )

  return <SystemBannerContext.Provider value={value}>{children}</SystemBannerContext.Provider>
}

export function useSystemBanner() {
  return React.useContext(SystemBannerContext)
}
