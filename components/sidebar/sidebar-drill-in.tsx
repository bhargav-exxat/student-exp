"use client"

/**
 * SidebarDrillIn — local copy of the canonical primitive that ships in
 * `@exxatdesignux/ui/components/sidebar-drill-in` (see
 * `packages/ui/src/components/ui/sidebar-drill-in.tsx`). This app-local
 * mirror exists ONLY because the running DS app resolves the package via
 * its `dist/` artifacts, and we deliberately do not rebuild `dist/` during
 * iteration (would trigger the Vite dist-watch reload storm).
 *
 * Lifecycle:
 *  1. Today — this file is the source of truth for the DS app, and the
 *     identical canonical copy in `packages/ui/src/components/ui/` is
 *     compiled on the next `@exxatdesignux/ui` publish.
 *  2. After that publish — collapse this file to a one-line re-export:
 *
 *       export * from "@exxatdesignux/ui/components/sidebar-drill-in"
 *
 *     And remove the local implementation below.
 *
 * Keep the two copies BYTE-IDENTICAL except for import paths (`@/lib/utils`
 * + `@/components/ui/*` here vs. relative paths in the package source).
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Kbd } from "@/components/ui/kbd"

export interface SidebarDrillInProps {
  /** Whether the drilled-in pane is visible. Drive from URL match. */
  open: boolean
  /** Section heading, e.g. "Settings". */
  sectionTitle: string
  /** Click handler for the back row + any sibling `<Shortcut>` bindings. */
  onBack: () => void
  /**
   * Base nav content rendered while `open === false` (and as the
   * underlying pane during the slide animation).
   */
  baseContent: React.ReactNode
  /**
   * Drilled-in nav content — typically a `SidebarGroup` containing the
   * section's `NavLink` rows. Sits below the auto-rendered back row and
   * section heading.
   */
  children: React.ReactNode
  /** Optional class for the outer wrapper. */
  className?: string
}

export function SidebarDrillIn({
  open,
  sectionTitle,
  onBack,
  baseContent,
  children,
  className,
}: SidebarDrillInProps) {
  const backButtonRef = React.useRef<HTMLButtonElement>(null)

  const mountedRef = React.useRef(false)
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (!open) return
    const t = window.setTimeout(() => {
      backButtonRef.current?.focus({ preventScroll: true })
    }, 140)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <div
      data-slot="sidebar-drill-in"
      data-open={open || undefined}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-x-hidden",
        className,
      )}
    >
      <div
        data-slot="sidebar-drill-in-base"
        aria-hidden={open || undefined}
        inert={open}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-0 motion-safe:transition-transform motion-safe:duration-[120ms] motion-safe:ease-out",
          open && "-translate-x-full",
        )}
      >
        {baseContent}
      </div>

      <div
        data-slot="sidebar-drill-in-section"
        aria-hidden={!open || undefined}
        inert={!open}
        className={cn(
          "absolute inset-0 flex min-h-0 flex-col gap-0 overflow-y-auto motion-safe:transition-transform motion-safe:duration-[120ms] motion-safe:ease-out",
          !open && "translate-x-full",
        )}
      >
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  ref={backButtonRef}
                  type="button"
                  aria-label="Back to main navigation"
                  onClick={onBack}
                >
                  <span
                    className="flex size-4 shrink-0 items-center justify-center"
                    aria-hidden="true"
                  >
                    <i className="fa-light fa-arrow-left" aria-hidden="true" />
                  </span>
                  <span>Back</span>
                  <Kbd variant="bare" className="ms-auto">
                    Esc
                  </Kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-0 pt-0" role="group" aria-label={sectionTitle}>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide px-2 text-sidebar-section-label">
            {sectionTitle}
          </SidebarGroupLabel>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </SidebarGroup>
      </div>
    </div>
  )
}
