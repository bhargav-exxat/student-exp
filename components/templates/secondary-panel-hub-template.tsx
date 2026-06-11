import * as React from "react"

import { PrimaryPageTemplate, type PrimaryPageTemplateProps } from "@/components/templates/primary-page-template"
import { useAutoPanel } from "@/components/sidebar"

export interface SecondaryPanelHubActivatorProps {
  panelId: string
}

/** Opens the nested secondary panel while the activator stays mounted (e.g. a route-segment layout). */
export function SecondaryPanelHubActivator({ panelId }: SecondaryPanelHubActivatorProps) {
  useAutoPanel(panelId)
  return null
}

export interface SecondaryPanelHubTemplateProps
  extends Omit<PrimaryPageTemplateProps, "beforeSiteHeader"> {
  /** Bridges hub state into the secondary nav (folder tree, access sheet, …). */
  bridges?: React.ReactNode
  /** Extra chrome before `SiteHeader`. */
  beforeSiteHeader?: React.ReactNode
}

/**
 * Primary hub shell with optional bridges + `PrimaryPageTemplate` body.
 * Mount `useAutoPanel` / `SecondaryPanelHubActivator` on a parent layout that stays mounted across
 * hub child routes (see `app/(app)/library/layout.tsx`) so the panel does not close between navigations.
 *
 * Pair with `useSecondaryPanelHubNav` and hub-specific `lib/*-nav.ts` helpers for URL scope.
 */
export function SecondaryPanelHubTemplate({
  bridges,
  beforeSiteHeader,
  siteHeader,
  children,
  maxWidthClassName,
  contentClassName,
  bodyClassName,
}: SecondaryPanelHubTemplateProps) {
  return (
    <>
      {bridges}
      <PrimaryPageTemplate
        beforeSiteHeader={beforeSiteHeader}
        siteHeader={siteHeader}
        maxWidthClassName={maxWidthClassName}
        contentClassName={contentClassName}
        bodyClassName={bodyClassName}
      >
        {children}
      </PrimaryPageTemplate>
    </>
  )
}
