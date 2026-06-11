import * as React from "react"

import { SidebarInset } from "@/components/ui/sidebar"
import { LeoLandingClient } from "@/components/leo-landing-client"
import { useProduct } from "@/contexts/product-context"
import { productSlug } from "@/stores/app-store"

/**
 * `/<product>/leo` — Leo's dedicated canvas.
 *
 * Intentionally drops `SiteHeader` breadcrumb / PageHeader so the page reads
 * as its own surface. A floating `LeoSidebarToggle` overlays the canvas (no
 * header bar) so the rail can be expanded after the incidental collapse on
 * entry. Recents live in the drill-in panel; the canvas carries the chat.
 *
 * The `AskLeoSidebar` Sheet remains mounted at the app level for the
 * ⌘⌥K shortcut and inline KPI/chart quick-asks (those stay ephemeral —
 * only landing submissions push to recents).
 */
export default function LeoPage() {
  const { product } = useProduct()
  const slug = productSlug(product)

  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <LeoLandingClient productSlug={slug} />
    </SidebarInset>
  )
}
