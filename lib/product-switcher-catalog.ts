import type { Product } from "@/contexts/product-context"
import { customProductBrandConfig, getProductBrand, productBrandLabel } from "@/lib/product-brand"
import { customSuffixCollidesWithBuiltInProduct } from "@/lib/product-routing"
import { isProductRefHidden, type ProductRef } from "@/lib/product-ref"
import { isListedCustomProduct, type CustomProductBrand } from "@/stores/app-store"

export type SwitcherProductEntry = {
  id: Product
  label: string
  scope?: "Schools" | "Sites"
  customIndex?: number
}

/** Built-in rows for the sidebar switcher + Settings → Products list (custom slots expand at runtime). */
export const BUILTIN_SWITCHER_PRODUCTS: SwitcherProductEntry[] = [
  { id: "exxat-prism", label: "Exxat Prism" },
  { id: "exxat-one-schools", label: "Exxat One — Schools", scope: "Schools" },
  { id: "exxat-one-sites", label: "Exxat One — Sites", scope: "Sites" },
  { id: "exxat-design-os", label: "Design OS" },
  { id: "exxat-custom", label: "Custom product" },
]

/** Settings product rows — same built-ins minus the custom placeholder slot. */
export const BUILTIN_SETTINGS_PRODUCTS: SwitcherProductEntry[] =
  BUILTIN_SWITCHER_PRODUCTS.filter(entry => entry.id !== "exxat-custom")

/**
 * Resolve the active switcher row. When the store product is not in the
 * filtered list (e.g. a built-in missing from an older hard-coded array),
 * synthesize a row from the store instead of falling back to the first entry.
 */
export function resolveActiveSwitcherEntry(
  visibleProducts: SwitcherProductEntry[],
  product: Product,
  activeCustomIndex: number,
  customProducts: CustomProductBrand[],
  isCurrent: (entry: SwitcherProductEntry) => boolean,
): SwitcherProductEntry {
  const matched = visibleProducts.find(isCurrent)
  if (matched) return matched

  if (product === "exxat-custom") {
    const brand = customProducts[activeCustomIndex]
    return {
      id: "exxat-custom",
      label: brand
        ? productBrandLabel(customProductBrandConfig(brand))
        : "Custom product",
      customIndex: activeCustomIndex,
    }
  }

  const builtin = BUILTIN_SWITCHER_PRODUCTS.find(entry => entry.id === product)
  if (builtin && builtin.id !== "exxat-custom") return builtin

  const brand = getProductBrand(product)
  return { id: product, label: brand?.label ?? product }
}

/** Built-in rows + listed custom slots for switcher menus (drops slug collisions). */
export function expandSwitcherProducts(
  customProducts: CustomProductBrand[],
  hiddenProducts: ProductRef[],
): SwitcherProductEntry[] {
  return BUILTIN_SWITCHER_PRODUCTS.flatMap((p): SwitcherProductEntry[] => {
    if (p.id !== "exxat-custom") {
      const ref: ProductRef = { product: p.id }
      if (isProductRefHidden(ref, hiddenProducts)) return []
      return [p]
    }
    return customProducts.flatMap((cp, customIndex) => {
      if (!isListedCustomProduct(cp)) return []
      if (customSuffixCollidesWithBuiltInProduct(cp.suffix)) return []
      const ref: ProductRef = { product: "exxat-custom", customIndex }
      if (isProductRefHidden(ref, hiddenProducts)) return []
      return [{ ...p, label: productBrandLabel(customProductBrandConfig(cp)), customIndex }]
    })
  })
}
