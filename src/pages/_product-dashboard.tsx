import { useProduct } from "@/contexts/product-context"
import Dashboard from "./dashboard"
import ProductComingSoon from "./_product-coming-soon"

/** Per-product dashboard — Prism + custom slots share the real hub; One variants are placeholders. */
export default function ProductDashboard() {
  const { product } = useProduct()
  if (product === "exxat-one-schools" || product === "exxat-one-sites") {
    return <ProductComingSoon />
  }
  return <Dashboard />
}
