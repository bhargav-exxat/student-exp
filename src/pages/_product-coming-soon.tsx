import { Button } from "@/components/ui/button"
import { useProduct } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { brandForProduct } from "@/lib/product-brand"

/**
 * Placeholder dashboard for products whose IA hasn't been built yet
 * (currently `exxat-one-schools`, `exxat-one-sites`).
 * They share the routing chrome (sidebar, theme, scope) so the user can see
 * what switching does, but the in-product surfaces are designed in their
 * own briefs (per `docs/multi-product-routing-pattern.md` — "What this doc
 * does not cover").
 *
 * Renders the active product's wordmark + a friendly explainer + a one-tap
 * way back to Exxat Prism, where the working IA lives today.
 */
export default function ProductComingSoon() {
  const { product, productBrandColors } = useProduct()
  const switchProduct = useProductSwitch()
  const brand = brandForProduct(product, null, productBrandColors)

  return (
    <main
      className="flex flex-1 items-center justify-center p-6 md:p-12"
      aria-labelledby="coming-soon-heading"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-secondary-panel-bg text-2xl"
          style={{ color: brand.brandColor }}
        >
          <i className="fa-light fa-compass-drafting" />
        </span>
        <h1 id="coming-soon-heading" className="text-xl font-semibold text-foreground">
          {brand.label ?? `${brand.prefix ?? "Exxat"} ${brand.suffix}`} is coming soon
        </h1>
        <p className="text-sm text-muted-foreground">
          The team is still designing this product&rsquo;s navigation and
          screens. Switch to <strong className="text-foreground">Exxat
          Prism</strong> to keep working with the patterns that ship today,
          or watch this space.
        </p>
        <Button
          type="button"
          onClick={() => switchProduct("exxat-prism")}
          className="mt-2"
        >
          Open Exxat Prism
        </Button>
      </div>
    </main>
  )
}
