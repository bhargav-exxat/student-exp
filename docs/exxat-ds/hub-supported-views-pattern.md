# Hub supported views pattern (Add view parity)

> **Agents:** `.cursor/rules/exxat-hub-supported-views.mdc` (binding). **Reference hub:** Library / All questions (`library-table.tsx`, `library-client.tsx`).

## Problem this solves

`ListPageTemplate` filters **Add view** and Properties view tiles from `supportedViewTypes`. If Column types passes four views but Library passes seven, users see inconsistent menus. If a hub allows Board but has no `board-with-toolbar` renderer, users see **“does not implement Board view”**.

## Canonical allowlist

Import from the registry (single source of truth):

```ts
import { FULL_HUB_SUPPORTED_VIEWS } from "@/lib/data-list-view-registry"
// or
import { LIBRARY_SUPPORTED_VIEWS } from "@/lib/library-supported-views" // alias of FULL
```

Seven views: **table**, **list**, **board**, **dashboard**, **folder**, **panel**, **tree-panel**.

`HubTable` and `ListPageTemplate` use this list when `supportedViewTypes` is omitted.

`PRIMARY_HUB_SUPPORTED_VIEWS` (four views) remains for hubs that intentionally omit folder/panel/tree — document that in `lib/<entity>-supported-views.ts`.

## Wiring checklist

1. **`ListPageTemplate`** — `supportedViewTypes={FULL_HUB_SUPPORTED_VIEWS}` (or entity alias).
2. **`HubTable`** — same allowlist (or omit on both).
3. **List** — `renderListRow` returning **`ListPageBoardCard`** `layout="row"` (copy from `library-table.tsx`).
4. **Board** — `renderBoardCard` + `boardGroups` and/or `renderers["board-with-toolbar"]`.
5. **Dashboard** — `renderers["dashboard-with-toolbar"]` with **`KeyMetrics`** on filtered rows.
6. **Folder / panel / tree** — explicit `renderers` entries (Library reference) or **`LibraryTable`** for `LibraryItem` rows.

## Special cases in this app

| Hub | Pattern |
|-----|---------|
| **Library / All questions** | `LibraryTable` + `LIBRARY_SUPPORTED_VIEWS` — reference |
| **Column types** | `LibraryTable` with `columnDefs` + `hubLabels` + `DEFAULT_LIBRARY_FOLDERS` — custom table, shared other views |
| **Tokens & themes** | `FULL_HUB_SUPPORTED_VIEWS` + `tokens-hub-auxiliary-views.tsx` |
| **New entity hub** | Start from `library-table.tsx` or token/columns references; never table-only unless approved |

## Anti-patterns

- `supportedViewTypes={["table"]}` on a `ListPageTemplate` hub.
- `COLUMNS_SUPPORTED_VIEWS = PRIMARY_HUB_SUPPORTED_VIEWS` without board/folder/panel/tree renderers.
- Minimal `renderListRow` with only stem + `questionId` (not product list UI).

## See also

- `packages/ui/src/lib/data-list-view-registry.ts`
- `docs/exxat-ds/patterns/data-views-pattern.md`
- `apps/web/lib/hub-connected-view-renderers.ts` — `defineHubViewRenderers` dev warnings
