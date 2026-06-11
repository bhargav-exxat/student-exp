"use client"

import { DefaultProductRedirect as PackageDefaultProductRedirect } from "@exxatdesignux/ui/components/shell"
import { DashboardLoadingFallback } from "@/src/pages/_dashboard-loading"

/**
 * Cold-start `/` → tenant default product dashboard. Wraps the framework's
 * redirect with apps/web's default loading fallback.
 */
export function DefaultProductRedirect() {
  return <PackageDefaultProductRedirect loadingFallback={<DashboardLoadingFallback />} />
}
