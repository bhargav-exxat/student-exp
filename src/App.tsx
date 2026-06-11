import * as React from "react"
import { Outlet, useLocation } from "react-router-dom"

import {
  AppSidebar,
  SidebarShell,
  SecondaryPanelProvider,
  SecondaryPanel,
} from "@/components/sidebar"
import {
  SIDEBAR_STATE_COOKIE_NAME,
  sidebarDefaultOpenFromCookie,
} from "@/lib/sidebar-state-cookie"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProductProviderRoot } from "@/components/product-provider-root"
import {
  ProductRouteSync,
  useProductDashboardHref,
  useProductOrganizationSettingsHref,
} from "@/contexts/product-route-sync"
import { ProductSwitchOverlay } from "@/components/product-switch-overlay"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { DashboardViewProvider } from "@/contexts/dashboard-view-context"
import { ChartVariantProvider } from "@/contexts/chart-variant-context"
import { AskLeoProvider, AskLeoSidebar } from "@/components/ask-leo-sidebar"
import { KeyMetricsAskLeoBridge } from "@/components/key-metrics-ask-leo-bridge"
import { SystemBannerProvider } from "@/contexts/system-banner-context"
import { SystemBannerSlot } from "@/components/system-banner-slot"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/contexts/command-menu-context"
import { buildCommandMenuConfig, type CommandMenuConfig } from "@/lib/command-menu-config"
import { COMMAND_MENU_SEARCH_DATA_GROUPS } from "@/lib/command-menu-search-data"

/**
 * Vite-side root layout — replaces both `app/layout.tsx` (Next root) and
 * `app/(app)/layout.tsx` (Next signed-in app shell).
 *
 * Cookie reading: Next reads `cookies()` server-side. In Vite/SPA we read
 * `document.cookie` synchronously on first render — the API is identical
 * (default `true` if absent, otherwise the persisted state). No
 * hydration mismatch because there is no server render to mismatch
 * against.
 *
 * Provider order is preserved verbatim from the Next layout — these
 * contexts are tightly coupled to DS components (KeyMetrics ↔ Ask Leo,
 * SecondaryPanel ↔ Sidebar) and reorder would break runtime behaviour.
 *
 * The `<Outlet />` in the centre is where each route's element renders.
 */

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie
    .split("; ")
    .find(c => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=")[1]) : undefined
}

function patchOrganizationSettingsHref(
  config: CommandMenuConfig,
  organizationSettingsHref: string,
): CommandMenuConfig {
  return {
    ...config,
    groups: config.groups.map(group => ({
      ...group,
      items: group.items?.map(item =>
        item.id === "nav-settings-organization"
          ? { ...item, href: organizationSettingsHref }
          : item,
      ),
    })),
  }
}

function AppShell({ sidebarDefaultOpen }: { sidebarDefaultOpen: boolean }) {
  const dashboardHref = useProductDashboardHref()
  const libraryHref = dashboardHref.replace(/\/dashboard$/, "/library")
  const organizationSettingsHref = useProductOrganizationSettingsHref()
  const commandMenuConfig = React.useMemo(
    () =>
      patchOrganizationSettingsHref(
        patchCommandMenuHrefs(
          buildCommandMenuConfig({ dataGroups: COMMAND_MENU_SEARCH_DATA_GROUPS }),
          {
            "nav-dashboard": dashboardHref,
            "nav-library": libraryHref,
            "nav-library-all": `${libraryHref}/all`,
          },
        ),
        organizationSettingsHref,
      ),
    [dashboardHref, libraryHref, organizationSettingsHref],
  )

  const location = useLocation()
  const isExamPage = location.pathname.includes("/exam/")

  if (isExamPage) {
    return (
      <TooltipProvider delayDuration={300}>
        <Outlet />
      </TooltipProvider>
    )
  }

  return (
    <>
      <ProductRouteSync />
      <ProductSwitchOverlay />
      <ThemeColorSync />
      <TooltipProvider delayDuration={300}>
        <DashboardViewProvider>
          <ChartVariantProvider>
            <AskLeoProvider>
              <KeyMetricsAskLeoBridge>
                <SystemBannerProvider>
                  <CommandMenuProvider value={commandMenuConfig}>
                    <SidebarShell
                      defaultOpen={sidebarDefaultOpen}
                      wrapperClassName="flex min-h-svh flex-col"
                    >
                      <CommandMenu />
                      <SystemBannerSlot />
                      <div
                        className="flex min-h-0 w-full flex-1 items-stretch has-data-[variant=inset]:bg-sidebar"
                        suppressHydrationWarning
                      >
                        <SecondaryPanelProvider>
                          <AppSidebar variant="inset" />
                          <SecondaryPanel />
                          <Outlet />
                        </SecondaryPanelProvider>
                        <AskLeoSidebar />
                      </div>
                    </SidebarShell>
                  </CommandMenuProvider>
                </SystemBannerProvider>
              </KeyMetricsAskLeoBridge>
            </AskLeoProvider>
          </ChartVariantProvider>
        </DashboardViewProvider>
      </TooltipProvider>
    </>
  )
}

function patchCommandMenuHrefs(
  config: CommandMenuConfig,
  hrefs: Record<string, string>,
): CommandMenuConfig {
  return {
    ...config,
    groups: config.groups.map(group => ({
      ...group,
      items: group.items?.map(item =>
        item.id in hrefs ? { ...item, href: hrefs[item.id] } : item,
      ),
    })),
  }
}

export function App() {
  const sidebarDefaultOpen = sidebarDefaultOpenFromCookie(
    readCookie(SIDEBAR_STATE_COOKIE_NAME),
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ProductProviderRoot>
        <AppShell sidebarDefaultOpen={sidebarDefaultOpen} />
      </ProductProviderRoot>
    </ThemeProvider>
  )
}
