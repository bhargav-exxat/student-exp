"use client"

/**
 * Dashboard-only promo strip — same default messaging as the app system banner,
 * but independent (own dismiss + storage) so the shell `SystemBannerSlot` is unchanged.
 */

import * as React from "react"
import { SystemBanner } from "@/components/ui/banner"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { DEFAULT_SYSTEM_BANNER_CONFIG } from "@/contexts/system-banner-context"

const STORAGE_KEY = "exxat:dashboard-promo-dismissed"

export function DashboardPromoBanner() {
  const [mounted, setMounted] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      /* ignore */
    }
  }, [])

  if (!mounted || dismissed) return null

  const c = DEFAULT_SYSTEM_BANNER_CONFIG

  return (
    <SystemBanner
      variant="promo"
      emphasis={c.emphasis}
      title={c.title}
      dismissible
      onDismiss={() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, "1")
        } catch {
          /* ignore */
        }
        setDismissed(true)
      }}
      action={
        c.actionLabel
          ? { label: c.actionLabel, href: c.actionHref || "#" }
          : undefined
      }
      decorativeOverlay={
        c.variant === "promo" ? (
          <AiThinkingOverlay
            active
            cloudCount={2}
            cloudRadius={340}
            gridSize={13}
            dotRadius={1.15}
            fillClassName="fill-brand/30 dark:fill-brand/38"
          />
        ) : undefined
      }
    >
      {c.message}
    </SystemBanner>
  )
}
