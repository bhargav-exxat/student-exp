import { Link } from "react-router-dom"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

const HELP_CENTER = "https://help.exxat.com/hc/en-us"

/** `/help` — Help center landing. */
export default function HelpPage() {
  const dashboardHref = useProductDashboardHref()
  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Get help",
      }}
    >
      <div className="px-4 py-8 pb-16 lg:px-6 max-w-xl">
        <h1 className="sr-only">Get help</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Browse articles and guides in the Exxat Help Center, or adjust app
          preferences in Settings.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={HELP_CENTER} target="_blank" rel="noopener noreferrer">
              Open Help Center
              <i
                className="fa-light fa-arrow-up-right ms-2 text-xs"
                aria-hidden="true"
              />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings/profile">Profile settings</Link>
          </Button>
        </div>
        <section id="more" className="scroll-mt-20 mt-10">
          <h2 className="text-sm font-semibold text-foreground">More</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Additional resources and shortcuts from the sidebar land here when
            you choose More.
          </p>
        </section>
      </div>
    </PrimaryPageTemplate>
  )
}
