"use client"

import * as React from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useSecondaryPanel } from "@/components/sidebar"
import {
  currentLibraryBasePath,
  LIBRARY_HUB_FIND_PATH,
  LIBRARY_ALL_PATH,
  LIBRARY_LIST_PATH,
  libraryRouteHref,
  normalizeLibraryPathname,
} from "@/lib/library-nav"

function rewriteLibraryCanonicalToDedicatedSurface(pathname: string, nextHref: string, hash: string): string {
  const normalizedPathname = normalizeLibraryPathname(pathname)
  const normalizedNextHref = normalizeLibraryPathname(nextHref)
  const basePath = currentLibraryBasePath(pathname)
  if (!normalizedNextHref.startsWith(LIBRARY_ALL_PATH)) return `${nextHref}${hash}`
  const tail = normalizedNextHref.slice(LIBRARY_ALL_PATH.length)
  if (normalizedPathname === LIBRARY_LIST_PATH) return `${libraryRouteHref(LIBRARY_LIST_PATH, basePath)}${tail}${hash}`
  if (normalizedPathname === LIBRARY_HUB_FIND_PATH) return `${libraryRouteHref(LIBRARY_HUB_FIND_PATH, basePath)}${tail}${hash}`
  return `${nextHref}${hash}`
}

function librarySearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const k of keys) {
    const av = a.getAll(k).join("\u0000")
    const bv = b.getAll(k).join("\u0000")
    if (av !== bv) return false
  }
  return true
}

export interface UseSecondaryPanelHubNavOptions<TNav> {
  /** Primary hub pathname (e.g. `/library/all`). */
  hubPathname: string
  /** When set, these pathnames are treated as the same hub (e.g. library + list search surface). */
  hubPathnames?: readonly string[]
  /** `PANELS` / `useAutoPanel` id (e.g. `library`). */
  panelId: string
  parseNav: (searchParams: URLSearchParams) => TNav
  /** When non-null, the hub URL is rewritten (keeps the current hash). */
  canonicalHref?: (searchParams: URLSearchParams) => string | null
  /** Re-open the secondary panel when the user returns to the default scope (e.g. All questions). */
  shouldReopenPanel?: (nav: TNav) => boolean
  /**
   * When set, auto-reopen only runs on these pathnames (e.g. library hub, not dedicated search landings).
   * Omit to keep legacy behavior: any {@link hubPathnames} match may reopen the panel.
   */
  reopenPanelOnPathnames?: readonly string[]
}

/**
 * URL scope for a primary hub with a nested secondary panel — shared between panel nav and main content.
 */
export function useSecondaryPanelHubNav<TNav>({
  hubPathname,
  hubPathnames,
  panelId,
  parseNav,
  canonicalHref,
  shouldReopenPanel,
  reopenPanelOnPathnames,
}: UseSecondaryPanelHubNavOptions<TNav>) {
  const actualPathname = useLocation().pathname
  const pathname = normalizeLibraryPathname(actualPathname)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { openPanel, activePanel } = useSecondaryPanel()

  const hubPaths = React.useMemo(
    () => (hubPathnames?.length ? [...hubPathnames] : [hubPathname]),
    [hubPathname, hubPathnames],
  )
  const isHubPath = hubPaths.includes(pathname)
  const libraryBasePath = currentLibraryBasePath(actualPathname)
  const hubBasePath = isHubPath ? actualPathname : libraryRouteHref(hubPathname, libraryBasePath)

  const searchParamsKey = searchParams.toString()
  const navState = React.useMemo(
    () => parseNav(new URLSearchParams(searchParamsKey)),
    [parseNav, searchParamsKey],
  )

  React.useEffect(() => {
    if (!isHubPath || !canonicalHref) return
    const nextHref = canonicalHref(new URLSearchParams(searchParamsKey))
    if (!nextHref) return
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const basePath = currentLibraryBasePath(actualPathname)
    let target = `${libraryRouteHref(nextHref, basePath)}${hash}`
    if (pathname === LIBRARY_LIST_PATH || pathname === LIBRARY_HUB_FIND_PATH) {
      target = rewriteLibraryCanonicalToDedicatedSurface(actualPathname, nextHref, hash)
    }
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
      const u = new URL(target, origin)
      const want = u.searchParams
      const cur = new URLSearchParams(searchParamsKey)
      if (u.pathname === actualPathname && librarySearchParamsEqual(want, cur)) return
    } catch {
      /* ignore parse errors — fall through to replace */
    }
    navigate(target, { replace: true })
  }, [actualPathname, canonicalHref, isHubPath, pathname, navigate, searchParamsKey])

  React.useEffect(() => {
    if (!isHubPath || !shouldReopenPanel?.(navState)) return
    if (reopenPanelOnPathnames?.length && !reopenPanelOnPathnames.includes(pathname)) return
    if (activePanel === panelId) return
    openPanel(panelId)
  }, [
    activePanel,
    isHubPath,
    navState,
    openPanel,
    panelId,
    pathname,
    reopenPanelOnPathnames,
    shouldReopenPanel,
  ])

  return {
    navState,
    searchParamsKey,
    hubPathname,
    hubBasePath,
    pathname,
    actualPathname,
    libraryBasePath,
    isHubPath,
  }
}
