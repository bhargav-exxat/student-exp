"use client"

/**
 * SidebarShell — SidebarProvider with layout-aware widths.
 * Desktop expanded/collapsed is persisted in the `sidebar_state_v2` cookie by `@exxatdesignux/ui`
 * `SidebarProvider` (read on mount + write on toggle). `(app)/layout` passes
 * `defaultOpen` from the same cookie on the server so SSR matches the first client paint.
 */

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

export function SidebarShell({
  children,
  // Literal `48px` (not `calc(var(--spacing) * 12)`) so the breadcrumb height
  // stays identical to `:root { --header-height: 48px }` in
  // `packages/ui/src/globals.css` — which is what `DataTable` reads from
  // `document.documentElement` to pin the sticky column header. With the calc
  // form, `data-text-size="compact"` (94 % root font-size) shrinks `1rem` to
  // ~15px and the calc resolves to ~45.12px while JS still sees 48px → a
  // visible band leaks rows between the stuck breadcrumb and the column
  // header. `large` mode produces the inverse overlap. Locking the chrome
  // height keeps the bar 48px in all text-size modes; internal text still
  // scales via rem.
  headerHeight = "48px",
  defaultOpen = true,
  wrapperClassName,
}: {
  children: React.ReactNode
  headerHeight?: string
  defaultOpen?: boolean
  /** Extra classes on the SidebarProvider wrapper div */
  wrapperClassName?: string
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className={wrapperClassName}
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": headerHeight,
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  )
}
