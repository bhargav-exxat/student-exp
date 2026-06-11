/**
 * Library secondary nav + URL scope — demo “My” matches mock author rows.
 */

import type { LibraryItem } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { collectFolderDescendantIds } from "@/lib/mock/library-folders"

/** Demo curator — “My items” filters `author` / `createdBy` to this value. */
export const LIBRARY_NAV_MY_AUTHOR = "Owner A"

export type LibraryNavScope = "all" | "my" | "folder"

export interface LibraryNavState {
  scope: LibraryNavScope
  /** Set when `scope === "folder"` */
  folderId: string | null
}

export const LIBRARY_ENTRY_PATH = "/library"
const PRODUCT_LIBRARY_PATH_RE = /^\/[^/]+\/library(?=\/|$)/

export function normalizeLibraryPathname(pathname: string): string {
  return pathname.replace(PRODUCT_LIBRARY_PATH_RE, LIBRARY_ENTRY_PATH)
}

export function currentLibraryBasePath(pathname?: string): string {
  const current =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : LIBRARY_ENTRY_PATH)
  const match = current.match(PRODUCT_LIBRARY_PATH_RE)
  return match?.[0] ?? LIBRARY_ENTRY_PATH
}

export function libraryRouteHref(pathname: string, basePath = currentLibraryBasePath()): string {
  return pathname.replace(LIBRARY_ENTRY_PATH, basePath)
}

/** Breadcrumb segment for the discovery hub — links from library / search shells back to `/library`. */
export const LIBRARY_HUB_BREADCRUMB = {
  label: "Library",
  href: LIBRARY_ENTRY_PATH,
} as const

/** List hub with secondary nav, views, and table state. */
export const LIBRARY_ALL_PATH = "/library/all"

/**
 * Same hub as the library (table + panel + tree) but intended for search landings (`?q=`).
 * Keeps secondary panel + nav behavior aligned with {@link LIBRARY_ALL_PATH}.
 */
export const LIBRARY_LIST_PATH = "/library/list"

/**
 * Results from the discovery hub composer — same table stack as {@link LIBRARY_LIST_PATH} but a
 * distinct URL so library “Search” and hub-driven search are not conflated.
 */
export const LIBRARY_HUB_FIND_PATH = "/library/find"

/** @deprecated Use `LIBRARY_ALL_PATH` for scoped library routes. */
export const LIBRARY_HUB_PATH = LIBRARY_ALL_PATH

export const LIBRARY_LIBRARY_HUB_PATHS: readonly string[] = [
  LIBRARY_ALL_PATH,
  LIBRARY_LIST_PATH,
  LIBRARY_HUB_FIND_PATH,
]

/** Library list search (`/list`) or hub discovery search (`/find`) — both use the dedicated search shell. */
export function isLibraryDedicatedSearchPathname(pathname: string): boolean {
  const p = normalizeLibraryPathname(pathname)
  return p === LIBRARY_LIST_PATH || p === LIBRARY_HUB_FIND_PATH
}

/**
 * Whether a secondary-nav row (All / My / folder / Search) matches the current URL + parsed nav.
 * Used by `LibrarySecondaryNav` and the folder tree branch.
 */
export function isLibraryNavActive(
  pathname: string,
  nav: LibraryNavState,
  scope: LibraryNavScope,
  folderId?: string | null,
  folders?: readonly LibraryFolder[],
): boolean {
  const normalized = normalizeLibraryPathname(pathname)
  const p = normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized
  if (!LIBRARY_LIBRARY_HUB_PATHS.includes(p)) return false
  if (isLibraryDedicatedSearchPathname(pathname)) return false
  const resolved = folders ? coerceLibraryNav(nav, folders) : nav
  if (scope === "all") {
    return resolved.scope === "all"
  }
  if (scope === "my") {
    return resolved.scope === "my"
  }
  if (scope === "folder" && folderId) {
    return resolved.scope === "folder" && resolved.folderId === folderId
  }
  return false
}

/** Default secondary-nav selection — All questions (no `scope` query). */
export const LIBRARY_DEFAULT_NAV: LibraryNavState = {
  scope: "all",
  folderId: null,
}

export function isLibraryDefaultNav(nav: LibraryNavState): boolean {
  return nav.scope === "all" && nav.folderId === null
}

/** Primary nav child key — opens `/library/all` + secondary panel (not “All questions” scope). */
export const LIBRARY_PRIMARY_LIST_NAV_KEY = "library-all"

/** Primary “Library” row — active on `/library/all` regardless of `?scope=`. */
export function isLibraryPrimaryListNavActive(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  return normalizeLibraryPathname(normalized) === LIBRARY_ALL_PATH
}

/** List hub route that mounts the library secondary panel (`All questions` scope nav). */
export function isLibrarySecondaryPanelRoute(pathname: string): boolean {
  return isLibraryPrimaryListNavActive(pathname)
}

/** Whether the current URL is under a product's `/library` segment. */
export function isLibraryProductPath(pathname: string): boolean {
  return PRODUCT_LIBRARY_PATH_RE.test(pathname)
}

const LIBRARY_FOCUSED_FLOW_PATHS: readonly string[] = ["/library/new"]

/** Full-page flows under `/library/*` that suppress the scope rail. */
export function isLibraryFocusedFlowPath(pathname: string): boolean {
  const normalized = normalizeLibraryPathname(pathname)
  return LIBRARY_FOCUSED_FLOW_PATHS.some(
    p => normalized === p || normalized.startsWith(`${p}/`),
  )
}

/**
 * Whether the library secondary panel should stay open — mirrors
 * `src/views/library/_layout.tsx` so route changes cannot leave the rail stuck.
 */
export function shouldLibrarySecondaryPanelBeOpen(pathname: string): boolean {
  if (!isLibraryProductPath(pathname)) return false
  const normalized = normalizeLibraryPathname(pathname)
  if (normalized === LIBRARY_ENTRY_PATH || normalized === `${LIBRARY_ENTRY_PATH}/`) {
    return false
  }
  if (isLibraryDedicatedSearchPathname(pathname)) return false
  if (isLibraryFocusedFlowPath(pathname)) return false
  return true
}

/**
 * Secondary panel “All questions” row — active when URL scope is `all` (not `my` / folder).
 */
export function isLibraryAllQuestionsScopeActive(
  pathname: string,
  search: string,
  folders?: readonly LibraryFolder[],
): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  const hubPath = normalizeLibraryPathname(normalized)
  if (!LIBRARY_LIBRARY_HUB_PATHS.includes(hubPath)) return false
  if (isLibraryDedicatedSearchPathname(pathname)) return false
  const nav = coerceLibraryNav(parseLibraryNav(new URLSearchParams(search)), folders ?? [])
  return nav.scope === "all"
}

export function libraryNavStatesEqual(a: LibraryNavState, b: LibraryNavState): boolean {
  return a.scope === b.scope && a.folderId === b.folderId
}

/** Coerce URL nav to a row that exists in the secondary panel (defaults to All questions). */
export function coerceLibraryNav(
  nav: LibraryNavState,
  folders: readonly LibraryFolder[],
): LibraryNavState {
  if (nav.scope === "all") return { ...LIBRARY_DEFAULT_NAV }
  if (nav.scope === "my") return { scope: "my", folderId: null }
  if (nav.scope === "folder") {
    if (!nav.folderId) return { ...LIBRARY_DEFAULT_NAV }
    if (!folders.some(f => f.id === nav.folderId)) return { ...LIBRARY_DEFAULT_NAV }
    return { scope: "folder", folderId: nav.folderId }
  }
  return { ...LIBRARY_DEFAULT_NAV }
}

export function parseLibraryNav(searchParams: URLSearchParams): LibraryNavState {
  const raw = (searchParams.get("scope") ?? "all").toLowerCase()
  if (raw === "my") return { scope: "my", folderId: null }
  if (raw === "folder") {
    const rawId = searchParams.get("folderId") ?? searchParams.get("folder")
    const folderId = typeof rawId === "string" ? rawId.trim() || null : null
    return { scope: "folder", folderId }
  }
  if (raw === "all") return { ...LIBRARY_DEFAULT_NAV }
  return { ...LIBRARY_DEFAULT_NAV }
}

/** Rewrite invalid or incomplete scope URLs back to the default All questions hub. Preserves list search params when present. */
export function libraryCanonicalNavHref(
  searchParams: URLSearchParams,
  folders?: readonly LibraryFolder[],
): string | null {
  const q = searchParams.get("q")?.trim() || null
  const fav = searchParams.get("fav") === "1"
  const deckClinical = searchParams.get("deck") === "clinical"
  const preserved = {
    q,
    ...(fav ? { fav: true as const } : {}),
    ...(deckClinical ? { deck: "clinical" as const } : {}),
  }

  const parsed = parseLibraryNav(searchParams)
  if (folders) {
    const coerced = coerceLibraryNav(parsed, folders)
    if (!libraryNavStatesEqual(parsed, coerced)) {
      return libraryNavHref({
        scope: coerced.scope,
        folderId: coerced.folderId,
        ...preserved,
      })
    }
  }

  const raw = searchParams.get("scope")
  if (!raw) return null
  const lowered = raw.toLowerCase()
  if (lowered === "my") return null
  if (lowered === "folder") {
    const folderId = searchParams.get("folderId") ?? searchParams.get("folder")
    return folderId ? null : libraryNavHref({ scope: "all", ...preserved })
  }
  if (lowered === "all") return null
  return libraryNavHref({ scope: "all", ...preserved })
}

/** Breadcrumb + title for `SiteHeader` / `PageHeader` (matches secondary nav scopes). */
export interface LibraryHubHeaderModel {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

/** Back link for `/library/new` — icon + parent label in `SiteHeader` (`back` prop). */
export function newQuestionBackNav(
  folders: LibraryFolder[],
  folderId?: string,
): { label: string; href: string } {
  if (folderId) {
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      return {
        label: folder.name,
        href: libraryNavHref({ scope: "folder", folderId: folder.id }),
      }
    }
  }
  return {
    label: LIBRARY_HUB_BREADCRUMB.label,
    href: libraryNavHref({ scope: "all" }),
  }
}

/** Ancestor-only breadcrumbs for `/library/new` (current page is the PageHeader title). */
export function newQuestionBreadcrumbs(
  folders: LibraryFolder[],
  folderId?: string,
): { label: string; href: string }[] {
  if (folderId) {
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      return [
        {
          label: folder.name,
          href: libraryNavHref({ scope: "folder", folderId: folder.id }),
        },
      ]
    }
  }
  return [
    {
      label: LIBRARY_HUB_BREADCRUMB.label,
      href: LIBRARY_HUB_BREADCRUMB.href,
    },
  ]
}

/**
 * Split mock course folder labels (`PT 501 — Foundational Sciences`) for hub headers.
 * Breadcrumb / `SiteHeader` keep the full string; `PageHeader` shows code in subtitle.
 */
export function splitLibraryCourseFolderTitle(full: string): {
  courseCode?: string
  title: string
} {
  const match = full.match(/^(.+?)\s+[—–]\s+(.+)$/)
  if (!match) return { title: full }
  return { courseCode: match[1]!.trim(), title: match[2]!.trim() }
}

export function libraryHubHeaderModel(
  folders: LibraryFolder[],
  nav: LibraryNavState,
): LibraryHubHeaderModel {
  if (nav.scope === "my") {
    return {
      breadcrumbs: [{ label: LIBRARY_HUB_BREADCRUMB.label, href: LIBRARY_HUB_BREADCRUMB.href }],
      title: "My items",
    }
  }
  if (nav.scope === "folder" && nav.folderId) {
    const name = folders.find(f => f.id === nav.folderId)?.name ?? "Folder"
    return {
      breadcrumbs: [{ label: LIBRARY_HUB_BREADCRUMB.label, href: LIBRARY_HUB_BREADCRUMB.href }],
      title: name,
    }
  }
  return {
    breadcrumbs: [{ label: LIBRARY_HUB_BREADCRUMB.label, href: LIBRARY_HUB_BREADCRUMB.href }],
    title: "All questions",
  }
}

export function filterLibraryItemsByNav(
  items: LibraryItem[],
  folders: LibraryFolder[],
  nav: LibraryNavState,
): LibraryItem[] {
  if (nav.scope === "all") return items
  if (nav.scope === "my") {
    return items.filter(
      i => i.author === LIBRARY_NAV_MY_AUTHOR || i.createdBy === LIBRARY_NAV_MY_AUTHOR,
    )
  }
  if (nav.scope === "folder" && nav.folderId) {
    const allowedFolderIds = collectFolderDescendantIds(folders, nav.folderId)
    return items.filter(i => allowedFolderIds.has(i.folderId))
  }
  return items
}

/** Mock folder id for the Favorites bucket (see `DEFAULT_LIBRARY_FOLDERS`). */
export const LIBRARY_FAVORITES_FOLDER_ID = "fld-favorites"

/** Root folder id for the mock PT 520 course tree (`fld-skills-lab` is a child topic). */
export const LIBRARY_CLINICAL_ROOT_FOLDER_ID = "fld-clinical"

/**
 * Client-side “AI / hub” free-text filter — same scan as `useTableState` toolbar search
 * (`Object.values` → string → lowercase `includes`).
 */
export function filterLibraryItemsByFreeText(items: LibraryItem[], q: string): LibraryItem[] {
  const t = q.trim()
  if (!t) return items
  const needle = t.toLowerCase()
  return items.filter(row =>
    Object.values(row).some(v => String(v ?? "").toLowerCase().includes(needle)),
  )
}

export function isLibraryItemFavorite(item: LibraryItem): boolean {
  return item.folderId === LIBRARY_FAVORITES_FOLDER_ID || item.isStarred === true
}

/** When a mock row lives in the Favorites folder, toggling off moves it here (no “original folder” yet). */
const LIBRARY_UNFAVORITE_FALLBACK_FOLDER_ID = "fld-science"

/** Demo toggle for `isStarred` / Favorites folder membership (offline mock only). */
export function toggleLibraryItemFavorite(item: LibraryItem): LibraryItem {
  if (isLibraryItemFavorite(item)) {
    if (item.folderId === LIBRARY_FAVORITES_FOLDER_ID) {
      return {
        ...item,
        folderId: LIBRARY_UNFAVORITE_FALLBACK_FOLDER_ID,
        isStarred: false,
      }
    }
    return { ...item, isStarred: false }
  }
  return { ...item, isStarred: true }
}

export function filterLibraryItemsByFavoritesOnly(items: LibraryItem[]): LibraryItem[] {
  return items.filter(isLibraryItemFavorite)
}

/**
 * Mock “Featured deck” (`deck=clinical`): items under the PT 520 course tree **or**
 * demo topics Gait & Posture Analysis / Neuroanatomy.
 */
export function filterLibraryItemsByClinicalDeckMock(
  items: LibraryItem[],
  folders: LibraryFolder[],
): LibraryItem[] {
  const inClinicalTree = collectFolderDescendantIds(folders, LIBRARY_CLINICAL_ROOT_FOLDER_ID)
  const topicMatch = new Set(["Gait & Posture Analysis", "Neuroanatomy"])
  return items.filter(
    i => inClinicalTree.has(i.folderId) || topicMatch.has(i.topic),
  )
}

export type LibraryLandingFilterState = {
  hubFreeText: string
  favOnly: boolean
  clinicalDeck: boolean
}

/**
 * Nav scope + optional dedicated search routes (`/library/list`, `/library/find`) landing filters (`q`, `fav`, `deck`).
 * When `hubFreeText` is non-empty but matches no rows, hub text is ignored so the scoped list still shows.
 */
export function applyLibraryHubDisplayFilters(
  items: LibraryItem[],
  folders: LibraryFolder[],
  nav: LibraryNavState,
  landing: LibraryLandingFilterState | null,
): LibraryItem[] {
  let rows = filterLibraryItemsByNav(items, folders, nav)
  if (!landing) return rows
  let afterText = filterLibraryItemsByFreeText(rows, landing.hubFreeText)
  if (landing.hubFreeText.trim() && afterText.length === 0) {
    afterText = rows
  }
  rows = afterText
  if (landing.favOnly) rows = filterLibraryItemsByFavoritesOnly(rows)
  if (landing.clinicalDeck) rows = filterLibraryItemsByClinicalDeckMock(rows, folders)
  return rows
}

/** True when hub `q` is non-empty but matches no rows under the current nav (before fav/deck). */
export function libraryHubTextMatchesNothing(
  items: LibraryItem[],
  folders: LibraryFolder[],
  nav: LibraryNavState,
  landing: LibraryLandingFilterState | null,
): boolean {
  if (!landing?.hubFreeText.trim()) return false
  const navRows = filterLibraryItemsByNav(items, folders, nav)
  return filterLibraryItemsByFreeText(navRows, landing.hubFreeText).length === 0
}

export function patchLibraryUrlSearchParams(
  sp: URLSearchParams,
  patch: {
    q?: string | null
    fav?: boolean | null
    deckClinical?: boolean | null
  },
): URLSearchParams {
  const next = new URLSearchParams(sp.toString())
  if (patch.q !== undefined) {
    const t = patch.q?.trim() ?? ""
    if (t) next.set("q", t)
    else next.delete("q")
  }
  if (patch.fav !== undefined) {
    if (patch.fav) next.set("fav", "1")
    else next.delete("fav")
  }
  if (patch.deckClinical !== undefined) {
    if (patch.deckClinical) next.set("deck", "clinical")
    else next.delete("deck")
  }
  return next
}

/** Build {@link LIBRARY_LIST_PATH} query consistently (nav + hub search + mock toggles). */
export function libraryListSearchHref(
  nav: LibraryNavState,
  opts: { q?: string | null; fav?: boolean; deckClinical?: boolean },
): string {
  return libraryNavHref({
    scope: nav.scope,
    folderId: nav.folderId,
    searchLanding: true,
    q: opts.q,
    fav: opts.fav,
    deck: opts.deckClinical ? "clinical" : undefined,
  })
}

/** Favorites bucket — same folder scope on library, list, or hub-find; preserves `q` / mock toggles on dedicated search routes. */
export function libraryFavoritesFolderHref(pathname: string, currentSearch: URLSearchParams): string {
  const normalizedPathname = normalizeLibraryPathname(pathname)
  const onList = normalizedPathname === LIBRARY_LIST_PATH
  const onHubFind = normalizedPathname === LIBRARY_HUB_FIND_PATH
  const q = currentSearch.get("q")
  const fav = currentSearch.get("fav") === "1"
  const deckClinical = currentSearch.get("deck") === "clinical"
  return libraryNavHref({
    scope: "folder",
    folderId: LIBRARY_FAVORITES_FOLDER_ID,
    ...(onList ? { searchLanding: true } : onHubFind ? { hubFind: true } : {}),
    q,
    ...(fav ? { fav: true as const } : {}),
    ...(deckClinical ? { deck: "clinical" as const } : {}),
  })
}

/** “Search” secondary nav — {@link LIBRARY_LIST_PATH} without `?q=` (always the search landing). Preserves `fav` / `deck` when set. */
export function librarySearchLandingNavHref(
  nav: LibraryNavState,
  currentSearch: URLSearchParams,
): string {
  const listNav: LibraryNavState =
    nav.scope === "folder" ? LIBRARY_DEFAULT_NAV : nav
  return libraryListSearchHref(listNav, {
    fav: currentSearch.get("fav") === "1" ? true : undefined,
    deckClinical: currentSearch.get("deck") === "clinical" ? true : undefined,
  })
}

/** True when the dedicated search shell should show the “Search” nav row as current (not browsing a folder there). */
export function isLibrarySearchNavActive(pathname: string, nav: LibraryNavState): boolean {
  const normalizedPathname = normalizeLibraryPathname(pathname)
  if (normalizedPathname !== LIBRARY_LIST_PATH && normalizedPathname !== LIBRARY_HUB_FIND_PATH) return false
  if (nav.scope === "folder" && nav.folderId) return false
  return true
}

/**
 * Hub scope link that preserves list-only params (`q`, `fav`, `deck`) when the user is already
 * on {@link LIBRARY_LIST_PATH}; folder / “My” targets use the library path per product rule.
 */
export function libraryHubScopeHref(
  pathname: string,
  currentSearch: URLSearchParams,
  patch: { scope: LibraryNavScope; folderId?: string | null },
): string {
  const normalizedPathname = normalizeLibraryPathname(pathname)
  const onList = normalizedPathname === LIBRARY_LIST_PATH
  const onHubFind = normalizedPathname === LIBRARY_HUB_FIND_PATH
  const q = currentSearch.get("q")
  const fav = currentSearch.get("fav") === "1"
  const deckClinical = currentSearch.get("deck") === "clinical"
  const landingBits = {
    q,
    ...(fav ? { fav: true as const } : {}),
    ...(deckClinical ? { deck: "clinical" as const } : {}),
  }
  if (patch.scope === "my" || (patch.scope === "folder" && patch.folderId)) {
    return libraryNavHref({
      scope: patch.scope,
      folderId: patch.folderId,
      searchLanding: false,
    })
  }
  if (patch.scope === "all") {
    return libraryNavHref({
      scope: "all",
      searchLanding: false,
      hubFind: false,
      ...landingBits,
    })
  }
  return libraryNavHref({ scope: "all", searchLanding: false })
}

/** Build `/library` href with optional query + hash (hash without leading `#`). */
export function libraryNavHref(opts: {
  scope: LibraryNavScope
  folderId?: string | null
  hash?: string
  /**
   * Hub / panel search string (`?q=`). On {@link LIBRARY_LIST_PATH} and {@link LIBRARY_HUB_FIND_PATH}
   * this filters rows via {@link applyLibraryHubDisplayFilters} — **not** the DataTable toolbar
   * (toolbar stays independent on those routes).
   */
  q?: string | null
  /** Mock list filter: `fav=1` — favorites folder or `isStarred` rows. */
  fav?: boolean
  /** Mock list filter: `deck=clinical` — see {@link filterLibraryItemsByClinicalDeckMock}. */
  deck?: "clinical" | null
  /**
   * When true, links use {@link LIBRARY_LIST_PATH} (library “Search” in secondary nav).
   * Scoped folder / mine links should use `searchLanding: false` (library path).
   */
  searchLanding?: boolean
  /**
   * When true, links use {@link LIBRARY_HUB_FIND_PATH} (discovery hub composer submit).
   * Do not combine with `searchLanding` — hub find wins if both are set.
   */
  hubFind?: boolean
  basePath?: string
}): string {
  const base =
    opts.hubFind === true
      ? LIBRARY_HUB_FIND_PATH
      : opts.searchLanding === true
        ? LIBRARY_LIST_PATH
        : LIBRARY_ALL_PATH
  const sp = new URLSearchParams()
  if (opts.scope === "my") sp.set("scope", "my")
  if (opts.scope === "folder" && opts.folderId) {
    sp.set("scope", "folder")
    sp.set("folderId", opts.folderId)
  }
  const trimmedQ = opts.q?.trim()
  if (trimmedQ) sp.set("q", trimmedQ)
  if (opts.fav) sp.set("fav", "1")
  if (opts.deck === "clinical") sp.set("deck", "clinical")
  const qs = sp.toString()
  const h = opts.hash?.replace(/^#/, "")
  const hashPart = h ? `#${h}` : ""
  const href = qs ? `${base}?${qs}${hashPart}` : `${base}${hashPart}`
  return libraryRouteHref(href, opts.basePath)
}
