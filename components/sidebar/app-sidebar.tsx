"use client"

/**
 * AppSidebar — single-column nav matching the design reference:
 * Exxat One header, primary links, "Documents" group, utilities, user.
 *
 * Collapsed (icon) chrome is driven only by CSS (`group-data-[collapsible=icon]:…`)
 * on the ancestor from `ui/sidebar` — the same DOM is always rendered so Radix
 * `useId()` order matches between SSR and hydration (fixes downstream menus).
 */

import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { motion, useReducedMotion } from "motion/react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useRegisterNavFlyoutToggle,
  useSidebar,
} from "@/components/ui/sidebar"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { requestOpenCommandMenu } from "@/components/command-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { useLocationHash } from "@/hooks/use-location-hash"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { useProduct, type Product } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { productSlug } from "@/stores/app-store"
import { isListedCustomProduct } from "@/stores/app-store"
import { NavUser } from "./nav-user"
import { useSecondaryPanel } from "./secondary-panel"
import { SidebarDrillIn } from "./sidebar-drill-in"
import { LeoSidebarDrillInPanel } from "./leo-sidebar-drill-in-panel"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { motionHeaderEnter } from "@/lib/motion-ui"
import { customProductBrandConfig, productBrandLabel } from "@/lib/product-brand"
import { isProductRefHidden, type ProductRef } from "@/lib/product-ref"
import {
  isLibraryPrimaryListNavActive,
  LIBRARY_PRIMARY_LIST_NAV_KEY,
} from "@/lib/library-nav"
import {
  NAV_BY_PRODUCT,
  getPrimaryNavForProduct,
  getPrimaryNavLayoutForProduct,
  type NavPrimaryLayout,
  type NavSection,
  NAV_DOCUMENTS,
  NAV_DOCUMENTS_LABEL,
  NAV_SCHOOL_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  NAV_QUICK_ACTIONS,
  NAV_SCHOOLS,
  NAV_SITE_DEFAULT,
  NAV_LOCATION_DEFAULT,
  NAV_SITES,
  NAV_SECONDARY,
  getSecondaryNavForProduct,
  NAV_USER,
  type NavDrillInConfig,
  type NavLinkItem,
  type NavSecondaryItem,
  type NavSchool,
  type NavSite,
} from "@/lib/mock/navigation"
import {
  buildNavHashClaims,
  collectNavUrls,
  isNavHrefActive,
  navUrlPath,
  normalizedLocationHash,
} from "@exxatdesignux/ui/lib/nav-active"
import {
  customProductSlugFromSuffix,
  primaryNavLinksForSlug,
} from "@exxatdesignux/product-framework"
import {
  expandSwitcherProducts,
  resolveActiveSwitcherEntry,
  type SwitcherProductEntry,
} from "@/lib/product-switcher-catalog"

// Active-link disambiguation needs to know about every URL the sidebar can
// expose in any product (longest-prefix wins). Spreading the registry keeps
// the nav-active helper accurate even when the user switches products and
// the *displayed* primary nav changes.
const BUILTIN_PRODUCT_SETTINGS_URLS = (
  ["exxat-prism", "exxat-design-os", "exxat-one-schools", "exxat-one-sites"] as const
).map(p => `/${productSlug(p)}/settings`)

const STATIC_NAV_URLS = collectNavUrls([
  ...Object.values(NAV_BY_PRODUCT).flat(),
  ...NAV_DOCUMENTS,
  ...NAV_SECONDARY,
  ...BUILTIN_PRODUCT_SETTINGS_URLS.map(url => ({ url })),
  { url: "/settings/profile" },
  { url: "/settings/organization" },
])

// Custom-product nav lives in the tenant registry, which is hydrated at
// runtime — so we can't bake those URLs into a `const` at module load.
// Instead `AppSidebar` calls `syncCustomNavUrls(extras)` once per render
// (idempotent on URL-set signature) and the helpers consult the *current*
// list. This keeps the existing `isNavActive(pathname, url, hash)` API
// stable for ~15 callsites without threading `allNavUrls` through every
// child component.
let CURRENT_NAV_URLS: ReadonlyArray<string> = STATIC_NAV_URLS
let CURRENT_NAV_HASH_CLAIMS = buildNavHashClaims(STATIC_NAV_URLS)
let CURRENT_NAV_URL_SIGNATURE = STATIC_NAV_URLS.length === 0 ? "" : STATIC_NAV_URLS.join("|")

function syncCustomNavUrls(extras: ReadonlyArray<string>): void {
  if (extras.length === 0 && CURRENT_NAV_URLS === STATIC_NAV_URLS) return
  const merged = extras.length === 0
    ? STATIC_NAV_URLS
    : Array.from(new Set([...STATIC_NAV_URLS, ...extras]))
  const signature = merged.length === 0 ? "" : merged.join("|")
  if (signature === CURRENT_NAV_URL_SIGNATURE) return
  CURRENT_NAV_URLS = merged
  CURRENT_NAV_HASH_CLAIMS = buildNavHashClaims(merged)
  CURRENT_NAV_URL_SIGNATURE = signature
}

/** Single active primary/secondary sidebar row — longest matching path wins. */
function isNavActive(pathname: string, url: string, locationHash = ""): boolean {
  return isNavHrefActive(pathname, url, CURRENT_NAV_URLS, {
    locationHash,
    hashClaimsByPath: CURRENT_NAV_HASH_CLAIMS,
  })
}

/** Sub-item active — catalog detail routes, hash fragments, duplicate hub URLs, or nested children. */
function isCollapsibleChildActive(
  pathname: string,
  parent: NavLinkItem,
  child: NavLinkItem,
  locationHash: string
): boolean {
  if (child.children?.length) {
    const anyNestedActive = child.children.some((grandchild) =>
      isCollapsibleChildActive(pathname, child, grandchild, locationHash),
    )
    if (anyNestedActive) return true
    return isNavActive(pathname, child.url, locationHash)
  }

  const children = parent.children
  if (!children?.length) return isNavActive(pathname, child.url, locationHash)

  const hasHashChild = children.some(c => c.url.includes("#"))
  if (hasHashChild) {
    const h = normalizedLocationHash(locationHash)
    const childHash = child.url.includes("#") ? child.url.split("#")[1] : ""
    if (parent.primaryHubChildKey && child.key === parent.primaryHubChildKey) {
      return h === ""
    }
    if (childHash) {
      return h === childHash
    }
    return false
  }

  if (!isNavActive(pathname, child.url, locationHash)) return false

  /** Primary “Library” (`library-all`) — list hub route, independent of secondary scope. */
  if (child.key === LIBRARY_PRIMARY_LIST_NAV_KEY && parent.key === "library") {
    return isLibraryPrimaryListNavActive(pathname)
  }

  /** Hub entry (`/library`) must not stay “active” on `/library/all` etc. */
  if (parent.primaryHubChildKey && child.key === parent.primaryHubChildKey) {
    const hubPath = navUrlPath(parent.url)
    if (hubPath) {
      const normalized =
        pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
      if (normalized !== hubPath) return false
    }
  }

  const urls = children.map(c => c.url)
  const allSameUrl = urls.length > 1 && urls.every(u => u === urls[0])
  if (allSameUrl) {
    if (parent.primaryHubChildKey) {
      return child.key === parent.primaryHubChildKey
    }
    return false
  }
  return true
}

/**
 * “Selected” styling on a collapsible **parent** row in the **expanded** sidebar.
 *
 * Rule: when any descendant child is the current destination, the parent stays
 * visually NEUTRAL — the active child carries `data-active` on its own. The
 * parent is only highlighted when no child matches but the parent URL still
 * matches (edge case: route that isn't represented in the sub-list).
 *
 * Note: this is for the expanded view only. The collapsed icon rail uses
 * `iconRailActive = isAnyChildActive` because the parent icon is the only
 * visible affordance there (see `CollapsibleNavItem`).
 */
function isCollapsibleParentMenuButtonActive(
  pathname: string,
  item: NavLinkItem,
  locationHash: string,
): boolean {
  const children = item.children
  if (!children?.length) return isNavActive(pathname, item.url, locationHash)

  const anyChildActive = children.some(c =>
    isCollapsibleChildActive(pathname, item, c, locationHash),
  )
  if (anyChildActive) return false
  return isNavActive(pathname, item.url, locationHash)
}

/** Accessible suffix for sidebar badges (badge is rendered outside the link node). */
function badgeAccessibleSuffix(badge: number | string): string {
  if (typeof badge === "number") return `${badge} items`
  return String(badge)
}

function NavItemBadgeContent({ badge }: { badge: number | string }) {
  if (typeof badge === "number") {
    return (
      <Badge className="h-4 min-w-4 px-1 text-xs leading-none font-semibold rounded-full tabular-nums border-transparent bg-destructive text-destructive-foreground hover:bg-destructive">
        {badge}
      </Badge>
    )
  }
  if (badge === "New") return <StatusBadge status="new" />
  if (badge === "Beta") return <StatusBadge status="beta" />
  return (
    <Badge className="h-4 px-1.5 text-xs leading-none font-semibold rounded-full">
      {badge}
    </Badge>
  )
}

/** Child row for expandable nav items — shared by inline sub-menu and collapsed-rail popover. */
const SidebarNavChildLink = React.forwardRef<
  HTMLAnchorElement,
  {
    parent: NavLinkItem
    child: NavLinkItem
    pathname: string
    locationHash: string
    onNavigate?: () => void
    /** Inline sub-menu pins badge on `SidebarMenuSubItem`; flyout keeps badge in-row. */
    hideBadge?: boolean
    /** Popover uses surface tokens; inline sub-menu uses `SidebarMenuSubButton`. */
    linkClassName?: string
  } & Omit<React.ComponentPropsWithoutRef<typeof Link>, "to">
>(function SidebarNavChildLink(
  {
    parent,
    child,
    pathname,
    locationHash,
    onNavigate,
    hideBadge = false,
    linkClassName,
    className: incomingClassName,
    onClick,
    ...linkRest
  },
  ref,
) {
  const { openPanel } = useSecondaryPanel()
  const childActive = isCollapsibleChildActive(pathname, parent, child, locationHash)
  const childPath = navUrlPath(child.url)

  return (
    <Link
      ref={ref}
      to={child.url}
      className={cn(
        "flex w-full min-w-0 items-center gap-2",
        linkClassName,
        incomingClassName,
      )}
      aria-current={childActive ? "page" : undefined}
      aria-label={
        child.badge !== undefined
          ? `${child.title}, ${badgeAccessibleSuffix(child.badge)}`
          : undefined
      }
      onClick={e => {
        onNavigate?.()
        if (parent.secondaryPanel && !child.url.includes("#")) {
          const panelId = parent.secondaryPanel
          // Same-route only — first navigation to `/library/all` opens the panel
          // from `library/_layout.tsx` after the URL updates (avoids pathname race).
          if (pathname === childPath) {
            e.preventDefault()
            openPanel(panelId)
          }
        }
        onClick?.(e)
      }}
      {...linkRest}
    >
      <span className="size-4 shrink-0 inline-flex items-center justify-center" aria-hidden="true">
        {childActive && child.iconActive ? child.iconActive : child.icon}
      </span>
      <SidebarNavLabel>{child.title}</SidebarNavLabel>
      {!hideBadge && child.badge !== undefined ? (
        <span className="ms-auto shrink-0" aria-hidden="true">
          <NavItemBadgeContent badge={child.badge} />
        </span>
      ) : null}
    </Link>
  )
})
SidebarNavChildLink.displayName = "SidebarNavChildLink"

/** Inline sub-menu row — badge pinned to far end (same contract as `SidebarMenuBadge`). */
function SidebarNavSubMenuRow({
  parent,
  child,
  pathname,
  locationHash,
}: {
  parent: NavLinkItem
  child: NavLinkItem
  pathname: string
  locationHash: string
}) {
  const childActive = isCollapsibleChildActive(pathname, parent, child, locationHash)

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={childActive} className="min-w-0 flex-1">
        <SidebarNavChildLink
          parent={parent}
          child={child}
          pathname={pathname}
          locationHash={locationHash}
          hideBadge
        />
      </SidebarMenuSubButton>
      {child.badge !== undefined ? (
        <span
          aria-hidden="true"
          data-sidebar="nav-sub-badge"
          className="me-2 shrink-0 self-center"
        >
          <NavItemBadgeContent badge={child.badge} />
        </span>
      ) : null}
    </SidebarMenuSubItem>
  )
}

/** Nested collapsible inside an expanded parent sub-menu (e.g. Compliance under Program). */
function CollapsibleNavSubItem({
  item,
  pathname,
}: {
  item: NavLinkItem
  pathname: string
}) {
  const locationHash = useLocationHash()
  const isAnyNestedActive =
    item.children?.some((child) => isCollapsibleChildActive(pathname, item, child, locationHash)) ??
    false
  const parentMenuButtonActive = isCollapsibleParentMenuButtonActive(pathname, item, locationHash)
  const [open, setOpen] = React.useState(false)

  const navRouteKey = `${pathname}|${locationHash}|${isAnyNestedActive}`
  const prevNavRouteKeyRef = React.useRef(navRouteKey)
  if (navRouteKey !== prevNavRouteKeyRef.current) {
    prevNavRouteKeyRef.current = navRouteKey
    setOpen(isAnyNestedActive)
  }

  if (!item.children?.length) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuSubItem className="group/collapsible-sub flex-col !items-stretch">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton isActive={parentMenuButtonActive} className="w-full min-w-0">
            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              {parentMenuButtonActive && item.iconActive ? item.iconActive : item.icon}
            </span>
            <SidebarNavLabel>{item.title}</SidebarNavLabel>
            <span
              className="ms-auto flex size-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <i
                className="fa-light fa-chevron-right text-xs text-current transition-transform duration-200 ease-out group-data-[state=open]/collapsible-sub:rotate-90 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="w-full overflow-hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarNavSubMenuRow
                key={child.key}
                parent={item}
                child={child}
                pathname={pathname}
                locationHash={locationHash}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function collectFlyoutLinks(
  parent: NavLinkItem,
): { parent: NavLinkItem; child: NavLinkItem }[] {
  const links: { parent: NavLinkItem; child: NavLinkItem }[] = []
  for (const child of parent.children ?? []) {
    if (child.children?.length) {
      for (const grandchild of child.children) {
        links.push({ parent: child, child: grandchild })
      }
    } else {
      links.push({ parent, child })
    }
  }
  return links
}

/**
 * CollapsibleNavItem — isolated component so each collapsible has its own
 * controlled `open` state initialised in useEffect. This avoids the Radix
 * hydration mismatch caused by `defaultOpen` resolving differently on the
 * server (SSR) vs the client (navigate not yet available).
 */
function CollapsibleNavItem({ item, pathname }: { item: NavLinkItem; pathname: string }) {
  const locationHash = useLocationHash()
  const isAnyChildActive =
    item.children?.some(c => isCollapsibleChildActive(pathname, item, c, locationHash)) ?? false
  const parentMenuButtonActive = isCollapsibleParentMenuButtonActive(pathname, item, locationHash)
  const { secondaryFlyoutHidden, activePanel } = useSecondaryPanel()
  const { state, isMobile } = useSidebar()
  const [open, setOpen] = React.useState(false)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)
  const flyoutTitleId = React.useId()
  // Defer the icon-rail React-tree swap until AFTER the sidebar's CSS width
  // transition (`duration-200` in `packages/ui/src/components/ui/sidebar.tsx`)
  // has finished. The component returns a completely different tree per mode
  // — `<Collapsible>` (expanded) vs `<Popover>` (icon rail) — so a sync flip
  // unmounts every Radix Collapsible + tooltip + mounts every Radix Popover
  // (with floating-ui, focus traps, portals) right at frame 0 of the toggle.
  // That ~30–80 ms of synchronous React + Radix work blocks the main thread
  // exactly while the browser is starting to interpolate width, which is the
  // dominant cause of "the sidebar feels sluggish" everywhere in the app.
  //
  // Strategy:
  //   • Expanding (collapsed → expanded): flip immediately so labels appear
  //     as the rail widens — anything else feels delayed.
  //   • Collapsing (expanded → collapsed): wait DEFER_MS so the rail visibly
  //     slides closed first, then swap the primitives inside an already-
  //     narrowed rail. CSS hides the labels + sub-list during this window
  //     (`group-data-[collapsible=icon]:hidden` + `size-8!`), so the user
  //     never sees the still-mounted Collapsible tree peeking through.
  const targetIconRail = state === "collapsed" && !isMobile
  const [iconRailCollapsed, setIconRailCollapsed] = React.useState(targetIconRail)
  React.useEffect(() => {
    if (!targetIconRail) {
      setIconRailCollapsed((prev) => (prev === false ? prev : false))
      return
    }
    // 200ms CSS transition + 20ms commit buffer.
    const t = setTimeout(() => setIconRailCollapsed(true), 220)
    return () => clearTimeout(t)
  }, [targetIconRail])
  // In the icon rail the parent icon is the ONLY visible thing for this item
  // (no sub-list, no labels) — so it must reflect "I'm somewhere inside this
  // section" by lighting up on any descendant route (e.g. `/library/all`),
  // not only on the parent URL itself. In the expanded view we keep the
  // parent neutral and let the active child row carry `data-active` (see
  // `isCollapsibleParentMenuButtonActive`).
  const iconRailActive = isAnyChildActive
  const triggerIcon =
    (iconRailCollapsed ? iconRailActive : parentMenuButtonActive) && item.iconActive
      ? item.iconActive
      : item.icon

  const navRouteKey = `${pathname}|${locationHash}|${isAnyChildActive}`
  const prevNavRouteKeyRef = React.useRef(navRouteKey)
  if (navRouteKey !== prevNavRouteKeyRef.current) {
    prevNavRouteKeyRef.current = navRouteKey
    setOpen(isAnyChildActive)
    setFlyoutOpen(false)
  }

  /** Expand parent when scope nav is open (desktop rail or flyout Main menu). */
  React.useEffect(() => {
    const scopePanelOpen =
      item.secondaryPanel != null && activePanel === item.secondaryPanel
    if (isAnyChildActive && (secondaryFlyoutHidden || scopePanelOpen)) {
      setOpen(true)
    }
  }, [secondaryFlyoutHidden, isAnyChildActive, activePanel, item.secondaryPanel])

  if (!item.children?.length) return null

  /** Icon rail: sub-list is hidden — open a flyout. Also avoids `CollapsibleTrigger asChild` on `SidebarMenuButton` with `tooltip` (extra `Tooltip` root breaks Radix `Slot`). */
  if (iconRailCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover
          open={flyoutOpen}
          onOpenChange={next => {
            setFlyoutOpen(next)
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  isActive={iconRailActive}
                  aria-current={iconRailActive ? "page" : undefined}
                  aria-haspopup="dialog"
                  aria-label={`${item.title} — open subpages`}
                >
                  <span
                    key={iconRailActive ? "active" : "idle"}
                    className={cn(
                      "size-4 shrink-0 flex items-center justify-center",
                      iconRailActive &&
                        "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                    )}
                    aria-hidden="true"
                  >
                    {triggerIcon}
                  </span>
                  <span className="sr-only">{item.title}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {item.title}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-64 p-1"
            side="right"
            align="start"
            sideOffset={8}
            aria-labelledby={flyoutTitleId}
          >
            <h2 id={flyoutTitleId} className="sr-only">
              {item.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {collectFlyoutLinks(item).map(({ parent: linkParent, child }) => {
                const childActive = isCollapsibleChildActive(pathname, linkParent, child, locationHash)
                return (
                  <li key={`${linkParent.key}-${child.key}`}>
                    <SidebarNavChildLink
                      parent={linkParent}
                      child={child}
                      pathname={pathname}
                      locationHash={locationHash}
                      onNavigate={() => setFlyoutOpen(false)}
                      linkClassName={cn(
                        "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none ring-ring",
                        "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2",
                        childActive && "bg-accent font-medium text-accent-foreground",
                      )}
                    />
                  </li>
                )
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={next => {
        setOpen(next)
      }}
      asChild
    >
      {/* `group/collapsible` lets descendant utilities react to the
          Radix `data-state` (e.g. chevron rotate, content slide). Radix's
          asChild merges the data-state onto this `<SidebarMenuItem>`. */}
      <SidebarMenuItem className="group/collapsible">
        <SidebarMenuButton
          asChild
          isActive={parentMenuButtonActive}
          tooltip={item.title}
        >
          <CollapsibleTrigger>
            <span
              key={parentMenuButtonActive ? "active" : "idle"}
              className={cn(
                "size-4 shrink-0 flex items-center justify-center",
                parentMenuButtonActive &&
                  "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
              )}
              aria-hidden="true"
            >
              {triggerIcon}
            </span>
            <SidebarNavLabel>{item.title}</SidebarNavLabel>
            <span
              className="ms-auto flex size-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <i
                className="fa-light fa-chevron-right text-xs text-current transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </CollapsibleTrigger>
        </SidebarMenuButton>
        {/* Slide the children open/closed using Radix's
            `--radix-collapsible-content-height` CSS variable. `overflow-hidden`
            is required so the height clip is visible during the animation.
            Keyframes defined in `app/globals.css` (`collapsible-down/up`). */}
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {item.children.map(child => {
              if (child.children?.length && child.children.length <= 40) {
                return (
                  <CollapsibleNavSubItem key={child.key} item={child} pathname={pathname} />
                )
              }

              return (
                <SidebarNavSubMenuRow
                  key={child.key}
                  parent={item}
                  child={child}
                  pathname={pathname}
                  locationHash={locationHash}
                />
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function NavLinkItems({ items, pathname }: { items: NavLinkItem[]; pathname: string }) {
  const { activePanel, openPanel, closePanel, secondaryFlyoutHidden, showSecondaryFlyout } =
    useSecondaryPanel()
  const { dismissNavFlyout } = useSidebar()
  const locationHash = useLocationHash()
  return (
    <>
      {items.map(item => {
        // Large child sets (>40) skip the collapsible/flyout pattern and navigate
        // to a full page instead — prevents overwhelming the sidebar.
        const childCount = item.children?.length ?? 0
        if (childCount > 0 && childCount <= 40) {
          return <CollapsibleNavItem key={item.key} item={item} pathname={pathname} />
        }

        const isActive = isNavActive(pathname, item.url, locationHash)
        const itemPath = navUrlPath(item.url)
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link
                to={item.url}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  item.badge !== undefined
                    ? `${item.title}, ${badgeAccessibleSuffix(item.badge)}`
                    : undefined
                }
                onClick={e => {
                  // Reopen the panel when the user clicks a panel-driving row
                  // while ALREADY on its route — react-router-dom `<Link>` does not
                  // navigate to the same URL, so without this the panel could
                  // stay closed (e.g. after the user collapsed it manually).
                  // On first click (different route), default navigation runs
                  // and the route's `useAutoPanel` opens the panel itself.
                  if (
                    item.secondaryPanel &&
                    itemPath &&
                    pathname === itemPath &&
                    !item.url.includes("#")
                  ) {
                    e.preventDefault()
                    if (
                      secondaryFlyoutHidden &&
                      activePanel === item.secondaryPanel
                    ) {
                      showSecondaryFlyout()
                    } else {
                      openPanel(item.secondaryPanel)
                    }
                  }
                  // Leaf navigation — close mobile / high-zoom flyout. Skip rows
                  // that open a drill-in stack so the user can pick a section item.
                  if (!item.drillIn && !item.secondaryPanel) {
                    dismissNavFlyout()
                  }
                  // Leaving a hub with a nested scope rail (Library) — drop panel state.
                  if (!item.secondaryPanel && activePanel) {
                    closePanel({ mainSidebar: "leave" })
                  }
                }}
              >
                <span
                  key={isActive ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    isActive &&
                      "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {isActive && item.iconActive ? item.iconActive : item.icon}
                </span>
                <SidebarNavLabel>{item.title}</SidebarNavLabel>
                {item.badge !== undefined ? (
                  <span className="ms-auto shrink-0" aria-hidden="true">
                    <NavItemBadgeContent badge={item.badge} />
                  </span>
                ) : null}
              </Link>
            </SidebarMenuButton>
            {item.badge !== undefined ? (
              /* Dot indicator — visible only when sidebar is collapsed */
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1 right-1 size-2 rounded-full hidden group-data-[collapsible=icon]:block",
                  typeof item.badge === "number" ? "bg-destructive"
                    : item.badge === "New" ? "bg-brand"
                    : item.badge === "Beta" ? "bg-[var(--insight-severity-warning)]"
                    : "bg-primary"
                )}
              />
            ) : null}
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

/** Expanded sidebar: Ask Leo (labeled) + Search / Notifications icon-only in one row. */
function SidebarQuickActions({ pathname }: { pathname: string }) {
  const { state, isMobile } = useSidebar()
  const mod = useModKeyLabel()
  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`
  const isOnLeoLanding = pathname === leoHref || pathname.startsWith(`${leoHref}/`)
  const askLeo = NAV_QUICK_ACTIONS.find((item) => item.opensAskLeo)
  const search = NAV_QUICK_ACTIONS.find((item) => item.opensCommandMenu)
  const notifications = NAV_QUICK_ACTIONS.find((item) => item.key === "notifications")

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarNavSecondaryItems
        items={NAV_QUICK_ACTIONS}
        pathname={pathname}
        iconOnly
      />
    )
  }

  if (!askLeo || !search || !notifications) {
    return <SidebarNavSecondaryItems items={NAV_QUICK_ACTIONS} pathname={pathname} />
  }

  const searchTooltip = (
    <span className="inline-flex items-center gap-1.5">
      Search
      <KbdGroup>
        <Kbd>{mod}</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </span>
  )

  return (
    <SidebarMenuItem>
      <div
        role="toolbar"
        aria-label="Quick actions"
        className="flex w-full min-w-0 items-center gap-0.5"
      >
        <SidebarMenuButton
          asChild
          isActive={isOnLeoLanding}
          tooltip={askLeo.title}
          className="min-h-8 min-w-0 flex-1 justify-start"
        >
          <Link to={leoHref} aria-current={isOnLeoLanding ? "page" : undefined}>
            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              {askLeo.icon}
            </span>
            <SidebarNavLabel>{askLeo.title}</SidebarNavLabel>
          </Link>
        </SidebarMenuButton>

        <SidebarMenuButton
          type="button"
          tooltip={searchTooltip}
          aria-label="Search"
          className="!size-8 !min-h-8 !max-h-8 !w-8 !min-w-8 !max-w-8 aspect-square shrink-0 justify-center gap-0 p-0"
          onClick={() => requestOpenCommandMenu()}
        >
          <span className="flex size-4 items-center justify-center" aria-hidden="true">
            {search.icon}
          </span>
        </SidebarMenuButton>
        <Shortcut keys={`${mod}K`} onInvoke={requestOpenCommandMenu} />

        <SidebarMenuButton
          asChild
          tooltip={notifications.title}
          aria-label="Notifications"
          className="!size-8 !min-h-8 !max-h-8 !w-8 !min-w-8 !max-w-8 aspect-square shrink-0 justify-center gap-0 p-0"
        >
          <Link to={notifications.url}>
            <span className="flex size-4 items-center justify-center" aria-hidden="true">
              {notifications.icon}
            </span>
          </Link>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  )
}

/** Utilities-style rows (⌘K, Ask Leo, Settings, …) — shared by quick actions + bottom group. */
function SidebarNavSecondaryItems({
  items,
  pathname,
  iconOnly = false,
}: {
  items: NavSecondaryItem[]
  pathname: string
  /** Collapsed icon rail — label + shortcut hints hidden. */
  iconOnly?: boolean
}) {
  const mod = useModKeyLabel()
  const locationHash = useLocationHash()
  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`
  // Active when on the Leo landing route for the current product (drop the
  // ⌘⌥K hint — that shortcut opens the side-panel Sheet, not the route; per
  // `exxat-kbd-shortcuts.mdc` Rule 1, Kbd hints must match the click action).
  const isOnLeoLanding = pathname === leoHref || pathname.startsWith(`${leoHref}/`)
  const { dismissNavFlyout } = useSidebar()
  return (
    <>
      {items.map((item) => {
        const pathOnly = navUrlPath(item.url)
        const linkActive =
          !item.opensCommandMenu &&
          !item.opensAskLeo &&
          Boolean(pathOnly) &&
          pathOnly !== "#" &&
          (item.key === "settings" || item.key === "site-configuration"
            ? pathname.endsWith("/settings") || pathname === "/settings/organization"
            : isNavActive(pathname, item.url, locationHash))

        return (
          <SidebarMenuItem key={item.key}>
            {item.opensCommandMenu ? (
              <SidebarMenuButton
                type="button"
                tooltip={item.title}
                isActive={false}
                onClick={() => requestOpenCommandMenu()}
              >
                <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                  {item.icon}
                </span>
                {!iconOnly ? <SidebarNavLabel>{item.title}</SidebarNavLabel> : null}
                {!iconOnly ? (
                  <KbdGroup className="ms-auto">
                    <Kbd>{mod}</Kbd>
                    <Kbd>K</Kbd>
                  </KbdGroup>
                ) : null}
              </SidebarMenuButton>
            ) : item.opensAskLeo ? (
              // Ask Leo is a route destination (per-product `/<slug>/leo`) —
              // the Sheet (`AskLeoSidebar`) remains the fast quick-ask path
              // for ⌘⌥K and inline KPI/chart triggers. See `views/leo.tsx`.
              <SidebarMenuButton asChild isActive={isOnLeoLanding} tooltip={item.title}>
                <Link
                  to={leoHref}
                  aria-current={isOnLeoLanding ? "page" : undefined}
                  onClick={() => dismissNavFlyout()}
                >
                  <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!iconOnly ? <SidebarNavLabel>{item.title}</SidebarNavLabel> : null}
                </Link>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild isActive={linkActive} tooltip={item.title}>
                <Link
                  to={item.url}
                  aria-current={linkActive ? "page" : undefined}
                  onClick={() => dismissNavFlyout()}
                >
                  <span
                    key={linkActive ? "active" : "idle"}
                    className={cn(
                      "size-4 shrink-0 flex items-center justify-center",
                      linkActive &&
                        "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                    )}
                    aria-hidden="true"
                  >
                    {linkActive && item.iconActive ? item.iconActive : item.icon}
                  </span>
                  {!iconOnly ? <SidebarNavLabel>{item.title}</SidebarNavLabel> : null}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TeamSwitcher — product-aware scope picker in the sidebar header
//
// Most products (Prism / One — Schools / Custom) operate in a
// **school > program** scope. **Exxat One — Sites** operates in a partner-
// facing **site > location** scope (per the product-context rule:
// `.cursor/rules/exxat-product-context.mdc`). Both flavors share the same
// chrome — avatar + two-line label + dropdown with a sub-view picker — so
// this component is parametrized over a small `scope` config and renders
// either flavor identically.
// ─────────────────────────────────────────────────────────────────────────────

interface ScopeParent { id: string; name: string; logo: string; initials: string }
interface ScopeChild  { id: string; name: string }

interface ScopeConfig {
  parents: ReadonlyArray<ScopeParent>
  defaultParent: ScopeParent
  defaultChild: ScopeChild
  /** Children belonging to a given parent in this scope. */
  childrenOf: (parent: ScopeParent) => ReadonlyArray<ScopeChild>
  /** Singular noun for the **child** scope ("Program", "Location"). */
  childNoun: string
  /** Singular noun for the **child** icon — Font Awesome glyph suffix. */
  childIcon: string
  /** Aria suffix for the trigger button ("Switch school or program", …). */
  ariaSuffix: string
  /** Sub-view label ("Select school", "Select site"). */
  parentSelectLabel: string
}

const SCHOOL_PROGRAM_SCOPE: ScopeConfig = {
  parents: NAV_SCHOOLS,
  defaultParent: NAV_SCHOOL_DEFAULT,
  defaultChild: NAV_PROGRAM_DEFAULT,
  childrenOf: (parent) => (parent as NavSchool).programs,
  childNoun: "Program",
  childIcon: "graduation-cap",
  ariaSuffix: "Switch school or program",
  parentSelectLabel: "Select school",
}

const SITE_LOCATION_SCOPE: ScopeConfig = {
  parents: NAV_SITES,
  defaultParent: NAV_SITE_DEFAULT,
  defaultChild: NAV_LOCATION_DEFAULT,
  childrenOf: (parent) => (parent as NavSite).locations,
  childNoun: "Location",
  childIcon: "location-dot",
  ariaSuffix: "Switch site or location",
  parentSelectLabel: "Select site",
}

function scopeConfigForProduct(product: Product): ScopeConfig {
  return product === "exxat-one-sites" ? SITE_LOCATION_SCOPE : SCHOOL_PROGRAM_SCOPE
}

function TeamSwitcher() {
  const { state, isMobile } = useSidebar()
  const { product } = useProduct()
  const scope = scopeConfigForProduct(product)

  // Each product has its own scope universe (NAV_SCHOOLS vs NAV_SITES). Keying
  // the inner state on `product` resets the picker to that product's defaults
  // when the user switches products via ProductLogoButton — and prevents stale
  // NavSchool state from rendering against NAV_SITES (or vice versa).
  return <TeamSwitcherInner key={product} scope={scope} state={state} isMobile={isMobile} />
}

function TeamSwitcherInner({
  scope,
  state,
  isMobile,
}: {
  scope: ScopeConfig
  state: "expanded" | "collapsed"
  isMobile: boolean
}) {
  const [parent,  setParent]  = React.useState<ScopeParent>(scope.defaultParent)
  const [child,   setChild]   = React.useState<ScopeChild>(scope.defaultChild)
  const [subView, setSubView] = React.useState<"main" | "parents">("main")

  function switchParent(p: ScopeParent) {
    setParent(p)
    const firstChild = scope.childrenOf(p)[0]
    if (firstChild) setChild(firstChild)
    setSubView("main")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
    <DropdownMenu onOpenChange={(open) => { if (!open) setSubView("main") }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`${parent.name} · ${child.name}. ${scope.ariaSuffix}`}
              className={cn(
                "py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                /* `size=lg` is `h-12` + `overflow-hidden` — two lines + avatar need more height */
                (state === "expanded" || isMobile) &&
                  "h-auto min-h-12 !overflow-visible items-center [&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:text-clip",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                /* Icon rail: default is `size-8` + `p-2` (~16px inner) — clips 32px avatars; center logo without chevron */
                "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
            >
              <Avatar
                className={cn(
                  "size-8 shrink-0",
                  /* Icon rail: same 36px frame as product mark + header button */
                  "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                )}
              >
                <AvatarImage
                  src={parent.logo}
                  alt=""
                  referrerPolicy="origin"
                  className="object-contain p-1 group-data-[collapsible=icon]:p-0.5"
                />
                <AvatarFallback className="text-xs font-bold bg-secondary text-secondary-foreground">
                  {parent.initials}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "grid min-w-0 flex-1 content-center text-start text-sm leading-snug",
                  "group-data-[collapsible=icon]:hidden",
                )}
              >
                <span className="break-words font-medium whitespace-normal">{child.name}</span>
                <span className="break-words text-xs text-muted-foreground whitespace-normal">
                  {parent.name}
                </span>
              </div>
              {(state === "expanded" || isMobile) && (
                <span
                  className="ms-auto flex w-6 shrink-0 self-stretch items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <i className="fa-light fa-chevron-down block text-xs leading-none" aria-hidden="true" />
                </span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {child.name} · {parent.name}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className="!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]"
        align="start"
        side="right"
        sideOffset={8}
      >
        {subView === "main" ? (
          <>
            {/* Selected parent — click to switch parent */}
            <div className="p-1">
              <button
                type="button"
                onClick={() => setSubView("parents")}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors",
                  "hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage
                    src={parent.logo}
                    alt=""
                    referrerPolicy="origin"
                    className="object-contain p-0.5"
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {parent.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                    {scope.childNoun}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug">
                    {child.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{parent.name}</p>
                </div>
                <span className="shrink-0 pt-0.5 text-xs font-medium text-brand">Change</span>
              </button>
            </div>

            <DropdownMenuSeparator />

            {/* Children of the selected parent */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{scope.childNoun}</DropdownMenuLabel>
            {scope.childrenOf(parent).map(c => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setChild(c)}
                className="items-start py-2"
              >
                <i className={`fa-light fa-${scope.childIcon} mt-0.5 shrink-0 text-[13px]`} aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words whitespace-normal">{c.name}</span>
                {c.id === child.id && (
                  <i className="fa-solid fa-check ms-1 shrink-0 text-brand text-xs mt-0.5" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            {/* Back + parent list */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSubView("main") }}>
              <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
              <span>Back</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">{scope.parentSelectLabel}</DropdownMenuLabel>
            {scope.parents.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => switchParent(p)}
                className="items-start py-2"
              >
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  <AvatarImage src={p.logo} alt="" referrerPolicy="origin" />
                  <AvatarFallback className="text-xs font-semibold">
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 break-words whitespace-normal">{p.name}</span>
                {p.id === parent.id && (
                  <i className="fa-solid fa-check ms-1 shrink-0 text-brand text-xs mt-0.5" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product logo (header) — expanded: full `ExxatProductLogo` + chevron; collapsed: `ExxatProductMark`
// only (32×32 like school Avatar), no chevron.
// ─────────────────────────────────────────────────────────────────────────────

// Exxat One ships as **two siblings** — see
// `apps/web/docs/multi-product-routing-pattern.md`. `scope` carries the
// disambiguator ("Schools" / "Sites") that the dropdown renders next to the
// shared "Exxat One" wordmark; `label` is the full accessible name used
// in `aria-label` and the collapsed-rail tooltip.

function ProductLogoButton() {
  const { product, customProducts, activeCustomIndex, hiddenProducts } = useProduct()
  const switchProduct = useProductSwitch()
  const { state, isMobile } = useSidebar()
  const products = React.useMemo(
    () => expandSwitcherProducts(customProducts, hiddenProducts),
    [customProducts, hiddenProducts],
  )
  const isCurrentProduct = React.useCallback(
    (entry: SwitcherProductEntry) =>
      entry.id === product &&
      (entry.customIndex === undefined || entry.customIndex === activeCustomIndex),
    [activeCustomIndex, product],
  )
  const current = resolveActiveSwitcherEntry(
    products,
    product,
    activeCustomIndex,
    customProducts,
    isCurrentProduct,
  )
  const iconRail = state === "collapsed" && !isMobile
  const expandedOrMobile = state === "expanded" || isMobile

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                expandedOrMobile &&
                  "h-auto min-h-12 !overflow-visible items-center [&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:text-clip",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                iconRail &&
                  "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!max-h-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
              aria-label={`Current product: ${current.label}. Switch product`}
              suppressHydrationWarning
            >
              {iconRail ? (
                // Match the school selector footprint in the icon rail (32px frame,
                // 28px mark — same visual weight as the avatar with inset padding).
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    previewCustomBrand={
                      current.customIndex !== undefined
                        ? customProducts[current.customIndex]
                        : undefined
                    }
                    className="size-7"
                  />
                </span>
              ) : (
                <span className="flex min-h-0 min-w-0 flex-1 items-center gap-2">
                  {/* Adaptive product lock-up. The `"sidebar"` variant runs
                      the A → B1 → B2 cascade based on the wordmark area's
                      width — full wordmark inline, suffix-only on one line,
                      or wrapped suffix up to 2 lines. Mark is always
                      visible. Scope chip is intentionally NOT rendered here
                      (Exxat One — Schools / Sites read identically in the
                      sidebar; the dropdown rows still show scope to
                      distinguish them). */}
                  <ExxatProductLogo
                    product={current.id}
                    variant="sidebar"
                    previewCustomBrand={
                      current.customIndex !== undefined
                        ? customProducts[current.customIndex]
                        : undefined
                    }
                    className="min-w-0 flex-1"
                  />
                  <span
                    className="flex w-6 shrink-0 items-center justify-center self-center text-muted-foreground"
                    aria-hidden="true"
                  >
                    <i
                      className="fa-light fa-chevron-down block text-xs leading-none"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {/* Tooltip fires in both states. In the collapsed rail it's the only
            way to discover the product name; in the expanded rail it's the
            wrap affordance for Lock-up B2 (when the suffix needs to wrap to
            2 lines, hover/focus surfaces the full `current.label` including
            the scope qualifier). */}
        <TooltipContent side="right" align="center">
          {current.label}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" side="right" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {products.map(p => (
          <DropdownMenuItem
            key={p.customIndex !== undefined ? `${p.id}-${p.customIndex}` : p.id}
            onClick={() => switchProduct(p.id, p.customIndex)}
            className="gap-2 py-2"
            aria-selected={isCurrentProduct(p)}
            aria-label={p.label}
          >
            {/* Same adaptive lock-up as the trigger; the dropdown row is
                wider, so the cascade settles to Lock-up A in the typical
                case and only steps down for very long custom suffixes. */}
            <ExxatProductLogo
              product={p.id}
              variant="sidebar"
              previewCustomBrand={
                p.customIndex !== undefined ? customProducts[p.customIndex] : undefined
              }
              className="min-w-0 flex-1"
            />
            {p.scope && (
              <span
                className="shrink-0 text-xs font-medium text-muted-foreground"
                aria-hidden="true"
              >
                — {p.scope}
              </span>
            )}
            {isCurrentProduct(p) && (
              <i className="fa-solid fa-check ms-auto text-brand text-xs" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AppSidebar
// ─────────────────────────────────────────────────────────────────────────────

/** Light header entrance — Motion (Animate UI–style open distribution: animate-ui.com/docs). */
function SidebarHeaderStack({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="flex flex-col"
      initial={reduceMotion ? false : { opacity: 0.88, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : motionHeaderEnter}
    >
      {children}
    </motion.div>
  )
}

/** Drilled-in section's nav rows — rendered inside `SidebarDrillIn`.
 *
 *  Active state uses **exact path + search compare** rather than the shared
 *  `isNavActive` prefix matcher because drilled-in items routinely share a
 *  pathname and disambiguate via `?param=value` (Tokens categories all live
 *  at `/tokens-themes` and pivot on `?category=…`). Prefix matching would
 *  light up every category row at once. Two items with distinct paths
 *  (e.g. `/settings/profile` vs `/settings/organization`) also work
 *  correctly because the search is `""` on both sides. */
function SidebarDrillInItems({
  items,
  pathname,
}: {
  items: NavLinkItem[]
  pathname: string
}) {
  const locationSearch = useLocation().search
  const currentHref = `${pathname}${locationSearch}`
  const { dismissNavFlyout } = useSidebar()
  const { activePanel, closePanel } = useSecondaryPanel()
  return (
    <SidebarMenu className="gap-0.5">
      {items.map(item => {
        const isActive = item.url === currentHref
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link
                to={item.url}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  dismissNavFlyout()
                  if (activePanel) {
                    closePanel({ mainSidebar: "leave" })
                  }
                }}
              >
                <span
                  key={isActive ? "active" : "idle"}
                  className={cn(
                    "size-4 shrink-0 flex items-center justify-center",
                    isActive &&
                      "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
                  )}
                  aria-hidden="true"
                >
                  {isActive && item.iconActive ? item.iconActive : item.icon}
                </span>
                <SidebarNavLabel>{item.title}</SidebarNavLabel>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

/** Type-narrowing helper: returns the nav row IFF it carries a `drillIn`
 *  config whose `sectionRouteRoot` (or `sectionRouteMatch` override)
 *  matches the current pathname. */
function findActiveDrillInSection(
  rows: ReadonlyArray<NavLinkItem | NavSecondaryItem>,
  pathname: string,
): (NavLinkItem | NavSecondaryItem) & { drillIn: NavDrillInConfig } | undefined {
  for (const row of rows) {
    if (!row.drillIn) continue
    const match = row.drillIn.sectionRouteMatch
      ? row.drillIn.sectionRouteMatch(pathname)
      : pathname.startsWith(row.drillIn.sectionRouteRoot)
    if (match) {
      return row as (NavLinkItem | NavSecondaryItem) & { drillIn: NavDrillInConfig }
    }
  }
  return undefined
}

function NavPrimaryPreamble({
  items,
  pathname,
}: {
  items: NavLinkItem[]
  pathname: string
}) {
  if (items.length === 0) return null
  return <NavLinkItems items={items} pathname={pathname} />
}

function NavPrimaryEpilogue({
  items,
  pathname,
}: {
  items: NavLinkItem[]
  pathname: string
}) {
  if (items.length === 0) return null
  return (
    <SidebarGroup className="py-2 pt-0" role="group" aria-label="Primary">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          <NavLinkItems items={items} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function NavPrimarySectionGroup({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string
}) {
  return (
    <SidebarGroup
      className="py-0 pt-0"
      role="group"
      aria-label={section.label.trim() || "Primary navigation"}
    >
      {section.label.trim() ? (
        <SidebarGroupLabel
          className="text-xs font-medium uppercase tracking-wide px-2 text-sidebar-section-label"
          suppressHydrationWarning
        >
          {section.label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          <NavLinkItems items={section.items} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const { isMobile, open, setOpen } = useSidebar()
  const reflowZoom = useSidebarReflowZoom()
  const { product, customProducts, activeCustomIndex } = useProduct()
  // Per Rule 5 of the multi-product routing pattern: each product registers
  // its own primary nav. AppSidebar selects from the registry based on the
  // active product so switching products swaps the entire primary tree.
  const primaryNav = getPrimaryNavForProduct(product, customProducts, activeCustomIndex)
  const primaryNavLayout = getPrimaryNavLayoutForProduct(
    product,
    customProducts,
    activeCustomIndex,
  )
  const secondaryNav = getSecondaryNavForProduct(product)

  // Feed custom-product nav URLs into the active-state helper so links like
  // `/<custom-slug>/dashboard` actually win the longest-prefix match. The
  // sync is idempotent on URL signature, so re-renders without a real
  // change are a no-op.
  React.useMemo(() => {
    const extras: string[] = []
    for (const cp of customProducts) {
      const slug = customProductSlugFromSuffix(cp.suffix)
      const nav = primaryNavLinksForSlug(slug)
      if (!nav?.length) continue
      extras.push(...collectNavUrls(nav))
    }
    syncCustomNavUrls(extras)
  }, [customProducts])

  // Drill-in detection. The URL is the source of truth — any nav row in
  // primary / documents / footer that carries a `drillIn` config + matches
  // the current pathname swaps the sidebar content area to a stacked
  // `[← Back] · <sectionTitle> · <items>` view via the `SidebarDrillIn`
  // primitive.
  //
  // Today only Tokens opts in (in `NAV_DOCUMENTS`); the search covers
  // every array so future drill-in sections work without changing this file.
  const drillInSection = React.useMemo(
    () => findActiveDrillInSection(
      // NAV_QUICK_ACTIONS includes the Ask Leo row which carries its own
      // drill-in for `/<product>/leo` — search it alongside the existing
      // primary / documents / footer arrays so the Leo drill-in fires.
      [...NAV_QUICK_ACTIONS, ...primaryNav, ...NAV_DOCUMENTS, ...secondaryNav],
      pathname,
    ),
    [primaryNav, pathname, secondaryNav],
  )
  const isDrilledIn = Boolean(drillInSection)
  const isLeoDrillIn = drillInSection?.key === "ask-leo"
  const navFlyout = isMobile || reflowZoom

  const handleDrillInNavFlyoutToggle = React.useCallback((): boolean => {
    if (!navFlyout || !isDrilledIn) return false
    setOpen((current) => !current, { persist: false })
    return true
  }, [navFlyout, isDrilledIn, setOpen])

  useRegisterNavFlyoutToggle(handleDrillInNavFlyoutToggle)

  const productDashboardHref = `/${productSlug(product)}/dashboard`
  const handleDrillInBack = React.useCallback(() => {
    navigate(productDashboardHref)
  }, [navigate, productDashboardHref])

  // Incidental sidebar state while drilled in — same contract as
  // `SidebarAutoCollapse`: visual only (`persist: false`), restore pre-visit
  // state on leave. Leo keeps the rail expanded so the recents drill-in is
  // visible by default; Tokens/Settings use the same expanded rail pattern.
  const openRef = React.useRef(open)
  openRef.current = open
  const setOpenRef = React.useRef(setOpen)
  setOpenRef.current = setOpen
  const savedOpenRef = React.useRef<boolean | null>(null)

  React.useEffect(() => {
    const rememberCurrentOpen = () => {
      if (savedOpenRef.current === null) {
        savedOpenRef.current = openRef.current
      }
    }

    if (isLeoDrillIn) {
      rememberCurrentOpen()
      setOpenRef.current(true, { persist: false })
      return
    }
    if (isDrilledIn) {
      rememberCurrentOpen()
      setOpenRef.current(true, { persist: false })
      return
    }
    if (savedOpenRef.current !== null) {
      setOpenRef.current(savedOpenRef.current, { persist: false })
      savedOpenRef.current = null
    }
  }, [isDrilledIn, isLeoDrillIn])

  return (
    <Sidebar collapsible="icon" className={cn("pt-1", className)} {...props}>
      {/*
        Single scroll column: primary rail + footer (Settings, Help, profile) scroll
        together when the nav overflows. High zoom / very short viewport
        (`useSidebarReflowZoom`): scroll moves to <nav> for WCAG 1.4.10 reflow.
      */}
      <nav
        aria-label="Application"
        data-exxat-sidebar="application-nav"
        data-reflow-zoom={reflowZoom ? "true" : "false"}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          reflowZoom && "overflow-y-auto",
        )}
      >
        <SidebarContent
          className={cn(
            "gap-0",
            reflowZoom && "!flex-none !overflow-visible",
          )}
        >
          <SidebarDrillIn
            open={isDrilledIn}
            sectionTitle={drillInSection?.drillIn.sectionTitle ?? ""}
            onBack={handleDrillInBack}
            baseContent={
              <>
                <SidebarHeader className="border-b border-sidebar-border px-2 pb-2 pt-0">
                  {/* Mobile / high-zoom flyout: visible close button — WCAG 2.1.1 Keyboard */}
                  {(isMobile || reflowZoom) && (
                    <div className="flex items-center justify-end px-1 pt-0.5">
                      <Tip label="Close navigation" side="bottom">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Close navigation"
                          onClick={() => setOpen(false)}
                        >
                          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
                        </Button>
                      </Tip>
                    </div>
                  )}
                  <SidebarHeaderStack>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <ProductLogoButton />
                      </SidebarMenuItem>
                    </SidebarMenu>
                    <div className="flex w-full justify-center px-2">
                      <Separator
                        orientation="horizontal"
                        decorative
                        className="my-1.5 h-px w-full max-w-none shrink-0 bg-sidebar-border group-data-[collapsible=icon]:w-8"
                      />
                    </div>
                    <TeamSwitcher />
                  </SidebarHeaderStack>
                </SidebarHeader>

                <SidebarGroup className="py-2" role="group" aria-label="Primary">
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      <SidebarQuickActions pathname={pathname} />
                      <NavPrimaryPreamble items={primaryNavLayout.preamble} pathname={pathname} />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {primaryNavLayout.sections.map(section => (
                  <NavPrimarySectionGroup
                    key={section.key}
                    section={section}
                    pathname={pathname}
                  />
                ))}

                <NavPrimaryEpilogue items={primaryNavLayout.epilogue ?? []} pathname={pathname} />
              </>
            }
          >
            {drillInSection ? (
              isLeoDrillIn ? (
                // Leo's drill-in is a custom panel (search + new chat +
                // recents list) — the `drillIn.items` array is unused.
                <LeoSidebarDrillInPanel />
              ) : (
                <SidebarDrillInItems
                  items={drillInSection.drillIn.items}
                  pathname={pathname}
                />
              )
            ) : null}
          </SidebarDrillIn>

          {/* Esc + Cmd/Ctrl+[ exit the drilled-in view. Bound only while
              drilled in so the chords don't shadow anything else app-wide.
              `useShortcut` already skips inputs/textareas/contenteditable
              and open dialogs, so Esc closes a Dialog first if one is up. */}
          {isDrilledIn && (
            <>
              <Shortcut keys="Escape" onInvoke={handleDrillInBack} />
              <Shortcut keys="Cmd+[" onInvoke={handleDrillInBack} />
              <Shortcut keys="Ctrl+[" onInvoke={handleDrillInBack} />
            </>
          )}

          {/* Settings + Help + profile — scroll with the rail (not pinned). Hidden
              while drilled in so the section stack owns the full sidebar height. */}
          {!isDrilledIn && (
            <SidebarFooter className="shrink-0 border-t border-sidebar-border bg-sidebar">
              <SidebarGroup className="py-2" role="group" aria-label="Utilities">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    <SidebarNavSecondaryItems items={secondaryNav} pathname={pathname} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <NavUser user={NAV_USER} />
            </SidebarFooter>
          )}
        </SidebarContent>
      </nav>
    </Sidebar>
  )
}
