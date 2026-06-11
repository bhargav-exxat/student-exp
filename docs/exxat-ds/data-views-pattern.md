# Data views pattern (table, list, board)

> **Canonical rules for agents (MUST/MUST NOT, checklists):** [`AGENTS.md`](../AGENTS.md) in this package (including **§8 Accessibility**). This file is the long-form narrative; keep both aligned when patterns change.

> **Scaling past ~2K rows:** see [`large-dataset-strategy.md`](./large-dataset-strategy.md) for pagination, server-mode upgrade path, and the virtualization follow-up.

This document describes how list pages combine **views**, **toolbar** behavior, **filters**, **properties**, and **persistence** in this codebase.

## Add view parity (seven views)

**Binding:** `.cursor/rules/exxat-hub-supported-views.mdc`. **Detail:** `docs/hub-supported-views-pattern.md`.

Every list hub **should** use **`FULL_HUB_SUPPORTED_VIEWS`** (table, list, board, dashboard, folder, panel, tree-panel) on both **`ListPageTemplate`** and **`HubTable`**, with a working renderer per view. **Library** (`library-table.tsx`) is the reference. Do not ship table-only or four-view allowlists on showcase/catalog hubs unless product documents an exception.

## Reuse existing components (required)

**Prefer composing what already exists** over rebuilding one-off tabs, search, filters, or property panels. The **Placements** flow is the reference implementation; new list/table/board pages should wire the same building blocks with new data and column definitions.

| Need | Reuse | Where Placements uses it |
| --- | --- | --- |
| **View tabs** (table / list / board, lifecycle filters) | `ListPageTemplate` (`ViewTab`, `renderContent`, optional metrics + export) | `components/library-hub-client.tsx` + `components/templates/list-page.tsx` |
| **Table shell** (search, filter bar, sort, grouping, columns, pagination) | `HubTable` → `DataTable`, `DataTableToolbar`, `useTableState` | `components/data-table/`, `components/data-views/hub-table.tsx`, `components/columns-showcase.tsx` |
| **Properties drawer** (display, columns, filters, sort, view type tiles) | `TablePropertiesDrawer` from `@/components/table-properties` (auto-wired by `HubTable`) | `DrawerToolbar` / list–board shells in `library-table.tsx` |
| **Board / list** | `PlacementsBoardView`, `PlacementListRowContent` (wrapped by `HubTable.renderListRow` → `DataRowList`) + same `useTableState` | `PlacementsTable` |
| **Page header** (primary CTA + More ⋯ + export) | Per-hub page header composing `PageHeader` + `ExportDrawer` button | `components/library-page-header.tsx` |
| **Primary hub composition** | `*Client` = `ListPageTemplate` + `KeyMetrics` + `*PageHeader` + `*Table`. Reference: `LibraryHubClient`. | `components/library-hub-client.tsx`, `components/columns-client.tsx`, `components/tokens-themes-client.tsx` |
| **Hub table body** | `HubTable` — wraps `DataTable` + `useTableState` + `TablePropertiesDrawer`; list / board / dashboard read **`tableState.rows`**. Pagination chrome is auto-mounted when the hub passes `pagination` + `onPaginationChange`. | `components/data-views/hub-table.tsx`, `components/library-table.tsx`, `components/columns-showcase.tsx` |
| **Dashboard view (list tab)** | **`KeyMetrics`** (`variant="flat"` or `"card"`) — same KPI system as the template metrics strip; **do not** add ad-hoc `Card` grids for entity summaries. | `LibraryTable` dashboard branch, `components/library-dashboard-charts.tsx` |
| **List hub metrics strip** | **`KeyMetrics variant="flat"`** — transparent cells, OKLCH brand glow only, border hairlines (**no** grey panel) | **`docs/kpi-flat-band-pattern.md`**, Placements / Team / Library clients |
| **Secondary panel chrome** | **`--secondary-panel-bg`** on **`NestedSecondaryPanelShell`** (lighter than sidebar, follows active product) | **`docs/shell-surface-elevation-pattern.md`**, Library |
| **Export** | `ExportDrawer` | `ListPageTemplate` export props; `PlacementsClient` |
| **View body layout** (gutter + centered max-width for folder / icon / panel-style content) | **`ListPageViewFrame`** (`components/data-views/list-page-view-frame.tsx`, re-exported from `components/data-views`) | **`FolderGridView`** (uses the frame); **`LibraryOsFolderView`** — see **`AGENTS.md` §4.5** |

**Rules:** (1) Import and compose these components; pass **props** and **column defs** for your entity. (2) If something is missing, **extend the shared component** under `components/` (e.g. a new optional slot on `DataTableToolbar`) rather than copying markup into a single page. (3) Card-only or lightweight pages may use a smaller **Properties** sheet only when there is **no** table—otherwise use `TablePropertiesDrawer` with `DataTable` (see Team).

### Table pages must use view tabs

If the page uses a **`DataTable`** (or equivalent data grid) as the main surface, it **must** sit under **`ListPageTemplate`** so users get the **views toolbar** (tabs, add view, per-tab settings). The default `ViewTab` entries should include at least one tab whose `viewType` is **`table`** when the primary experience is tabular data. **Do not** render a `DataTable` alone under only `PageHeader` + body.

- **Reference:** `PlacementsClient` (Placements) and `TeamClient` (Team).
- **Rationale:** Consistent navigation, saved views, per-tab view type (table / list / board), and export at the template level.

## View layout frame (centered, reusable)

Non-table view branches (e.g. **folder** icon grid, **panel** finder, OS-style folder explorer) **should** use **`ListPageViewFrame`** for the same horizontal gutter and optional **`max-w-*`** centering as other hubs — **not** hand-copied `mx-4 lg:mx-6` + `mx-auto max-w-6xl` in each `*-table.tsx`. New view types belong in **`components/data-views/`** as **generic** components with render props; hub tables only wire **`tableState.rows`** and callbacks.

**Handbook:** **`AGENTS.md` §4.5**. **Cursor:** **`.cursor/rules/exxat-list-page-view-shells.mdc`**. **Skill:** **`.cursor/skills/exxat-list-page-view-shells/SKILL.md`**. **Do not** wrap **`DataTable`** in the frame if that stacks padding with the table toolbar (**`AGENTS.md` §5**).

## Architecture

- **Page shell** — `ListPageTemplate` owns the views toolbar (tabs), optional metrics, and export drawer. Content for the active tab is rendered via `renderContent`.
- **Per–lifecycle (or category) data** — `PlacementsTable` swaps **columns** and **row sets** based on `lifecycleTabId` (e.g. All / Upcoming / Ongoing / Completed). Each lifecycle tab gets its **own** `PlacementsTable` instance (`key={tab.filterId}`) so `useTableState` resets correctly when columns change.
- **Shared table state** — `useTableState` holds sort, search, filters, grouping, column order/visibility/pins/widths, row height, gridlines, and pagination flags. **Table**, **list**, **board**, and **dashboard** all read the same state so switching view type keeps behavior aligned.

## Mock data and connected views

1. **Put entity rows in `lib/mock/<entity>.ts`** — Export a typed array (e.g. `TeamMember[]`, `Placement[]`) and reuse it from the page client and from KPI helpers.
2. **KPI / summary helpers** — Add `lib/mock/<entity>-kpi.ts` (or next to the mock file) with pure functions **`entityKpiMetrics(rows: T[])`** and **`entityKpiInsight(rows: T[])`** returning `MetricItem[]` and `MetricInsight` from `@/components/key-metrics`. Set **`MetricItem.trendPolarity`** when an increase is **not** favorable (see **`docs/kpi-trend-pattern.md`**). Drive **both** the template **`metrics`** slot and the **dashboard view** from the **same helpers**, passing **`tableState.rows`** in the table component so filters/search apply everywhere.
3. **Single table component** — One component (e.g. `TeamTable`) receives **`members`** (full mock) + **`view`**. It calls **`useTableState(members, columns, …)`** once. Branch on `view`:
   - **`table`** → `DataTable` with that state.
   - **`list` / `board`** → `DataTableToolbar` + list/board UI with **`tableState.rows`**.
   - **`dashboard`** → `DataTableToolbar` + **`KeyMetrics`** (and/or other **existing** dashboard building blocks — `ChartsOverview` only when charts are product-appropriate) fed by **`teamKpiMetrics(tableState.rows)`** / **`teamKpiInsight(tableState.rows)`** — **not** bespoke `Card` grids duplicating KPIs.
4. **Client wiring** — `renderContent` always renders the table component with **`view={tab.viewType}`** and **`key={tab.id}`** (not `viewType`) so switching views does not remount state. **Do not** show “not wired” placeholders for list/board/dashboard when the table stack supports those views.
5. **Full-route dashboards** — The **`/dashboard`** page uses **`DashboardTabs`**, **`KeyMetrics`**, and **`ChartsOverview`** with `lib/mock/dashboard.ts`. List-page **dashboard view** is a **narrower** slice: reuse **`KeyMetrics`** (+ entity KPI helpers) first; add charts only when they match the entity and reuse **`ChartsOverview`** patterns from `components/charts-overview.tsx`.

## Table vs list vs board vs dashboard

| Concern | Table | List | Board | Dashboard (view tab) |
| --- | --- | --- | --- | --- |
| Primary surface | `DataTable` | `DataRowList` + entity row body (e.g. `PlacementListRowContent`) wired via `HubTable.renderListRow` | `PlacementsBoardView` / entity board | **`KeyMetrics`** (+ optional charts via shared dashboard components) |
| Data source | `useTableState` | **`tableState.rows`** | **`tableState.rows`** | **`tableState.rows`** via KPI helpers |
| Column headers / labels | `showColumnLabels` | Same source columns, list layout | Phase columns + optional board column menu | N/A (metrics from same columns/filters) |
| Row click / navigation | From `PlacementsTable` | From list shell | Card `onOpen` | N/A |
| Pagination | Optional `PaginationBar` + `CountSyncer` | Same pattern | N/A (board uses phase columns) | N/A |

## Toolbar and properties

- **Search** — Global quick search lives in table state (`search` / `showToolbarSearch` from display options). Board phase columns can add local search in the board column header.
- **Filters** — Built from `ColumnDef.filter` and `filterFields` passed to `TablePropertiesDrawer`. Connectors between filters (`and` / `or`) are part of table state.
- **Sort / group** — Sort rules and `groupBy` are in table state; board menu proxies the same actions when `boardColumnMenu` is wired.
- **Properties drawer** — `TablePropertiesDrawer` is **generic**: supply `filterFields`, `fieldDefinitionsForDrawer`, `resolveColumnLabel`, `activeFilters`, sort/column handlers, `displayOptions`, and optional view-type tiles. Domain-specific defaults (e.g. `FILTER_FIELDS` in `types.ts`) are optional; new pages can pass their own definitions.

**Import:** `@/components/table-properties` re-exports the drawer and types.

## Dropdown menus (view settings, row actions)

**`DropdownMenuContent`** in **`@exxatdesignux/ui`** merges a **default surface** (**`DROPDOWN_MENU_CONTENT_SURFACE_CLASS`**: **`min-w-52 w-max max-w-[min(24rem,calc(100vw-2rem))]`**) so **ListPageTemplate** view settings / Add view, **`DataTable`** filter and column menus, and hub **row ⋯** menus size to their labels (including shortcut hints) without fixed **`w-40` / `w-48`** rails. Sizing is **pure CSS** — do **not** add **`ResizeObserver`** or per-open measurement for standard menus.

**Override** when product intent needs a fixed width (e.g. pagination **page size** **`w-20`**, **`NavUser`** trigger-width + **`min-w-60`**, school switcher **`!w-max min-w-72 …`**).

## Board UI reuse

**Handbook:** **`AGENTS.md` §4.4** — board card shell, badge row, shared status maps, and MUST/MUST NOT. **Cursor:** **`.cursor/rules/exxat-board-cards.mdc`**, skill **`.cursor/skills/exxat-board-cards/SKILL.md`**.

- **Card shell** — `components/data-views/list-page-board-card.tsx` — **`ListPageBoardCard`**, **`ListPageBoardCardHeader`**, **`ListPageBoardCardTitleRow`**, **`ListPageBoardCardAvatar`**, **`ListPageBoardCardBadgeRow`**, **`ListPageBoardCardBody`**, **`ListPageBoardCardSecondary`**. All product board cards on list hubs **should** use this shell (same **`Card` `size="sm"`** pattern as Placements).
- **Primitives** — `components/data-views/board-card-primitives.tsx` — `BoardCardIconRow`, `BoardCardTwoLineBlock` (optional `line2`), `BoardNewCardPlaceholder`, `lineClampClass`.
- **Status (Team & Compliance)** — `lib/list-status-badges.ts` — single source for label strings + badge `className` tails for **table, list, and board**. Do **not** pair with `uppercase` on the Badge (labels are sentence case, aligned with Placements `BoardStatusBadge`).
- **Owner initials** — `lib/initials-from-name.ts` when mock rows have a display name but no `initials` field.
- **Shared column shell** — `components/data-views/list-page-board-template.tsx` — `ListPageBoardTemplate` + `ListPageBoardColumnDef<T>`: define columns with `filter` predicates, `renderCard`, `getRowKey`. Used by **Team** and **Compliance** boards; new hubs should start here before custom chrome.
- **Library board** — `components/library-board-view.tsx` — composes **`ListPageBoardCard`** parts with `BoardCardTwoLineBlock` for the body and `ListHubStatusBadge` for the status row. Use this as the reference for any new domain board card.
- New entities should add their own card component that composes **`ListPageBoardCard`** + primitives rather than duplicating column scroll/layout or ad-hoc card chrome.

## Dashboard view (list pages)

- **Reuse the dashboard chart bundle** — `components/dashboard-report-charts.tsx` — `DashboardReportCharts`: flat `KeyMetrics` + middle chart section + period comparison `KeyMetrics` card. **`ChartsOverview`** is the default middle section for `/dashboard`. Hubs pass **`chartsSection={<MyDashboardChartsSection rows={tableState.rows} />}`** so charts reflect the hub's own row set. Reference: **`LibraryDashboardChartsSection`** in `components/library-dashboard-charts.tsx`. Chart **style** can follow `ChartVariantProvider` when using `ChartsOverview`.
- **Data tab canvas charts** share **`ChartFigure`**, **`ChartCard`**, and **`ChartDataTable`** with `charts-overview.tsx`. **Layout** is stored in one place: **`lib/data-view-dashboard-storage.ts`** under a per-hub scope (see `AGENTS.md` §4.3). **Keyboard-selected bars/slices** must use **`lib/chart-keyboard-selection.ts`** (`activeBar` / `activeShape`) so behavior matches the gallery — not opacity-only `Cell` dimming.

## Persistence

- **Page-level** (`lib/data-list-persistence.ts`, key `exxat-ds:data-list:page:v1`): `displayOptions`, `showMetrics`, `tabs`, `activeTabId`. Loaded in `PlacementsClient` with `useLayoutEffect`, saved debounced on change. `ListPageTemplate` runs in **controlled** mode when `tabs` / `onTabsChange` / `activeTabId` / `onActiveTabChange` are passed.
- **Per–lifecycle tab** (key `exxat-ds:data-list:lifecycle:v1:<filterId>`): sort, search, filters, group by, column order/hidden/widths/pins/wrap, column menu search map, row height, gridlines, filter bar visibility, search popover, conditional rules, pagination toggle and page/size. Hydrated in `PlacementsTable` with `useLayoutEffect`; saved debounced when those fields change.

To add a new page: copy the `PlacementsClient` pattern (controlled `ListPageTemplate` + storage key namespace) or call `schedulePageSave` / `scheduleLifecycleSave` with your own keys.

## Rules of thumb

1. **One `useTableState` per logical table** — Remount with `key` when the column set or entity context changes.
2. **Don’t fork filter/sort UX** — Reuse `TablePropertiesDrawer` and `DataTableToolbar` patterns so accessibility and behavior stay consistent.
3. **Boards derive from the same columns** — `boardColumns` / `hiddenColKeys` should reflect table `displayCols` so “hide column” and “properties” stay in sync.
4. **Persist stable JSON** — Version objects with `v: 1` and keep keys namespaced to allow migrations later.

---

## Required UX for dense lists (10+ items)

When a page shows a **list**, **table**, or **card grid** with **more than 10 items**, it must expose:

| Capability | Table / list / board | Card-only pages (no `DataTable`) |
| --- | --- | --- |
| **Search** | Toolbar search + column quick-search where applicable | At least one search control filtering the visible set |
| **Filter** | Filter bar + `TablePropertiesDrawer` filters | Filters in toolbar or in Properties, as appropriate to the content |
| **Sorting** | Column sort / sort rules in drawer | User-visible sort (e.g. name, date, role) |
| **Properties** | `TablePropertiesDrawer` (columns, display, filters, sort) | A **Properties** entry point (sheet or drawer) for view options — same *role* as table properties, even if the UI is simpler |

Below the threshold, these may be omitted unless the page is a primary data hub (see below).

---

## Data pages: primary CTA + More + Export

If the page **has exportable data** (rows, members, library items, etc.), follow the **Library** header pattern:

1. **Primary action** — One default (filled) button for the main task (e.g. **New question**, **Invite collaborator**, **Add token**). Do **not** use `variant="outline"` for that primary action.
2. **More (⋯)** — An outline **icon** button opening a menu that includes **Export** (and other overflow actions). Wire **Export** to `ExportDrawer` (or equivalent).
3. **Subtitle** — Prefer a short line with **count + freshness** (e.g. `24 records · Last updated now`), matching `PlacementsPageHeader`.

Reference: `components/library-page-header.tsx`, `components/library-hub-client.tsx`.

---

## Page vs drawer (actions and auxiliary views)

**When to use a drawer or sheet:** The user needs **the surrounding page** (list, hub, or parent task) to stay **visible for context** *and* they need a **quick view**, **quick actions**, or a **short auxiliary step** — e.g. table properties, export, a brief row summary, or “change one setting and dismiss.”

**When to use a new page (route):** The flow is **primary**, **long-form**, **multi-step**, or should have its **own URL** / bookmark / history **without** the parent page behind it — e.g. full create/edit, wizards, or detail that *is* the task.

**Rule of thumb:** **Context + quick** → **drawer**; **blocking short choice** → **dialog**; **otherwise** → **new page**.

**Modal vs side panel (same route):** When the overlay stays on the same URL, prefer **`docs/drawer-vs-dialog-pattern.md`** and **`.cursor/rules/exxat-drawer-vs-dialog.mdc`** — drawers keep the hub visible; dialogs trap focus for confirms.

Canonical rules: **`AGENTS.md` §6.4**, root **`.cursor/rules/exxat-page-vs-drawer.mdc`**, **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**.

---

## Primary pages with large datasets

When a route is a **primary** destination in nav (main hub for an entity) **and** the dataset is **large** or **highly interactive**:

- Use the **primary page template**: `ListPageTemplate` (tabs, metrics strip, export drawer at template level) + data client pattern as in **`PlacementsClient`** / **`PlacementsTable`** — not a minimal `PageHeader`-only layout.
- Smaller satellite pages may use **`PageHeader` + section content**; once the dataset grows past the dense-list threshold, add the toolbar rules above and consider promoting to the full template if the page becomes a main hub.

---

## Summary checklist

- [ ] **Reuse** — Tabs, search, filters, and property UI come from **`ListPageTemplate`**, **`DataTable` / `useTableState`**, **`TablePropertiesDrawer`**, and related Placements modules—not ad-hoc duplicates.
- [ ] **Table + tabs** — Any **`DataTable`** is wrapped in **`ListPageTemplate`** (view tabs), not only `PageHeader` + body.
- [ ] **>10 items** → search, filter, sort, properties (per surface type above).
- [ ] **Has data to export** → **More** menu with **Export** + shared `ExportDrawer` pattern.
- [ ] **Primary + large / main hub** → `ListPageTemplate`-style shell where applicable.
- [ ] **Page vs drawer vs dialog (§6.4)** — Quick with parent **context** → drawer/sheet; **blocking** confirm → **dialog**; primary or long flows → **new route** (`docs/drawer-vs-dialog-pattern.md`).
- [ ] **Primary button** → `Button` default variant (`size="lg"` for parity with Placements), not outline.
- [ ] **Dashboard view tab** → `KeyMetrics` + shared KPI helpers from **`tableState.rows`**; no duplicate one-off metric cards.
- [ ] **Data view charts** → `ChartFigure` + `chart-keyboard-selection`; layout persistence via **`data-view-dashboard-storage`** (see `AGENTS.md` §4.3).
- [ ] **Mock + KPIs** → Entity rows in **`lib/mock/`**; **`entityKpiMetrics` / `entityKpiInsight`** consumed by template metrics and dashboard view.
