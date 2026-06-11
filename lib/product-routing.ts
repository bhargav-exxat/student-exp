/**
 * Shim — re-exports product-routing helpers from `@exxatdesignux/product-framework`.
 * New code SHOULD import directly from the package.
 */

export {
  RESERVED_PRODUCT_ROOT_SEGMENTS,
  customProductSlugFromSuffix,
  customSuffixCollidesWithBuiltInProduct,
  isBuiltInProductSlug,
  isReservedProductRootSegment,
  productRouteSlug,
  resolveProductFromPath,
  validateCustomProductSuffix,
  type ResolvedProductRoute,
} from "@exxatdesignux/product-framework"
