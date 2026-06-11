/**
 * Re-exports the Exxat product framework store from `@exxatdesignux/ui`.
 *
 * The store implementation (Zustand instance, migrations, types) lives in
 * the published `@exxatdesignux/product-framework` entry — this shim is
 * kept so existing `@/stores/app-store` import paths still work. New code
 * SHOULD import directly from `@exxatdesignux/product-framework`.
 */

export * from "@exxatdesignux/product-framework"
