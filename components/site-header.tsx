"use client"

/**
 * SiteHeader — breadcrumb / top bar — WCAG 2.1 AA
 *
 *  ✓ SidebarTrigger wrapped in Tooltip — icon-only button (WCAG 4.1.2, 1.1.1)
 *  ✓ <header> landmark for AT navigation (WCAG 1.3.6)
 *  ✓ Sticky at top — when stuck, the rounded breadcrumb sits on the app bg and a
 *    bottom separator appears to anchor it; transparent at rest so the rounded
 *    corners blend into the inset card.
 *  ✓ Uses Inter (font-sans) — Ivy Presto is reserved for PageHeader <h1> only
 */

import * as React from "react"
import {
  PageBreadcrumbBack,
  PageBreadcrumbTrail,
  type PageBreadcrumbBackProps,
  type PageBreadcrumbTrailItem,
} from "@/components/page-breadcrumb-trail"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = PageBreadcrumbTrailItem
export type SiteHeaderBackLink = Pick<PageBreadcrumbBackProps, "label" | "href">

export interface SiteHeaderProps {
  /** Current page title (last breadcrumb segment in trail mode). */
  title?: string
  /** Full breadcrumb trail — each item can be a link or plain text. Title is appended automatically as the last segment. */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * Back-icon variant — parent link only (no `title` segment in the header).
   * Prefer when the page `<h1>` carries the current title (e.g. New question composer).
   */
  back?: SiteHeaderBackLink
}

export function SiteHeader({
  title = "Dashboard",
  breadcrumbs,
  back,
}: SiteHeaderProps) {
  const mod = useModKeyLabel()
  const [isStuck, setIsStuck] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setIsStuck(window.scrollY > 0)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={cn(
        // Sticky page chrome sits BELOW every Radix overlay (DropdownMenu /
        // Popover / Select / Dialog / Sheet / Tooltip all render at
        // z-50). Previously `z-60` here caused the school/product switcher
        // dropdown to open behind the breadcrumb. `z-30` keeps the header
        // above page content (charts, tables, scrolled rows) but below
        // floating overlays.
        //
        // Stuck-state chrome: subtle scrolled cue without becoming a
        // separate floating pill. The wrapper sticks to the top of the
        // SidebarInset and inherits the inset's rounded top corners via
        // `rounded-t-xl`. When stuck we layer a faint sidebar-tinted
        // surface, a hairline bottom border, and a soft `shadow-sm` so
        // the bar reads as elevated chrome (matching `SidebarInset`'s
        // resting elevation) — but stays inside the inset rectangle so
        // it doesn't compete with the table-column sticky header below.
        // `transition-[background-color,box-shadow]` fades the elevation
        // in/out alongside the bg flip.
        "sticky top-0 z-30 rounded-t-xl transition-[background-color,box-shadow]",
        isStuck
          ? "bg-sidebar border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 bg-background rounded-t-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      <div className="flex w-full min-w-0 items-center gap-1 ps-3 pe-1.5 lg:gap-2 lg:ps-6 lg:pe-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="-ms-1" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
            <span>Toggle sidebar</span>
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          className="mx-1.5 shrink-0 lg:mx-2"
        />

        {back ? (
          <PageBreadcrumbBack {...back} className="min-w-0 flex-1" />
        ) : (
          <PageBreadcrumbTrail
            variant="header"
            items={breadcrumbs}
            currentPage={title}
            className="min-w-0 flex-1"
          />
        )}
      </div>
    </header>
    </div>
  )
}
