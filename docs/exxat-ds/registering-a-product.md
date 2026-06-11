# Registering a product (customer apps)

> **Public API:** `@exxatdesignux/product-framework`
> — `defineProduct()`, `registerProducts()`, `listRegisteredProducts()`,
> `getRegisteredProduct()`, `getRegisteredProductBySlug()`.
>
> **Pairs with:** [`multi-product-routing-pattern.md`](./multi-product-routing-pattern.md)
> (URL roots, switch behaviour, `persistKey` namespacing).

`@exxatdesignux/ui` ships four built-in Exxat products
(`exxat-prism`, `exxat-one-schools`, `exxat-one-sites`, `exxat-custom`).
Customer apps that need to ship their own product (e.g. **Survey**,
**Onboarding**, an internal admin console) register it through the
**product registry** rather than forking the framework.

A registered product gets:

1. A **URL root** (`/<slug>/...`).
2. A slot in the **product switcher** (next to the built-ins).
3. A **sidebar entry** that renders from the registered nav tree.
4. A **brand colour + wordmark** painted into the `data-product=<slug>`
   shell surfaces.
5. A `persistKey` prefix (`<slug>:<hub-key>`) so its hub state never
   bleeds into a sibling product's localStorage.

## Defining a product

```ts
// app/products/exxat-survey.ts
import { defineProduct } from "@exxatdesignux/product-framework"

export const exxatSurveyProduct = defineProduct({
  id: "exxat-survey",
  slug: "survey",
  label: "Exxat Survey",
  scope: "school > program",
  brand: {
    accent: "oklch(0.66 0.18 28)",            // canonical brand accent
    wordmark: "Survey",                        // visible suffix on the logo
  },
  nav: [
    {
      id: "survey-dashboard",
      title: "Dashboard",
      url: "/survey/dashboard",
      icon: "fa-light fa-gauge-high",
    },
    {
      id: "survey-responses",
      title: "Responses",
      url: "/survey/responses",
      icon: "fa-light fa-table",
    },
    {
      id: "survey-templates",
      title: "Templates",
      url: "/survey/templates",
      icon: "fa-light fa-file",
    },
  ],
})
```

### Field reference

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Globally unique product id. Reverse-domain style (`<org>-<product>`) is the convention. Used in the Zustand store, in `data-product` attributes, and as the brand registry key. |
| `slug` | yes | URL-safe segment for the product root (`/<slug>/...`). Must NOT collide with the reserved segments (`auth`, `login`, `oauth`, `_`, `api`, `settings/profile`). |
| `label` | yes | Display name shown in the product switcher and in copy that references the product by name. |
| `scope` | yes | One of `"school > program"`, `"brand > site > location"`, `"school > batch > student"`. Drives the scope chrome the shell paints next to the switcher. |
| `brand` | optional | `{ accent: <OKLCH>, wordmark?: <string>, gradient?: <CSS gradient> }`. Falls back to the neutral brand registry entry if omitted. |
| `nav` | yes | Array of `ProductNavLink` rows (same shape as `NavLinkItem` — title, url, icon, badge, subItems, secondaryPanel). Rendered in the sidebar when the product is active. |
| `personaHeading` | optional | Persona name (verbatim from `personas.md`) for the design brief template. Helps `exxat-senior-ux` enforce persona-correct UI. |

`defineProduct()` is a thin validator + identity function; it returns the
same object back so you can keep it as an exported constant for type
inference at the registration site.

## Registering products on startup

Call `registerProducts()` ONCE at module load, before the router mounts.
The function is idempotent for matching ids (re-registering with the same
shape is a no-op; re-registering with a different shape throws).

```tsx
// app/main.tsx — entry point
import { registerProducts } from "@exxatdesignux/product-framework"
import { exxatSurveyProduct } from "./products/exxat-survey"
import { onboardingProduct } from "./products/onboarding"

registerProducts([exxatSurveyProduct, onboardingProduct])

// …then render your router
```

In a customer app that ALSO uses one or more built-in Exxat products,
register the customer products alongside — the built-ins stay listed in
the switcher automatically (they're seeded by the package).

## Routing — the shell picks up the registered product

The shell uses three router-aware primitives from
`@exxatdesignux/ui/components/shell`. Wire them once in the root router:

```tsx
// app/router.tsx
import {
  ProductProvider,
  ProductRouteSync,
  ProductRootGate,
  DefaultProductRedirect,
} from "@exxatdesignux/ui/components/shell"

const router = createBrowserRouter([
  {
    element: (
      <ProductProvider>
        <ProductRouteSync />
        <Outlet />
      </ProductProvider>
    ),
    children: [
      { path: "/", element: <DefaultProductRedirect /> },
      {
        path: "/:productRootSegment/*",
        element: <ProductRootGate loadingFallback={<DashboardLoadingFallback />} />,
        children: [
          // …per-product routes resolve against the active slug
        ],
      },
    ],
  },
])
```

`ProductRootGate` validates `:productRootSegment` against the **union of
built-in slugs and the registered slugs**. Unknown segments fall back to
the user's configured default product after the persisted store has
hydrated.

`<ProductRouteSync />` keeps the URL segment, the active product in the
Zustand store, and the `data-product` attribute on `<html>` all aligned
— bidirectionally.

## `persistKey` namespacing

Every hub that uses `<HubTable persistKey>` / `<ListPageTemplate persistKey>`
or `usePersistedState()` should namespace its key with the product slug
so different products never share a localStorage slot:

```tsx
import { productPersistKey } from "@exxatdesignux/product-framework"

<HubTable persistKey={productPersistKey(productId, "responses")} />
// → "survey:responses" when productId === "exxat-survey"
```

The helper takes the active product id and the hub key; the final
localStorage entry after the DS prefix is `exxat-ds:<slug>:<hub>`.

## What you DO NOT need to do

- **Modify the package.** The registry is the public extension point;
  forking framework code defeats the upgrade path.
- **Edit `app-store.ts`.** The Zustand store, its migrations, and the
  hydration logic live in the package and are upgraded with each release.
- **Re-implement the product switcher.** The switcher reads from the
  registry; your product appears automatically.

## When to push back to the package owners

Open an issue (or contribute a PR) if you find yourself needing:

- A **new scope hierarchy** (something other than the three documented above).
- A **new switcher slot type** that the registry doesn't model.
- A **shell primitive** that's not exposed (something inside
  `app-sidebar.tsx`, `site-header.tsx`, or the product switcher chrome).

The framework lift in 0.6.0 was deliberately conservative — only the
framework (store + routing + brand registry) moved. Visual chrome remains
in app code so app authors keep control over how their shell looks.

## See also

- [`multi-product-routing-pattern.md`](./multi-product-routing-pattern.md)
  — URL shape, switch behaviour, the four binding rules.
- [`.cursor/rules/exxat-product-context.mdc`](../.cursor/rules/exxat-product-context.mdc)
  — the `Product:` / `Scope:` / `Persona:` brief lines every design task declares.
- [`.cursor/rules/exxat-product-routing.mdc`](../.cursor/rules/exxat-product-routing.mdc)
  — the binding routing rules (subpath per product, hard-redirect on switch,
  product-namespaced `persistKey`).
