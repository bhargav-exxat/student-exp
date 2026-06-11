"use client"

/**
 * Shared section chrome for dashboard hubs (Simple plain sections + Mix card headers).
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/** Primary line — matches across Getting started, Tasks, Insights, Learn, etc. */
export const dashboardSectionTitleClassName =
  "font-sans text-base font-semibold leading-snug text-foreground"

export const dashboardSectionDescriptionClassName = "text-sm text-muted-foreground"

export function DashboardSectionTitle({
  id,
  as: Tag = "h2",
  className,
  children,
}: {
  id?: string
  as?: "h1" | "h2"
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tag id={id} className={cn(dashboardSectionTitleClassName, className)}>
      {children}
    </Tag>
  )
}

/** Title + optional description + optional trailing actions (e.g. Select). */
export function DashboardSectionIntro({
  title,
  titleAs = "h2",
  titleId,
  description,
  actions,
  className,
}: {
  title: string
  titleAs?: "h1" | "h2"
  titleId?: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <DashboardSectionTitle id={titleId} as={titleAs}>
          {title}
        </DashboardSectionTitle>
        {description ? (
          <p className={cn(dashboardSectionDescriptionClassName, "mt-0.5")}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
