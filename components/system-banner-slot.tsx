"use client"

/**
 * SystemBannerSlot — the live banner rendered at the top of the app shell.
 * Reads from `SystemBannerContext` so toggling / editing from Settings
 * updates the banner in real time (and cross-tab via the storage listener).
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { Link } from "@/lib/router-compat"
import { SystemBanner } from "@/components/ui/banner"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { useSystemBanner } from "@/contexts/system-banner-context"

const SUPPRESS_BANNER_PATHS: ReadonlyArray<string> = ["/builder/onboarding"]

export function SystemBannerSlot() {
  const { config, setEnabled } = useSystemBanner()
  const location = useLocation()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!config.enabled) return null
  if (SUPPRESS_BANNER_PATHS.some(path => location.pathname.startsWith(path))) return null

  // Banner surface matches SidebarInset + sidebar-gap (inset variant):
  //   expanded: gap = --sidebar-width, inset ms-0 → align at gap edge (no extra ps).
  //   collapsed: gap = icon + spacing(4), inset ms-2 → match packages/ui sidebar gap + 0.5rem.
  // Below md: px-2 matches SidebarInset horizontal inset (high zoom / narrow viewports).
  // md+: left padding follows the sidebar gap so the banner aligns with the main content area.
  // `z-20` keeps the slot (and promo glow) above the fixed sidebar rail (`z-10`) so paint order does not flatten the shadow.
  // The wrapper spans the viewport while its padding starts the banner after
  // the sidebar; keep the transparent area click-through so sidebar header
  // controls remain fully selectable.
  return (
    <div className="pointer-events-none relative z-20 shrink-0 px-2 pt-1.5 transition-[padding] duration-200 ease-linear md:ps-[var(--sidebar-width)] md:pe-2 md:pt-2 md:group-data-[state=collapsed]/sidebar-wrapper:ps-[calc(var(--sidebar-width-icon)+1rem+0.5rem)]">
      <div className="pointer-events-auto">
        <SystemBanner
          variant={config.variant}
          emphasis={config.emphasis}
          title={config.title || undefined}
          dismissible={config.dismissible}
          onDismiss={() => setEnabled(false)}
          decorativeOverlay={
            config.variant === "promo" && mounted ? (
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
          action={
            config.actionLabel
              ? { label: config.actionLabel, href: config.actionHref || "#" }
              : undefined
          }
        >
          {/* Fall back gracefully if message was cleared — still show title-only banner. */}
          {config.message || (config.title ? "" : <LinkAccent href="#">Details</LinkAccent>)}
        </SystemBanner>
      </div>
    </div>
  )
}

/** Tiny local link helper so the fallback above still uses next/link. */
function LinkAccent({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="underline">
      {children}
    </Link>
  )
}
