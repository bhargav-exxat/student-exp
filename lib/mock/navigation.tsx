// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Navigation
// Uses .tsx because icons are JSX (<i> elements).
// ─────────────────────────────────────────────────────────────────────────────

import type * as React from "react"

import { logoDevUrl } from "@/lib/logo-dev"
import { stockPortraitUrl } from "@/lib/stock-portrait"
import {
  LIBRARY_ENTRY_PATH,
  LIBRARY_HUB_FIND_PATH,
  LIBRARY_ALL_PATH,
} from "@/lib/library-nav"
import { productSlug, type Product } from "@/stores/app-store"
import { customProductSlugFromSuffix } from "@/lib/product-routing"
import { primaryNavLinksForSlug } from "@exxatdesignux/product-framework"

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Drill-in slot for sidebar rows that lead into deep, focused sections
 * (e.g. Settings → Profile / Organization / Billing). When a row carries
 * `drillIn` and the URL matches `sectionRouteRoot`, the primary sidebar
 * content area swaps to a stacked view rendered by `SidebarDrillIn` —
 * `[← Back] · <sectionTitle>` followed by the section's nav list.
 *
 * Mutually exclusive with `secondaryPanel` — a row opts into EITHER the
 * drill-in pattern (deep section, user "going into" it) OR the secondary-
 * panel pattern (hub-scoped catalog, user "scoping" it). See
 * `apps/web/components/sidebar/sidebar-drill-in.tsx` and the
 * SidebarDrillIn primitive doc for the decision criteria.
 */
export interface NavDrillInConfig {
  /** Heading rendered above the drilled-in nav list. */
  sectionTitle: string
  /** Pathname prefix that activates the drilled-in view (e.g. `"/settings"`). */
  sectionRouteRoot: string
  /**
   * Custom matcher for routes whose product slug is part of the URL —
   * e.g. Leo lives at `/<product>/leo`, which `sectionRouteRoot` alone
   * can't express. When set, OVERRIDES the default
   * `pathname.startsWith(sectionRouteRoot)` check.
   */
  sectionRouteMatch?: (pathname: string) => boolean
  /**
   * Nav rows shown inside the drilled-in pane. Ignored when the consumer
   * renders custom drill-in content (see Leo — `app-sidebar.tsx` switches
   * on the row key to render `<LeoSidebarDrillInPanel>` instead).
   */
  items: NavLinkItem[]
}

/** Labelled primary-nav group (Prism Program / Curriculum / Placement blocks). */
export interface NavSection {
  key: string
  /** Section heading — omit or leave empty to render items without a label row. */
  label: string
  items: NavLinkItem[]
}

/** Primary nav layout — preamble rows, labelled sections, optional trailing rows. */
export interface NavPrimaryLayout {
  preamble: NavLinkItem[]
  sections: NavSection[]
  /** Primary rows after all sections — not grouped under a section label. */
  epilogue?: NavLinkItem[]
}

/** Flat sidebar link — primary + Documents + utilities groups (DS shell; not legacy screenshot styling) */
export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  /** Optional child links — renders as a collapsible sub-menu */
  children?: NavLinkItem[]
  /** Optional inline badge — count (number) or label text (string).
   *  Special string values get distinct colors:
   *  "New" → green,  "Beta" → amber,  other strings → brand/primary  */
  badge?: number | string
  /**
   * When this collapsible section uses `SecondaryPanel`, set the panel id so
   * child links can reopen the panel on click while already on the same route
   * (react-router-dom `Link` does not navigate on same href).
   */
  secondaryPanel?: string
  /**
   * When set, clicking this row leads INTO a deep section that swaps the
   * sidebar content area to a `SidebarDrillIn` stack. The row's own URL
   * MUST land inside `drillIn.sectionRouteRoot` so the drilled-in pane
   * shows on first navigation. Mutually exclusive with `secondaryPanel`.
   */
  drillIn?: NavDrillInConfig
  /**
   * When several children share the same `url` (hub route), only this child’s
   * key receives `data-active` for that pathname — otherwise every sub-row
   * looks selected (same issue as duplicate `href` in any nav).
   */
  primaryHubChildKey?: string
}

// ── Team / scope switcher mock data ──────────────────────────────────────────
//
// The sidebar header picker (TeamSwitcher) is **product-aware** per the
// product-context rule (`.cursor/rules/exxat-product-context.mdc`):
//
//   • Prism / One — Schools / Custom → school > program
//   • One — Sites                    → site  > location
//
// Two parallel mock-data shapes live here — one for each scope hierarchy —
// so the switcher can render either flavor without forking the chrome.

// School + Program (school-side scope) ────────────────────────────────────────

export interface NavProgram { id: string; name: string }
export interface NavSchool {
  id: string
  name: string
  /** URL of school logo — used as the avatar image */
  logo: string
  /** Two-letter abbreviation shown as AvatarFallback */
  initials: string
  programs: NavProgram[]
}

export const NAV_SCHOOLS: NavSchool[] = [
  {
    id: "jhu",
    name: "Johns Hopkins University",
    logo: logoDevUrl("jhu.edu"),
    initials: "JH",
    programs: [
      { id: "som", name: "School of Medicine" },
      { id: "son", name: "School of Nursing" },
      { id: "sph", name: "Bloomberg School of Public Health" },
    ],
  },
  {
    id: "mayo",
    name: "Mayo Clinic Alix School of Medicine",
    logo: logoDevUrl("mayoclinic.org"),
    initials: "MC",
    programs: [
      { id: "md", name: "Doctor of Medicine" },
      { id: "bms", name: "Biomedical Sciences" },
    ],
  },
]

export const NAV_SCHOOL_DEFAULT = NAV_SCHOOLS[0]
export const NAV_PROGRAM_DEFAULT = NAV_SCHOOLS[0].programs[0]

// Site + Location (partner-side scope, Exxat One — Sites) ─────────────────────

export interface NavLocation { id: string; name: string }
export interface NavSite {
  id: string
  name: string
  /** URL of site logo — used as the avatar image */
  logo: string
  /** Two-letter abbreviation shown as AvatarFallback */
  initials: string
  locations: NavLocation[]
}

export const NAV_SITES: NavSite[] = [
  {
    id: "mgb",
    name: "Mass General Brigham",
    logo: logoDevUrl("massgeneralbrigham.org"),
    initials: "MG",
    locations: [
      { id: "mgh-main",   name: "Mass General — Boston" },
      { id: "bwh",        name: "Brigham and Women's — Boston" },
      { id: "mgh-salem",  name: "Salem Hospital" },
    ],
  },
  {
    id: "ccf",
    name: "Cleveland Clinic",
    logo: logoDevUrl("clevelandclinic.org"),
    initials: "CC",
    locations: [
      { id: "ccf-main",   name: "Main Campus — Cleveland" },
      { id: "ccf-fairview", name: "Fairview Hospital" },
    ],
  },
]

export const NAV_SITE_DEFAULT = NAV_SITES[0]
export const NAV_LOCATION_DEFAULT = NAV_SITES[0].locations[0]

// ── Primary navigation ────────────────────────────────────────────────────────
//
// The primary nav is **product-keyed** (`NAV_BY_PRODUCT[productId]`) per Rule
// 5 of the multi-product routing pattern
// (`apps/web/docs/multi-product-routing-pattern.md`). `AppSidebar` reads
// `useProduct().product` and renders the matching tree. Switching products
// in the sidebar swaps the entire primary nav.
//
// Product-owned hubs live under the active product root. Shell-global routes
// like Help remain at the workspace root.

const dashboardItem = (slug: string): NavLinkItem => ({
  key: "dashboard",
  title: "Dashboard",
  url: `/${slug}/dashboard`,
  icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
})

const homeItem = (slug: string): NavLinkItem => ({
  key: "home",
  title: "Home",
  url: `/${slug}/dashboard`,
  icon:       <i className="fa-light fa-house" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-house" aria-hidden="true" />,
})

const libraryItem = (slug: string): NavLinkItem => ({
  key: "library",
  title: "Question bank",
  url: `/${slug}${LIBRARY_ENTRY_PATH}`,
  icon:       <i className="fa-light fa-books" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-books" aria-hidden="true" />,
  secondaryPanel: "library",
  /** List hub (`/library/all`) — not discovery home (`/library`). */
  primaryHubChildKey: "library-all",
  children: [
    {
      key: "library-hub",
      title: "Library home",
      url: `/${slug}${LIBRARY_ENTRY_PATH}`,
      icon:       <i className="fa-light fa-sparkles" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-sparkles" aria-hidden="true" />,
    },
    {
      key: "library-search",
      title: "Search",
      url: `/${slug}${LIBRARY_HUB_FIND_PATH}`,
      icon:       <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />,
    },
    {
      key: "library-all",
      title: "Library",
      url: `/${slug}${LIBRARY_ALL_PATH}`,
      icon:       <i className="fa-light fa-table-list" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-table-list" aria-hidden="true" />,
    },
  ],
})

function hubItem(
  slug: string,
  key: string,
  title: string,
  segment: string,
  iconClass: string,
  iconActiveClass: string,
  opts?: { badge?: number | string },
): NavLinkItem {
  return {
    key,
    title,
    url: `/${slug}/${segment}`,
    icon:       <i className={iconClass} aria-hidden="true" />,
    iconActive: <i className={iconActiveClass} aria-hidden="true" />,
    ...opts,
  }
}

function complianceItem(slug: string): NavLinkItem {
  return {
    key: "compliance",
    title: "Compliance",
    url: `/${slug}/student-compliance`,
    icon:       <i className="fa-light fa-shield-check" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-shield-check" aria-hidden="true" />,
    primaryHubChildKey: "student-compliance",
    children: [
      hubItem(
        slug,
        "student-compliance",
        "Student Compliance",
        "student-compliance",
        "fa-light fa-file-circle-check",
        "fa-solid fa-file-circle-check",
      ),
      hubItem(
        slug,
        "faculty-compliance",
        "Faculty Compliance",
        "faculty-compliance",
        "fa-light fa-file-circle-check",
        "fa-solid fa-file-circle-check",
      ),
    ],
  }
}

function navGroupParent(
  slug: string,
  key: string,
  title: string,
  firstSegment: string,
  iconLight: string,
  iconSolid: string,
  children: NavLinkItem[],
): NavLinkItem {
  return {
    key,
    title,
    url: `/${slug}/${firstSegment}`,
    icon: <i className={iconLight} aria-hidden="true" />,
    iconActive: <i className={iconSolid} aria-hidden="true" />,
    children,
  }
}

function flattenNavItems(items: NavLinkItem[]): NavLinkItem[] {
  const flat: NavLinkItem[] = []
  for (const item of items) {
    flat.push(item)
    if (item.children?.length) flat.push(...flattenNavItems(item.children))
  }
  return flat
}

/**
 * Prism + Custom primary nav — section labels become collapsible parents
 * (Program / Curriculum / Placement). Reports is a primary row.
 * Question bank + DS pattern hubs live on Design OS (`buildDesignOsNavLayout`).
 */
function buildPrismNavLayout(slug: string): NavPrimaryLayout {
  return {
    preamble: [
      dashboardItem(slug),
      questionBankItem(slug),
      navGroupParent(
        slug,
        "program",
        "Program",
        "program-details",
        "fa-light fa-layer-group",
        "fa-solid fa-layer-group",
        [
          hubItem(slug, "program-details", "Program Details", "program-details", "fa-light fa-landmark", "fa-solid fa-landmark"),
          hubItem(slug, "students", "Students", "students", "fa-light fa-graduation-cap", "fa-solid fa-graduation-cap"),
          hubItem(slug, "faculty-staff", "Faculty and Staff", "faculty-staff", "fa-light fa-user-group", "fa-solid fa-user-group"),
          complianceItem(slug),
        ],
      ),
      navGroupParent(
        slug,
        "curriculum",
        "Curriculum Management",
        "courses",
        "fa-light fa-book-open",
        "fa-solid fa-book-open",
        [
          hubItem(slug, "courses", "Courses", "courses", "fa-light fa-books", "fa-solid fa-books"),
          hubItem(slug, "curriculum-mapping", "Curriculum Mapping", "curriculum-mapping", "fa-light fa-grid-2-plus", "fa-solid fa-grid-2-plus", { badge: "Leo" }),
          hubItem(slug, "competency-management", "Competency", "competency-management", "fa-light fa-stars", "fa-solid fa-stars", { badge: "Beta" }),
        ],
      ),
      navGroupParent(
        slug,
        "placement",
        "Placement Management",
        "sites",
        "fa-light fa-route",
        "fa-solid fa-route",
        [
          hubItem(slug, "sites", "Sites", "sites", "fa-light fa-building", "fa-solid fa-building"),
          hubItem(slug, "process-my-requests", "Process My Requests", "process-my-requests", "fa-light fa-file-magnifying-glass", "fa-solid fa-file-magnifying-glass"),
          hubItem(slug, "placements", "Placements", "placements", "fa-light fa-user-plus", "fa-solid fa-user-plus"),
          hubItem(slug, "learning-activities", "Learning Activities", "learning-activities", "fa-light fa-clipboard-list", "fa-solid fa-clipboard-list"),
        ],
      ),
      hubItem(slug, "reports", "Reports", "reports", "fa-light fa-chart-line", "fa-solid fa-chart-line"),
    ],
    sections: [],
  }
}

function columnsItem(slug: string): NavLinkItem {
  return {
    key: "columns",
    title: "Column types",
    url: `/${slug}/columns`,
    icon:       <i className="fa-light fa-table-columns" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-table-columns" aria-hidden="true" />,
  }
}

function questionBankItem(slug: string): NavLinkItem {
  return {
    key: "question-bank",
    title: "Question Bank",
    url: `/${slug}/question-bank`,
    icon:       <i className="fa-light fa-books" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-books" aria-hidden="true" />,
  }
}

/** Token category drill-in rows — scoped under `/${productSlug}/tokens-themes`. */
function buildTokensDrillInItems(basePath: string): NavLinkItem[] {
  const root = basePath.replace(/\/$/, "")
  const tokensBase = root ? `${root}/tokens-themes` : "/tokens-themes"
  return [
    {
      key: "tokens-all",
      title: "All tokens",
      url: tokensBase,
      icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
    },
    {
      key: "tokens-color",
      title: "Colors",
      url: `${tokensBase}?category=color`,
      icon:       <i className="fa-light fa-palette" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-palette" aria-hidden="true" />,
    },
    {
      key: "tokens-gradient",
      title: "Gradients",
      url: `${tokensBase}?category=gradient`,
      icon:       <i className="fa-light fa-circle-half-stroke" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" />,
    },
    {
      key: "tokens-radius",
      title: "Radius",
      url: `${tokensBase}?category=radius`,
      icon:       <i className="fa-light fa-rectangle-vertical" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-rectangle-vertical" aria-hidden="true" />,
    },
    {
      key: "tokens-size",
      title: "Size",
      url: `${tokensBase}?category=size`,
      icon:       <i className="fa-light fa-ruler-horizontal" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-ruler-horizontal" aria-hidden="true" />,
    },
    {
      key: "tokens-shadow",
      title: "Shadow",
      url: `${tokensBase}?category=shadow`,
      icon:       <i className="fa-light fa-clone" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-clone" aria-hidden="true" />,
    },
    {
      key: "tokens-typography",
      title: "Typography",
      url: `${tokensBase}?category=typography`,
      icon:       <i className="fa-light fa-text-size" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-text-size" aria-hidden="true" />,
    },
    {
      key: "tokens-transition",
      title: "Motion",
      url: `${tokensBase}?category=transition`,
      icon:       <i className="fa-light fa-wave-sine" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-wave-sine" aria-hidden="true" />,
    },
    {
      key: "tokens-alias",
      title: "Aliases",
      url: `${tokensBase}?category=alias`,
      icon:       <i className="fa-light fa-link" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-link" aria-hidden="true" />,
    },
    {
      key: "tokens-other",
      title: "Other",
      url: `${tokensBase}?category=other`,
      icon:       <i className="fa-light fa-hashtag" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-hashtag" aria-hidden="true" />,
    },
  ]
}

/** Design OS — internal DS workspace: library reference hub + tokens + column catalog. */
function buildDesignOsNavLayout(slug: string): NavPrimaryLayout {
  const tokensRoot = `/${slug}/tokens-themes`
  return {
    preamble: [
      dashboardItem(slug),
      libraryItem(slug),
      questionBankItem(slug),
      {
        key: "tokens",
        title: "Tokens & themes",
        url: tokensRoot,
        icon:       <i className="fa-light fa-palette" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-palette" aria-hidden="true" />,
        drillIn: {
          sectionTitle: "Tokens & themes",
          sectionRouteRoot: tokensRoot,
          items: buildTokensDrillInItems(`/${slug}`),
        },
      },
      columnsItem(slug),
    ],
    sections: [],
  }
}

/**
 * Exxat One — Schools primary nav — school-side coordinator IA (Home,
 * availability explore/wishlist; Activities section; Reports).
 */
function buildOneSchoolsNavLayout(slug: string): NavPrimaryLayout {
  return {
    preamble: [
      homeItem(slug),
      hubItem(
        slug,
        "explore-availability",
        "Explore & apply",
        "explore-availability",
        "fa-light fa-magnifying-glass-location",
        "fa-solid fa-magnifying-glass-location",
      ),
      hubItem(
        slug,
        "wishlist-responses",
        "Wishlist Responses",
        "wishlist-responses",
        "fa-light fa-heart",
        "fa-solid fa-heart",
      ),
    ],
    sections: [
      {
        key: "activities",
        label: "Activities",
        items: [
          hubItem(
            slug,
            "activities-dashboard",
            "Dashboard",
            "activities-dashboard",
            "fa-light fa-gauge-high",
            "fa-solid fa-gauge-high",
          ),
          hubItem(
            slug,
            "activities-requests",
            "Requests",
            "activities-requests",
            "fa-light fa-inbox",
            "fa-solid fa-inbox",
          ),
          hubItem(
            slug,
            "activities-schedules",
            "Schedules",
            "activities-schedules",
            "fa-light fa-calendar-days",
            "fa-solid fa-calendar-days",
          ),
        ],
      },
    ],
    epilogue: [
      hubItem(slug, "reports", "Reports", "reports", "fa-light fa-chart-line-up", "fa-solid fa-chart-line-up"),
    ],
  }
}

/** Route segments for One — Schools hub shells (excludes dashboard). */
export const ONE_SCHOOLS_HUB_SEGMENTS = [
  "explore-availability",
  "wishlist-responses",
  "activities-dashboard",
  "activities-requests",
  "activities-schedules",
] as const

/**
 * Exxat One — Sites primary nav — Home; Availability / Jobs / Site directory sections.
 */
function buildOneSitesNavLayout(slug: string): NavPrimaryLayout {
  return {
    preamble: [homeItem(slug)],
    sections: [
      {
        key: "availability-management",
        label: "Availability Management",
        items: [
          hubItem(slug, "availability", "Availability", "availability", "fa-light fa-calendar", "fa-solid fa-calendar"),
          hubItem(
            slug,
            "slot-requests",
            "Slot Requests",
            "slot-requests",
            "fa-light fa-inbox",
            "fa-solid fa-inbox",
          ),
          hubItem(slug, "schedules", "Schedules", "schedules", "fa-light fa-calendar-lines", "fa-solid fa-calendar-lines"),
          hubItem(slug, "reports", "Reports", "reports", "fa-light fa-chart-line", "fa-solid fa-chart-line"),
        ],
      },
      {
        key: "jobs-management",
        label: "Jobs Management",
        items: [
          hubItem(slug, "jobs", "Jobs", "jobs", "fa-light fa-briefcase", "fa-solid fa-briefcase", { badge: "New" }),
        ],
      },
      {
        key: "site-directory",
        label: "Site directory",
        items: [
          hubItem(slug, "locations", "Locations", "locations", "fa-light fa-location-dot", "fa-solid fa-location-dot"),
          hubItem(slug, "personnel", "Personnel", "personnel", "fa-light fa-users", "fa-solid fa-users"),
          hubItem(
            slug,
            "school-partners",
            "School Partners",
            "school-partners",
            "fa-light fa-handshake",
            "fa-solid fa-handshake",
          ),
        ],
      },
    ],
  }
}

/** Route segments for One — Sites hub shells (excludes dashboard). */
export const ONE_SITES_HUB_SEGMENTS = [
  "locations",
  "personnel",
  "school-partners",
  "availability",
  "slot-requests",
  "schedules",
  "jobs",
] as const

/** Route segments for generic Prism hub shells (excludes dashboard + library). */
export const PRISM_HUB_SEGMENTS = [
  "program-details",
  "students",
  "faculty-staff",
  "student-compliance",
  "faculty-compliance",
  "reports",
  "courses",
  "curriculum-mapping",
  "competency-management",
  "sites",
  "process-my-requests",
  "placements",
  "learning-activities",
] as const

export function flattenNavLayout(layout: NavPrimaryLayout): NavLinkItem[] {
  const top = [
    ...layout.preamble,
    ...layout.sections.flatMap((section) => section.items),
    ...(layout.epilogue ?? []),
  ]
  return flattenNavItems(top)
}

function buildPlaceholderPrimary(slug: string): NavLinkItem[] {
  return [dashboardItem(slug)]
}

function buildPlaceholderLayout(slug: string): NavPrimaryLayout {
  return { preamble: buildPlaceholderPrimary(slug), sections: [] }
}

export const NAV_LAYOUT_BY_PRODUCT: Record<Product, NavPrimaryLayout> = {
  "exxat-prism": buildPrismNavLayout(productSlug("exxat-prism")),
  "exxat-design-os": buildDesignOsNavLayout(productSlug("exxat-design-os")),
  "exxat-one-schools": buildOneSchoolsNavLayout(productSlug("exxat-one-schools")),
  "exxat-one-sites": buildOneSitesNavLayout(productSlug("exxat-one-sites")),
  "exxat-custom": buildPrismNavLayout("custom"),
}

export const NAV_BY_PRODUCT: Record<Product, NavLinkItem[]> = {
  "exxat-prism": flattenNavLayout(NAV_LAYOUT_BY_PRODUCT["exxat-prism"]),
  "exxat-design-os": flattenNavLayout(NAV_LAYOUT_BY_PRODUCT["exxat-design-os"]),
  "exxat-one-schools": flattenNavLayout(NAV_LAYOUT_BY_PRODUCT["exxat-one-schools"]),
  "exxat-one-sites": flattenNavLayout(NAV_LAYOUT_BY_PRODUCT["exxat-one-sites"]),
  "exxat-custom": flattenNavLayout(NAV_LAYOUT_BY_PRODUCT["exxat-custom"]),
}

/**
 * Primary nav for the active product — custom slots use their suffix slug
 * (`/assessment/dashboard`, not `/custom/dashboard`).
 */
export function getPrimaryNavLayoutForProduct(
  product: Product,
  customProducts: { suffix: string }[],
  activeCustomIndex: number,
): NavPrimaryLayout {
  if (product === "exxat-custom") {
    const brand = customProducts[activeCustomIndex] ?? customProducts[0]
    const slug = brand?.suffix?.trim()
      ? customProductSlugFromSuffix(brand.suffix)
      : "custom"
    const registeredNav = primaryNavLinksForSlug(slug)
    if (registeredNav?.length) {
      return { preamble: registeredNav as NavLinkItem[], sections: [] }
    }
    return buildPrismNavLayout(slug)
  }
  if (product === "exxat-design-os") {
    return buildDesignOsNavLayout(productSlug("exxat-design-os"))
  }
  return NAV_LAYOUT_BY_PRODUCT[product]
}

export function getPrimaryNavForProduct(
  product: Product,
  customProducts: { suffix: string }[],
  activeCustomIndex: number,
): NavLinkItem[] {
  return flattenNavLayout(
    getPrimaryNavLayoutForProduct(product, customProducts, activeCustomIndex),
  )
}

/**
 * @deprecated Prefer `NAV_BY_PRODUCT[product]` with the active product from
 * `useProduct()`. This export remains for any callsite that hasn't migrated
 * yet — it points at Prism's primary nav (the only product whose IA is
 * fully built today). Will be removed once all callers move to the
 * product-keyed registry.
 */
export const NAV_PRIMARY: NavLinkItem[] = NAV_BY_PRODUCT["exxat-prism"]

// ── Documents section ───────────────────────────────────────────────────────

export const NAV_DOCUMENTS_LABEL = "Resources"

/**
 * DS pattern hubs (Library, tokens, columns) live on the internal
 * `exxat-design-os` product primary nav — not in the shared Resources strip.
 */
export const NAV_DOCUMENTS: NavLinkItem[] = []

// ── Quick actions (above primary nav) + bottom utilities ───────────────────────

/** `opensCommandMenu` wires ⌘K instead of `url`. */
export interface NavSecondaryItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  /** Solid / filled variant when the route is active — matches primary `NavLinkItem` rows. */
  iconActive?: React.ReactNode
  /** Item opens the global ⌘K command menu instead of navigating. */
  opensCommandMenu?: boolean
  /** Item toggles the Ask Leo sidebar (⌘⌥K) instead of navigating. */
  opensAskLeo?: boolean
  /**
   * When set, the sidebar content area swaps to a `SidebarDrillIn` stack
   * whenever the URL matches `drillIn.sectionRouteRoot`. Settings is the
   * canonical consumer — see `NavDrillInConfig` and
   * `apps/web/components/sidebar/sidebar-drill-in.tsx`.
   */
  drillIn?: NavDrillInConfig
}

/** Ask Leo + Search + Notifications — one row when expanded; icon stack when collapsed. */
export const NAV_QUICK_ACTIONS: NavSecondaryItem[] = [
  {
    key: "ask-leo",
    title: "Ask Leo",
    url: "#",
    icon: <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />,
    opensAskLeo: true,
    /**
     * On `/<product>/leo` the sidebar swaps into a Leo-specific drill-in
     * (search recents + New chat + recents list). `items` is empty
     * because `app-sidebar.tsx` switches on the row key and renders
     * `<LeoSidebarDrillInPanel>` for this section. The per-product URL
     * is matched via `sectionRouteMatch` since the slug is dynamic.
     */
    drillIn: {
      sectionTitle: "Ask Leo",
      sectionRouteRoot: "/leo",
      sectionRouteMatch: (pathname: string) =>
        pathname.endsWith("/leo") || pathname.includes("/leo/"),
      items: [],
    },
  },
  {
    key: "command-menu",
    title: "Search",
    url: "#",
    icon: <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
    opensCommandMenu: true,
  },
  {
    key: "notifications",
    title: "Notifications",
    url: "#",
    icon: <i className="fa-light fa-bell" aria-hidden="true" />,
  },
]

/**
 * Footer utilities. Settings is a regular nav row that points directly
 * at `/settings/organization` — Profile lives in the user dropdown
 * (`NavUser` → "App preferences"), not in the sidebar. Design OS owns
 * tokens drill-in on its primary nav; Settings stays flat here.
 */
export const NAV_SECONDARY: NavSecondaryItem[] = [
  {
    key: "settings",
    title: "Settings",
    url: "/settings/organization",
    icon:       <i className="fa-light fa-gear" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear" aria-hidden="true" />,
  },
  {
    key: "help",
    title: "Get Help",
    url: "/help",
    icon:       <i className="fa-light fa-circle-question" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-circle-question" aria-hidden="true" />,
  },
]

/** Footer utilities — One — Sites uses product-scoped site configuration. */
export function getSecondaryNavForProduct(product: Product): NavSecondaryItem[] {
  if (product === "exxat-one-sites") {
    const slug = productSlug("exxat-one-sites")
    return [
      {
        key: "site-configuration",
        title: "Site Configuration",
        url: `/${slug}/settings`,
        icon:       <i className="fa-light fa-gear" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-gear" aria-hidden="true" />,
      },
    ]
  }
  return NAV_SECONDARY
}

// ── User ──────────────────────────────────────────────────────────────────────

export const NAV_USER = {
  name:  "Alex Morgan",
  email: "alex.morgan@example.com",
  /** Stock portrait (randomuser.me); stable for this seed */
  avatar: stockPortraitUrl("exxat-nav-user-alex-morgan"),
}
