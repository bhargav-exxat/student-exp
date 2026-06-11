"use client"

import { ProductRootGate as PackageProductRootGate } from "@exxatdesignux/ui/components/shell"
import { DashboardLoadingFallback } from "@/src/pages/_dashboard-loading"

/**
 * Validates `:productRootSegment` against built-in slugs and configured custom
 * products. Wraps the framework's gate with apps/web's default loading
 * fallback so existing `<ProductRootGate />` call-sites stay unchanged.
 */
export function ProductRootGate() {
  return <PackageProductRootGate loadingFallback={<DashboardLoadingFallback />} />
}
