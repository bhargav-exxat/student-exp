import { useLocation, useParams } from "react-router-dom"

import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { useProduct } from "@/contexts/product-context"
import { prismHubMetaForSegment } from "@/lib/prism-hub-meta"
import { oneSchoolsHubMetaForSegment } from "@/lib/one-schools-hub-meta"
import { oneSitesHubMetaForSegment } from "@/lib/one-sites-hub-meta"
import { getRegisteredProductBySlug } from "@exxatdesignux/product-framework"
import { customProductSlugFromSuffix } from "@/lib/product-routing"

/**
 * Generic hub placeholder for tenant product routes under
 * `/:productRootSegment/<hub>/*`. Renders DS chrome + an empty body until
 * the hub ships a real `ListPageTemplate` surface.
 */
export default function ProductShellPlaceholder() {
  const { pathname } = useLocation()
  const { productRootSegment = "" } = useParams()
  const { customProducts, activeCustomIndex, product } = useProduct()
  const registered = getRegisteredProductBySlug(productRootSegment)
  const brand = customProducts[activeCustomIndex]
  const slug =
    registered?.slug ??
    (brand?.suffix?.trim()
      ? customProductSlugFromSuffix(brand.suffix)
      : productRootSegment)

  const pathSegments = pathname.split("/").filter(Boolean)
  const hubSegment = pathSegments[1] ?? productRootSegment
  const meta =
    product === "exxat-one-schools"
      ? oneSchoolsHubMetaForSegment(hubSegment)
      : product === "exxat-one-sites"
        ? oneSitesHubMetaForSegment(hubSegment)
        : prismHubMetaForSegment(hubSegment)

  return (
    <PrimaryPageTemplate siteHeader={{ title: meta.title }}>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader title={meta.title} subtitle={meta.description} />
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center rounded-2 border border-dashed border-border bg-card/40 px-6 py-12 text-center"
          role="status"
        >
          <span
            aria-hidden="true"
            className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary-panel-bg text-xl text-brand"
          >
            <i className="fa-light fa-compass-drafting" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            {meta.title} is not built in this workspace yet. Wire a{" "}
            <span className="font-medium text-foreground">ListPageTemplate</span> hub at{" "}
            <span className="font-mono tabular-nums text-foreground">/{slug}/{hubSegment}</span>{" "}
            when you are ready.
          </p>
        </div>
      </div>
    </PrimaryPageTemplate>
  )
}
