/**
 * Shim — re-exports ProductProvider + useProduct from `@exxatdesignux/ui`.
 * New code SHOULD import directly from `@exxatdesignux/ui/components/shell`.
 */

export {
  ProductProvider,
  syncActiveProductThemeFromStore,
  useProduct,
  type Product,
} from "@exxatdesignux/ui/components/shell"
