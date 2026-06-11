import * as React from "react"

import { SiteHeader, type SiteHeaderProps } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/** Default max width for primary hub pages (Placements, Team, Compliance, …). */
export const PRIMARY_PAGE_MAX_WIDTH_CLASS = "max-w-[1440px]"

export interface PrimaryPageTemplateProps {
  /** Optional chrome before `SiteHeader` (e.g. `RotationsPanelActivator`, `SidebarAutoCollapse`). */
  beforeSiteHeader?: React.ReactNode
  /** Top bar — breadcrumbs and Ask Leo. Omit for focused flows (e.g. full-page form with no chrome). */
  siteHeader?: SiteHeaderProps
  /** Page body — typically `*Client` with `ListPageTemplate` inside. */
  children: React.ReactNode
  /** Override default `max-w-[1440px]` for narrower shells (patterns showcase, detail routes). */
  maxWidthClassName?: string
  /** Extra classes on the `@[container]main` content column. */
  contentClassName?: string
  /** Extra classes on the flex wrapper between `SiteHeader` and the content column. */
  bodyClassName?: string
  /**
   * New question (`form-inspector`) only — viewport-height inset with scroll inside
   * builder/inspector cards. Hub routes leave this `false` (normal page scroll).
   */
  containScroll?: boolean
  /**
   * Optional full-page canvas behind `SiteHeader` + body (e.g. FigJam dot grid on New question).
   * Renders as `absolute inset-0` on `SidebarInset` — not inside scroll panes or cards.
   */
  pageCanvas?: React.ReactNode
}

/**
 * Primary page shell — same composition as Placements / Team / Compliance routes:
 * `SidebarInset` (single `main` landmark) + `SiteHeader` + max-width content column.
 *
 * Use with `ListPageTemplate` + data client per `AGENTS.md` §6.3 and `docs/data-views-pattern.md`.
 */
export function PrimaryPageTemplate({
  beforeSiteHeader,
  siteHeader,
  children,
  maxWidthClassName = PRIMARY_PAGE_MAX_WIDTH_CLASS,
  contentClassName,
  bodyClassName,
  containScroll = false,
  pageCanvas,
}: PrimaryPageTemplateProps) {
  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      className={cn(
        pageCanvas && "relative",
        containScroll &&
          "flex min-h-0 max-h-[calc(100svh-0.75rem)] flex-1 flex-col overflow-hidden pb-3 [--composer-pane-max:calc(100svh-12.5rem)]",
      )}
    >
      {pageCanvas}
      {beforeSiteHeader}
      {siteHeader ? (
        containScroll ? (
          <div className="relative z-[1] shrink-0">
            <SiteHeader {...siteHeader} />
          </div>
        ) : (
          <SiteHeader {...siteHeader} />
        )
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col outline-none",
          containScroll && "relative z-[1] overflow-hidden",
          bodyClassName,
        )}
      >
        <div
          className={cn(
            "@container/main mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col",
            maxWidthClassName,
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </SidebarInset>
  )
}
