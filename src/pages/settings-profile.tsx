import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { SettingsProfileClient } from "@/components/settings-client"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

/** `/settings/profile` — per-user preferences (theme, tours, banners). */
export default function SettingsProfilePage() {
  const dashboardHref = useProductDashboardHref()

  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-3xl"
      contentClassName="px-8 pt-10 pb-32"
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Profile settings",
      }}
    >
      <SettingsProfileClient />
    </PrimaryPageTemplate>
  )
}
