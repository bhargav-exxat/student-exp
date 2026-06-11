"use client"

import * as React from "react"
import { Link } from "@/lib/router-compat"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface PageBreadcrumbTrailItem {
  label: string
  href?: string
}

export interface PageBreadcrumbBackProps {
  /** Destination label (e.g. "Question hub") — shown after the back icon. */
  label: string
  href: string
  className?: string
}

export interface PageBreadcrumbTrailProps {
  /** Linkable ancestors (e.g. Question hub). */
  items?: PageBreadcrumbTrailItem[]
  /**
   * Final segment in the trail. Omit when the current page is the `PageHeader`
   * `<h1>` — use ancestors-only above the title (no duplicate label).
   */
  currentPage?: string
  /**
   * `header` — SiteHeader: ancestors + `currentPage` on one line.
   * `content` — ancestors only, above `PageHeader` title.
   */
  variant?: "header" | "content"
  className?: string
}

/**
 * Single-step back nav — back icon + parent destination (no chevron trail).
 * Use in `SiteHeader` for focused child routes (composer, wizard) where the
 * page `<h1>` is the current title.
 */
export function PageBreadcrumbBack({ label, href, className }: PageBreadcrumbBackProps) {
  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="gap-1.5 font-sans tracking-normal">
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbLink asChild>
            <Link
              href={href}
              className="group inline-flex min-w-0 max-w-full items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-interactive-hover-foreground"
              aria-label={`Back to ${label}`}
            >
              <i
                className="fa-light fa-arrow-left shrink-0 text-xs transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Product breadcrumb trail — one component for SiteHeader and in-page shells.
 * Uses shadcn `Breadcrumb` primitives with Exxat site-header typography.
 *
 * For back-icon + parent label only, use {@link PageBreadcrumbBack}.
 */
export function PageBreadcrumbTrail({
  items = [],
  currentPage,
  variant = "content",
  className,
}: PageBreadcrumbTrailProps) {
  const isHeader = variant === "header"

  return (
    <Breadcrumb
      className={cn("min-w-0", className)}
      aria-label={isHeader ? undefined : "Breadcrumb"}
    >
      <BreadcrumbList
        className={cn(
          "gap-1.5 font-sans tracking-normal",
          isHeader && "flex-nowrap overflow-hidden",
        )}
      >
        {items.map((crumb, i) => (
          <React.Fragment key={`${crumb.label}-${i}`}>
            <BreadcrumbItem className="shrink-0">
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={crumb.href}
                    className="font-sans text-sm text-muted-foreground"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <span className="font-sans text-sm text-muted-foreground">
                  {crumb.label}
                </span>
              )}
            </BreadcrumbItem>
            {(currentPage != null || i < items.length - 1) && (
              <BreadcrumbSeparator className="text-muted-foreground/50 [&>i]:text-xs" />
            )}
          </React.Fragment>
        ))}
        {currentPage != null ? (
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-sans text-sm font-medium">
              {currentPage}
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
