# generated starter payload (`template-vite/`)

**Do not edit shell files here by hand.**

This tree is the npm scaffold payload inside `@exxatdesignux/ui`. The physical
folder is still named `template-vite/` for package compatibility, but it is not
a second builder app. It is generated from the dogfood builder app:

| Source | Command |
|--------|---------|
| `apps/web` (dogfood) | `pnpm sync-ui-template` from monorepo root |

File list: `packages/ui/bin/shell-sync-manifest.mjs`.

`prepack` runs sync before publish. If you change nav, switcher, settings, routes, or onboarding, edit **`apps/web`** and run sync.

Customer apps created with `create-exxat-app` / `exxat-ui init` copy from here;
they update with `exxat-ui upgrade` after a package bump. Upgrade refreshes
package-owned shell/style glue, including predefined product navigation for
Prism, One — Schools, One — Sites, and Design OS. Builder-owned data modules,
tenant catalog, mock/API wiring, and custom pages are preserved.

See `docs/exxat-ds/architecture/0002-builder-app-published-starter.md`.
