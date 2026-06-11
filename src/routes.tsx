import { Suspense, lazy } from "react"
import { Navigate, useLocation, type RouteObject } from "react-router-dom"

import { LoadingFallback } from "./pages/_loading"
import { RouteError } from "./pages/_error"
import { LibraryLayout } from "./pages/library/_layout"
import ProductDashboard from "./pages/_product-dashboard"
import { ProductRootGate } from "@/contexts/product-root-gate"
import { DefaultProductRedirect } from "@/contexts/default-product-redirect"
import { TENANT_PRODUCT_SHELL_HUB_SEGMENTS } from "@exxatdesignux/product-framework"
import { PRISM_HUB_SEGMENTS, ONE_SITES_HUB_SEGMENTS, ONE_SCHOOLS_HUB_SEGMENTS } from "@/lib/mock/navigation"
import { getStorageItem } from "@exxatdesignux/ui/lib/persisted-state"

/** Per-device flag set when the builder onboarding flow completes. */
const ONBOARDING_COMPLETE_KEY = "builder:onboarding-complete:v1"

/**
 * Vite route table — implements the multi-product routing pattern
 * (`apps/web/docs/multi-product-routing-pattern.md`):
 *
 *  - **Per-product dashboards** live under `/<product-root>/dashboard`
 *    (Rule 1). Switching products navigates to that root's dashboard
 *    (Rule 2 — driven by `useProductSwitch` in
 *    `contexts/product-route-sync.tsx`).
 *  - **Back-compat redirects** at the workspace root (`/dashboard` →
 *    `/prism/dashboard`) keep deep links from before this refactor working
 *    without a server-side 308.
 *  - **Library** mounts under product roots (`/<product-root>/library/*`).
 *    The legacy root `/library/*` mount stays as a back-compat alias while
 *    the Library subsystem normalizes product prefixes internally.
 *  - **Shell-global settings** — profile prefs at `/settings/profile`;
 *    org/workspace (products) at `/settings/organization` and
 *    `/<product-root>/settings`. `/settings` redirects for back-compat.
 *  - **`/help`** stays shell-global (per *user*, not per *product*).
 *  - **DS demo routes** (`/columns`, `/tokens-themes`) also stay at the
 *    root while they're still development surfaces — same exception.
 */

/** Back-compat: `/library`, `/columns`, `/tokens-themes`, `/exam` → Design OS product root. */
function RedirectToDesignOsSubpath({ fromPrefix, toPrefix }: { fromPrefix: string; toPrefix: string }) {
  const location = useLocation()
  const rest = location.pathname.startsWith(fromPrefix)
    ? location.pathname.slice(fromPrefix.length)
    : ""
  const normalizedRest = rest.startsWith("/") ? rest : rest ? `/${rest}` : ""
  return (
    <Navigate
      to={`${toPrefix}${normalizedRest}${location.search}${location.hash}`}
      replace
    />
  )
}

function lazyPage(
  loader: () => Promise<{ default: React.ComponentType }>,
  fallback: React.ReactNode = <LoadingFallback />,
) {
  const Lazy = lazy(loader)
  return (
    <Suspense fallback={fallback}>
      <Lazy />
    </Suspense>
  )
}

/**
 * Back-compat redirect for `/dashboard` → default product dashboard.
 */
function LegacyRedirectToDefaultDashboard() {
  return <DefaultProductRedirect />
}

// First-visit landing — run the builder onboarding flow on the very first
// visit, then land on the default product dashboard on every subsequent load.
// Onboarding marks itself complete via `builder:onboarding-complete:v1`
// (set in `views/builder-onboarding.tsx`), so the redirect only fires once.
// Re-run it from `Settings → Profile → Restart onboarding` (which clears the
// flag) or by visiting `/builder/onboarding` directly.
function FirstRunRedirect() {
  const onboardingComplete = getStorageItem(ONBOARDING_COMPLETE_KEY) === "true"
  if (!onboardingComplete) {
    return <Navigate to="/builder/onboarding" replace />
  }
  return <DefaultProductRedirect />
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-product children
// ─────────────────────────────────────────────────────────────────────────────
//
// Today only the dashboard is under a product root. Once Library / Placements
// / Settings sub-screens move under products, append their children here (or
// extract per-product factories like `prismChildren()`, `oneSitesChildren()`).

const TENANT_PRODUCT_SHELL_HUBS = TENANT_PRODUCT_SHELL_HUB_SEGMENTS.filter(
  segment => segment !== "library",
)

/** Prism + One — Schools + One — Sites + legacy tenant shell hubs. */
const PRODUCT_SHELL_HUB_SEGMENTS = [
  ...new Set([
    ...PRISM_HUB_SEGMENTS,
    ...ONE_SCHOOLS_HUB_SEGMENTS,
    ...ONE_SITES_HUB_SEGMENTS,
    ...TENANT_PRODUCT_SHELL_HUBS,
  ]),
]

function libraryChildren(): RouteObject[] {
  return [
    { index: true, element: lazyPage(() => import("./pages/library/index")) },
    { path: "all", element: lazyPage(() => import("./pages/library/all")) },
    { path: "find", element: lazyPage(() => import("./pages/library/find")) },
    { path: "list", element: lazyPage(() => import("./pages/library/list")) },
    { path: "new", element: lazyPage(() => import("./pages/library/new")) },
  ]
}

function productChildren(): RouteObject[] {
  return [
    { index: true, element: <Navigate to="dashboard" replace /> },
    {
      path: "dashboard",
      element: <ProductDashboard />,
      errorElement: <RouteError />,
    },
    {
      path: "library",
      element: <LibraryLayout />,
      children: libraryChildren(),
      errorElement: <RouteError />,
    },
    {
      path: "question-bank",
      element: lazyPage(() => import("./pages/question-bank")),
      errorElement: <RouteError />,
    },
    {
      path: "create-assessment",
      element: lazyPage(() => import("./pages/create-assessment")),
      errorElement: <RouteError />,
    },
    {
      path: "leo",
      element: lazyPage(() => import("./pages/leo")),
      errorElement: <RouteError />,
    },
    {
      path: "columns",
      element: lazyPage(() => import("./pages/columns")),
      errorElement: <RouteError />,
    },
    {
      path: "tokens-themes",
      element: lazyPage(() => import("./pages/tokens-themes")),
      errorElement: <RouteError />,
    },
    ...PRODUCT_SHELL_HUB_SEGMENTS.map(segment => ({
      path: `${segment}/*`,
      element: lazyPage(() => import("./pages/_product-shell-placeholder")),
      errorElement: <RouteError />,
    })),
    {
      path: "settings",
      element: lazyPage(() => import("./pages/settings-organization")),
      errorElement: <RouteError />,
    },
  ]
}

export const routes: RouteObject[] = [
  // ───────────────────────────────────────────────────────────────────────
  // Root + back-compat redirects
  // ───────────────────────────────────────────────────────────────────────
  // Cold-start landing → tenant default product (Prism when unset).
  { index: true, element: <FirstRunRedirect /> },

  // Pre-product back-compat for the only previously-rooted hub.
  { path: "dashboard", element: <LegacyRedirectToDefaultDashboard /> },

  // ───────────────────────────────────────────────────────────────────────
  // Shell-global routes (per-user, not per-product)
  // ───────────────────────────────────────────────────────────────────────
  {
    path: "library/*",
    element: <RedirectToDesignOsSubpath fromPrefix="/library" toPrefix="/design-os/library" />,
  },
  {
    path: "settings",
    element: lazyPage(() => import("./pages/settings-layout")),
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: lazyPage(() => import("./pages/settings-legacy-redirect")),
      },
      {
        path: "profile",
        element: lazyPage(() => import("./pages/settings-profile")),
      },
      {
        path: "organization",
        element: lazyPage(() => import("./pages/settings-organization")),
      },
    ],
  },
  {
    path: "builder/onboarding",
    element: lazyPage(() => import("./pages/builder-onboarding")),
    errorElement: <RouteError />,
  },
  {
    path: "builder/products",
    element: <Navigate to="/settings/organization" replace />,
  },
  {
    path: "help",
    element: lazyPage(() => import("./pages/help")),
    errorElement: <RouteError />,
  },

  // ───────────────────────────────────────────────────────────────────────
  // DS demo routes (development surfaces — still at root per the rule's
  // exception; once promoted into a product hub they adopt that subpath).
  // ───────────────────────────────────────────────────────────────────────
  {
    path: "columns/*",
    element: <RedirectToDesignOsSubpath fromPrefix="/columns" toPrefix="/design-os/columns" />,
  },
  {
    path: "tokens-themes/*",
    element: (
      <RedirectToDesignOsSubpath fromPrefix="/tokens-themes" toPrefix="/design-os/tokens-themes" />
    ),
  },
  {
    path: "exam/:examId/take",
    element: lazyPage(() => import("./pages/exam/take")),
  },
  {
    path: "exam/*",
    element: <Navigate to="/design-os/dashboard" replace />,
  },

  // ───────────────────────────────────────────────────────────────────────
  // Product-owned roots (Rule 1) — built-in slugs + custom suffix slugs.
  // MUST stay after shell-global routes so `/settings` etc. are not captured.
  // ───────────────────────────────────────────────────────────────────────
  {
    path: ":productRootSegment",
    element: <ProductRootGate />,
    children: productChildren(),
    errorElement: <RouteError />,
  },

  {
    path: "*",
    element: lazyPage(() => import("./pages/_not-found")),
  },
]
