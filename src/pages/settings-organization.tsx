import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { SettingsOrganizationClient } from "@/components/settings-organization-client"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

/**
 * Organization / workspace settings — products & branding.
 * Mounted at `/settings/organization` and `/<product-root>/settings`.
 */
export default function SettingsOrganizationPage() {
  const dashboardHref = useProductDashboardHref()

  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-3xl"
      contentClassName="px-8 pt-10 pb-32"
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Organization settings",
      }}
    >
      <SettingsOrganizationClient />
    </PrimaryPageTemplate>
  )
}
