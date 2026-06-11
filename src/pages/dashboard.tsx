import { lazy, Suspense } from "react"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { DASHBOARD_METRICS, DASHBOARD_INSIGHT } from "@/lib/mock/dashboard"

import { DashboardLoadingFallback } from "./_dashboard-loading"

/**
 * `/dashboard` — Vite-side mirror of `app/(app)/dashboard/page.tsx`.
 *
 * The Next page used `next/dynamic({ loading: () => <Skeleton/> })`
 * which the Vite alias resolves to `React.lazy + Suspense`. We use
 * native `lazy + Suspense` here for clarity, with the same skeleton
 * the Next loading.tsx rendered.
 */
const DashboardTabs = lazy(() =>
  import("@/components/dashboard-tabs").then(m => ({
    default: m.DashboardTabs,
  })),
)

export default function DashboardPage() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Dashboard" }}>
      <Suspense fallback={<DashboardLoadingFallback />}>
        <DashboardTabs
          title="Dashboard"
          subtitle="Design system shell · sample metrics and charts"
          metrics={DASHBOARD_METRICS}
          insight={DASHBOARD_INSIGHT}
        />
      </Suspense>
    </PrimaryPageTemplate>
  )
}
