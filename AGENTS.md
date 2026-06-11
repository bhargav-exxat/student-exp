# Exxat DS — agent handbook (humans & AI)

**Purpose:** One place for product patterns so tools (Cursor, Codex, etc.) and contributors apply the same rules. **Imperative sections** use MUST / MUST NOT / SHOULD so they are easy to parse.

**Scope:** The Vite reference app in this directory. **Path:** If your workspace root is only this folder, use **`./AGENTS.md`**. If the workspace is the parent monorepo, use **`apps/web/AGENTS.md`** (this file).

> **First-time reader?** Open **`docs/HANDBOOK.md`** first — it's a 10-minute orientation that links into the right section here. This file is the **authoritative §-numbered manual**; the handbook is the map. Other quick entry points: **`docs/glossary.md`** (shared vocabulary), **`docs/voice-and-tone.md`** (copy rules), **`docs/reference-implementations.md`** (canonical reference pages).

Cross-cutting Cursor rules also live in the repo root `.cursor/rules/` (data tables, keyboard hints, accessibility) when the parent repo is open.

---

## 1. How to use this file (for AI agents)

1. **Before** adding or changing a **list, table, board, or data-heavy page**, read **§3–§6** (including **§6.4** drawer vs dialog vs route when scoping overlays and flows) and run the **§13 checklist**.
2. **Before** changing **keyboard hints or shortcuts**, read **§7** and root `.cursor/rules/exxat-kbd-shortcuts.mdc`.
3. **Before** changing **table behavior**, read **§3** and root `.cursor/rules/exxat-data-tables.mdc`. **Before** wiring **`TablePropertiesDrawer`** on **`ListPageTemplate`** (view tabs), read **§4.2** and **`.cursor/rules/exxat-table-properties-drawer.mdc`**.
4. **Before** building or changing **tabs, nav, dialogs, icon-only controls, or color/contrast**, read **§8** and **`.cursor/skills/exxat-accessibility/SKILL.md`** (from monorepo root when the parent repo is open).
5. **Before** adding or changing **Data view charts** (dashboard tab on list hubs) or **graph keyboard styling**, read **§4.3** and **`apps/web/.cursor/rules/exxat-dashboard-view-charts.mdc`**.
6. **Before** adding or changing **board (kanban) cards** on list hubs, read **§4.4** and the **`exxat-board-cards`** skill (**`.cursor/skills/`** or **`.claude/skills/`** at repo root — same content).
7. **Before** adding **folder, panel, or other non-table view bodies** (centered grids, reusable shells), read **§4.5** and **`.cursor/rules/exxat-list-page-view-shells.mdc`** / **`.cursor/skills/exxat-list-page-view-shells/SKILL.md`**.
8. **Before** adding or changing **Font Awesome** icons in app UI, read **`.cursor/rules/exxat-fontawesome-icons.mdc`** (Kit subsetting, weights, **`aria-hidden`** on **`<i>`**).
9. **Before** rendering **record IDs, question IDs, or other system identifiers**, read **`.cursor/rules/exxat-mono-ids.mdc`** and **`.cursor/skills/exxat-mono-ids/SKILL.md`** (**`font-mono tabular-nums`**).
10. **Before** adding a **primary nav row** that opens a **nested secondary nav panel** (Library style), read **§4.6** and **`.cursor/rules/exxat-primary-nav-secondary-panel.mdc`**.
11. **Before** adding **shared access / invite collaborators** on a hub (face stack + invite sheet), read **§4.7** and **`.cursor/rules/exxat-collaboration-access.mdc`** / **`.cursor/skills/exxat-collaboration-access/SKILL.md`**.
12. **Before** adding **onboarding tours, feature walkthroughs, or coach marks**, read **§11** and `references/coach-marks.md`.
13. **Before** changing the **global command palette (⌘K)** or search/AI entry UX, read **§7.1** and **`docs/command-menu-pattern.md`**.
14. **Before** choosing **drawer vs dialog vs new page** for a task flow, read **§6.4**, **`docs/data-views-pattern.md`** (Page vs drawer), and **`docs/drawer-vs-dialog-pattern.md`** (modal vs side panel on the same route).
15. **Before** adding **success/error/confirmation feedback**, read **§6.5** and **`.cursor/rules/exxat-no-toast.mdc`** (no toast or snackbars).
16. Prefer **composing existing components** over new one-off UI. If something is missing, **extend** shared components under `components/`, not a single page file.
    - **MUST** scan `components/` (especially `components/ui/`, `components/data-views/`, `components/templates/`, `components/key-metrics.tsx`, `components/page-header.tsx`, and the charts/banner/dot-pattern surfaces) **before** writing any new UI. If a primitive or composition already exists, **use it** — don't build a parallel one.
    - **Examples of existing surfaces to reuse:** card grid → `ListPageBoardCard` + `BoardCardIconRow` / `BoardCardTwoLineBlock`; AI / dot animation → `AiThinkingOverlay` + `DotPattern`; search input → `InputGroup` + `InputGroupAddon` + `InputGroupInput`; page title → `PageHeader` (serif via `font-heading`); list hub shell → `ListPageTemplate` (`metrics`, `defaultTabs`, `renderContent`); metrics strip → `KeyMetrics`; **view body gutter + centered max-width** → **`ListPageViewFrame`** (**§4.5**); **shared access / invite** → **`PageHeader` `variant="collaboration"`** + **`InviteCollaboratorsDrawer`** (**§4.7**).
    - **If** nothing fits and you would add a **new shared primitive or large bespoke widget**: **ask the user** for direction first — **`.cursor/rules/exxat-reuse-before-custom.mdc`** (unless the task already explicitly approved a greenfield build).
17. **Match** naming, imports, and patterns of the nearest reference implementation (usually Placements).
18. **Before** adding entity **mock data**, a **new view tab**, or **detail/inspector** panels on a list hub, read **`.cursor/rules/exxat-centralized-list-dataset.mdc`** and **`.cursor/skills/exxat-centralized-list-dataset/SKILL.md`** (single **`useTableState`** row bag for every view; **no** parallel mock arrays per view).
19. **Before** choosing **cards vs table rows vs simple lists** for a hub, read **`docs/card-vs-rows-pattern.md`** and **`.cursor/rules/exxat-card-vs-list-rows.mdc`**.
20. **Before** adding **`KeyMetrics`** strips on list hubs or dashboard key-metrics cards, read **`docs/kpi-strip-max-four-pattern.md`** and **`.cursor/rules/exxat-kpi-max-four.mdc`** (at most **four** tiles).
21. **Before** styling **`KeyMetrics variant="flat"`** (list hub metrics strip, dashboard mix KPI band), read **`docs/kpi-flat-band-pattern.md`** and **`.cursor/rules/exxat-kpi-flat-band.mdc`** / **`.cursor/skills/exxat-kpi-flat-band/SKILL.md`** (transparent band, OKLCH glow, border hairlines only).
22. **Before** changing **secondary panel** or **sidebar** brand chrome, read **`docs/shell-surface-elevation-pattern.md`** and **§4.6** ( **`--secondary-panel-bg`**, active product theme).
23. **Before** adding **new shared UI primitives** or bespoke widgets when nothing in **`components/`** fits after scanning, follow **`.cursor/rules/exxat-reuse-before-custom.mdc`** — **ask the user** for direction unless the task already approved a greenfield build.
24. **Before** introducing a **color, spacing, radius, or shadow value** in JSX `className`, inline `style`, CSS, or a `cn()` / `clsx()` argument, read **`docs/token-taxonomy.md`** and **`.cursor/rules/exxat-token-discipline.mdc`**. **New code SHOULD reach for the L0 Exxat namespace first** (`var(--exxat-color-surface-1)`, `bg-surface-1`, `bg-brand-1`, `rounded-2`, …) — the older shadcn-style names (`--background`, `bg-brand`, `rounded-md`, …) remain as L1 aliases and continue to work. No hex literals in app code; check `packages/ui/tokens/hooks-index.json` for available tokens + deprecations (163 tokens · 36 namespaces). ESLint catches violations via `exxat-ds/no-hex-color` + `exxat-ds/no-deprecated-tokens` (plugin: **`@exxatdesignux/eslint-plugin`**).
25. **Before** adopting any pattern from a **sibling Salesforce / SLDS / LWC** repo (e.g. `design-system-2-starter-kit`), read **`.cursor/rules/exxat-no-slds-leakage.mdc`**. **No** `slds-*` classes, **no** `<lightning-*>` markup, **no** synthetic-shadow assumptions, **no** SLDS token names (`--slds-g-color-*`). Document architectural ideas as Exxat blueprints (`docs/blueprints/`) instead of copying SLDS code.

**Longer narrative and architecture:** `docs/data-views-pattern.md`, `docs/drawer-vs-dialog-pattern.md`, `docs/card-vs-rows-pattern.md`, `docs/kpi-strip-max-four-pattern.md`, **`docs/kpi-flat-band-pattern.md`**, **`docs/shell-surface-elevation-pattern.md`**, `docs/command-menu-pattern.md`, `docs/collaboration-access-pattern.md` (keep in sync with this handbook for big refactors).

---

## 2. Rule precedence

1. **User / task instructions** in the current session (highest).
2. This **`AGENTS.md`** for Exxat DS product patterns.
3. **`.cursor/rules/*.mdc`** at repo root (`exxat-data-tables`, `exxat-list-page-connected-views`, `exxat-centralized-list-dataset`, `exxat-list-page-view-shells`, `exxat-table-properties-drawer`, `exxat-board-cards`, `exxat-page-vs-drawer`, `exxat-drawer-vs-dialog`, `exxat-card-vs-list-rows`, `exxat-kpi-max-four`, `exxat-reuse-before-custom`, `exxat-no-toast`, `exxat-kbd-shortcuts`, `exxat-accessibility`, `exxat-fontawesome-icons`, **`exxat-mono-ids`**, `exxat-primary-nav-secondary-panel`, `exxat-collaboration-access`, `exxat-ds-agents`) and any rules under **`apps/web/.cursor/rules/`** (including **`exxat-dashboard-view-charts`** for Data view charts).
4. Project **skills** under `.cursor/skills/` when relevant — e.g. **shadcn**, **exxat-accessibility** (WCAG / ARIA / touch / contrast), **exxat-board-cards** (kanban card shell, status badges, primitives), **exxat-list-page-view-shells** (centered view bodies, **`ListPageViewFrame`**), **exxat-centralized-list-dataset** (one **`useTableState`** row bag + shared maps across all list-hub views and **`TablePropertiesDrawer`**), **exxat-collaboration-access** (face rail + invite sheet + library access), **exxat-dedicated-search-surfaces** (landing vs results split, **`DedicatedSearch*`** templates + recents without hydration drift), **exxat-drawer-vs-dialog**, **exxat-card-vs-list-rows**, **exxat-kpi-max-four**, **`exxat-mono-ids`** (monospace system identifiers).

If two documents conflict, prefer the **more specific** rule for the file type, then **newer** team decisions captured in `AGENTS.md`.

---

## 3. Data tables (product lists)

**MUST** for any screen that is a **browsable, filterable grid of records** (directories, tokens, library items, columns showcase, etc.):

| Requirement | Action |
|-------------|--------|
| Base table | Use **`DataTable`** from `@/components/data-table` (and **`DataTablePaginated`** when pagination is required). |
| Search | Wire **find-in-list** search (toolbar or equivalent). Do not ship a bare table with no search on a data-list page. |
| Filters | Use the **shared filter model** (`FilterFieldDef`, operators, chips) consistent with existing list pages. |
| Table properties | Expose **Table properties** via **`TablePropertiesDrawer`** (`@/components/table-properties`) — columns, density, related options — same pattern as Placements / data list. |

**Reference:** `components/library-table.tsx`, `components/columns-showcase.tsx`, `components/data-table/`.

**Scaling past ~2K rows:** Turn on **`pagination={true}`** on **`HubTable`** and pick a page size; lists + boards already auto-virtualize at 100 rows. Beyond ~50K, lift filter / sort / page state via **`paginationOverride`** and fetch one page at a time — full upgrade path in **`docs/large-dataset-strategy.md`**.

**MUST NOT:** Build product list pages with only `@/components/ui/table`, raw `<table>`, or a third-party grid that bypasses this stack.

**Exception:** Tiny read-only tables **inside** charts or analytics cards (not primary data-list experiences) may use minimal markup; still use design tokens and accessibility.

---

## 4. View tabs + `DataTable`

**MUST:** If the main surface is a **`DataTable`** (or equivalent data grid), wrap it in **`ListPageTemplate`** so the **views toolbar** exists (tabs, add view, per-tab settings). Do **not** place `DataTable` only under `PageHeader` without the tab shell.

**Reference implementations:** `components/library-client.tsx` + `components/library-table.tsx` (canonical seven-view hub), `components/columns-showcase.tsx` (cell catalog via `LibraryTable`), `components/tokens-themes-client.tsx` + `components/tokens-hub-auxiliary-views.tsx`.

**Rationale:** Consistent navigation, saved views, per-tab view type (table / list / board / dashboard), export at template level.

### 4.1 Connected views + mock data

**MUST** wire **every** view type the template exposes (table, list, board, dashboard) to the **same** `useTableState` instance: non-table surfaces read **`tableState.rows`** (filtered/sorted like the grid). **MUST NOT** ship placeholder copy such as “not wired for this demo” for those views when the entity has a table stack.

**MUST NOT** ship a **new primary nav hub** as an **empty or placeholder-only page** (e.g. a paragraph saying “replace this later” with no **`DataTable`**, mock data, or connected views). When a route is linked from **`lib/mock/navigation.tsx`**, land users on the same **hub stack** as Team / Placements: **`ListPageTemplate`** + typed mock rows (typically **≥ ~12**), search, filters, **`TablePropertiesDrawer`**, and all view tabs the template supports (**§4.1**), unless the product explicitly scopes a route as a non-data shell (rare).

**Mock data:** Put typed row arrays in **`lib/mock/<entity>.ts`**. Add **`lib/mock/<entity>-kpi.ts`** (or colocated helpers) with pure functions **`entityKpiMetrics(rows)`** / **`entityKpiInsight(rows)`** returning **`MetricItem[]`** / **`MetricInsight`** for **`KeyMetrics`**. Each **`MetricItem`** must set **`trend`** to match the signed change; use **`trendPolarity`** when an increase is **not** favorable (defects, review flags, overdue — see **`docs/kpi-trend-pattern.md`** and **`.cursor/rules/exxat-kpi-trends.mdc`**). **`delta`** is the **count change** that renders next to the arrow (e.g. `"+5"`, `"-3"`); contextual prose like `"left + right"` / `"vs last week"` goes in **`MetricItem.description`** (caption below the value). When there is no direction *and* no count, leave **`delta: ""`** + **`trend: "neutral"`** — **`KeyMetrics`** hides the chip; **MUST NOT** hand-roll a `—` placeholder. **`entityKpiMetrics`** for **`ListPageTemplate`** metrics and Data-tab key-metrics cards: return **at most four** **`MetricItem`** — **`docs/kpi-strip-max-four-pattern.md`**, **`lib/dashboard-layout-merge.ts`** (`KEY_METRICS_KPI_COUNT_MAX`), **`.cursor/rules/exxat-kpi-max-four.mdc`**. The page client passes full mock rows into one table component; KPI helpers receive **`tableState.rows`** inside that component so search/filters apply to list, board, dashboard, and table together.

**Centralized dataset (rows + table properties + alternate views):** **MUST** use one **`useTableState`** row bag for the **`DataTable`**, **`TablePropertiesDrawer`** (columns/density on **that** table), and **every** record-bearing **`DataListViewType`** — **folder**, **panel**, **tree**, etc. — via **`tableState.rows`**. **MUST NOT** import a second **`lib/mock/<entity>`** array into a view-only module while the grid filters state; **MUST NOT** fork a duplicate row type for inspectors. Shared **properties**: tab labels **`DATA_LIST_VIEW_TILES`** (`lib/data-list-view.ts`), status **`lib/list-status-badges.ts`**, KPI helpers from **`tableState.rows`**. **Presentation:** non-table bodies use **`ListPageViewFrame`** and **`components/data-views/`** primitives fed by the **same** **`tableState.rows`** (**§4.5**). **Rule + skill:** **`.cursor/rules/exxat-centralized-list-dataset.mdc`**, **`.cursor/skills/exxat-centralized-list-dataset/SKILL.md`**.

**Dashboard view tab:** **MUST** reuse **`KeyMetrics`** (same component as the optional template metrics strip) and the same KPI helpers — **MUST NOT** introduce bespoke `Card`-only metric grids for the same numbers. Full-page dashboards may also use **`DashboardTabs`**, **`ChartsOverview`**, etc. (`app/(app)/dashboard/page.tsx`); use those **shared** dashboard components when charts or multi-section layouts are product-appropriate, not one-off duplicates.

**Details:** `docs/data-views-pattern.md` (mock data, connected views, dashboard view).

### 4.1.1 Add view parity (`supportedViewTypes`)

**MUST:** Every **`ListPageTemplate`** hub that mounts **`HubTable`** uses the same **seven** Add view options as Library (All questions) unless a narrower list is **documented** in `lib/<entity>-supported-views.ts`:

- Registry constant: **`FULL_HUB_SUPPORTED_VIEWS`** (`@/lib/data-list-view-registry` or `@/lib/full-hub-supported-views.ts`).
- Pass the **same** allowlist to **`ListPageTemplate`** and **`HubTable`** (or omit on both for the default).
- Implement a **real renderer** for each allowed view (list = **`ListPageBoardCard`** via `renderListRow` — copy **`library-table.tsx`**).
- **`LibraryItem`** catalogs (Column types): use **`LibraryTable`** with `columnDefs` + `folders` — do not trim to four views or placeholder list rows.
- **Tokens:** **`tokens-hub-auxiliary-views.tsx`** + **`FULL_HUB_SUPPORTED_VIEWS`**.

**MUST NOT:** `supportedViewTypes={["table"]}`, bare two-line `renderListRow`, or `PRIMARY_HUB_SUPPORTED_VIEWS` without documented product exception.

**Binding rule:** `.cursor/rules/exxat-hub-supported-views.mdc`. **Pattern doc:** `docs/hub-supported-views-pattern.md`.

### 4.2 `TablePropertiesDrawer` and the active view

**MUST:** Any page that uses **`ListPageTemplate`** with **`tab.viewType`** (table / list / board / dashboard) and renders **`TablePropertiesDrawer`** **MUST** pass:

| Prop | Source |
|------|--------|
| **`currentView`** | The same **`DataListViewType`** as the tab’s active view (e.g. **`view={tab.viewType}`** on the table component). |
| **`onViewChange`** | From **`renderContent={(tab, updateTab) => ...}`**: **`(v) => updateTab({ viewType: v, icon: dataListViewIcon(v) })`** — import **`dataListViewIcon`** from **`@/lib/data-list-view`**. |

Thread **`view`** and **`onViewChange`** from the **client** → **table / toolbar wrapper** → **`TablePropertiesDrawer`**. If **`currentView`** is omitted, the drawer defaults to **table** labels and controls even on **Board**, which is incorrect.

**Reference:** `components/library-table.tsx`, `components/columns-showcase.tsx`, `components/tokens-themes-client.tsx`. Root **`.cursor/rules/exxat-table-properties-drawer.mdc`**.

#### Deep-linking the drawer to a specific panel

`TablePropertiesDrawer` accepts an optional **`initialPanel`** prop so callsites can open the drawer focused on a named panel — `"main"` (default), `"table-display"`, `"filter"`, `"sort"`, `"group"`, `"columns"`, or `"conditional-rules"`. The current built-in use is the **Add Conditional Rule** item in every column header menu, which deep-links to the **Conditional rules** panel.

**MUST**:

1. `useTableState` exposes **`sheetInitialPanel`** + **`setSheetInitialPanel`** alongside `sheetOpen` / `setSheetOpen`. Pass **`initialPanel={sheetInitialPanel}`** to `TablePropertiesDrawer` from the toolbar / button wrapper. Reference: `packages/ui/src/components/table-properties/drawer-button.tsx`.
2. The toolbar **Properties** button MUST clear the deep-link before opening so a plain "open Properties" click always lands on the main index panel:

   ```tsx
   onClick={() => {
     setSheetInitialPanel?.(null)
     setSheetOpen(true)
   }}
   ```

3. Deep-link callsites MUST set panel + open in **the same batched setState call** so the drawer mounts with the right panel in one render:

   ```tsx
   setSheetInitialPanel("conditional-rules")
   setSheetOpen(true)
   ```

4. From inside a Radix `DropdownMenu`, queue the work into `onCloseAutoFocus` (see `columnMenuPendingActionRef` in `packages/ui/src/components/data-table/index.tsx`) — opening the non-modal Sheet synchronously from `onSelect` races with the menu close cycle.

**MUST NOT**: introduce a second source of truth for "which panel" — `sheetInitialPanel` is the only deep-link channel; the drawer's internal `sheetPanel` stays internal.

#### View-type tile grid

The drawer's "View type" tile grid (and the Export drawer's "File format" grid) renders through `SelectionTileGrid` with `interaction="button"` + `labelPlacement="inside"`. The shared `selectionTileClassNames` utility applies **`aspect-square`** + `leading-tight` so every tile is the same uniform square regardless of how many tiles populate the last row of the `grid-cols-N` track. **Prefer** the shared `SelectionTileGrid` (or `selectionTileClassNames` directly) instead of inventing flex/grid wrappers for tile-style pickers — that's the only way to keep the squares uniform across the system.

### 4.3 Data view dashboard — charts, customisation, and parity with the gallery

**MUST** for the **dashboard** view tab on **Placements, Team, Compliance** (and any page that copies this pattern):

| Topic | Rule |
|-------|------|
| **Accessibility** | Each chart uses **`ChartFigure`** (keyboard + live region) and **`ChartDataTable`** (`sr-only` table fallback), inside **`ChartCard`** — same stack as **`charts-overview.tsx`**. **MUST NOT** ship bare Recharts-only charts on these surfaces. |
| **Two “dashboard” surfaces** | The **`/dashboard`** route uses **`DashboardTabs`** + **`ChartsOverview`** (gallery / demos). The **Data** tab on a hub uses a hub-specific `*DashboardChartsSection` (reference: **`LibraryDashboardChartsSection`** in **`components/library-dashboard-charts.tsx`**, wired from **`library-table.tsx`**). Both share **`ChartFigure`**, **`ChartCard`**, and **`useChartVariant()`**; they are **not** duplicate chart engines — product charts belong in the shared components above. |
| **Keyboard selection (bars & pies)** | Match the **`/dashboard` gallery**: use **`CHART_KBD_ACTIVE_BAR`** and **`CHART_KBD_ACTIVE_PIE_SHAPE`** from **`@/lib/chart-keyboard-selection`** with Recharts **`activeBar` + `activeIndex`** on **`Bar`** and **`activeShape` + `activeIndex`** on **`Pie`**. **MUST NOT** rely on **`fillOpacity` dimming alone** on **`Cell`** as the only keyboard-selected state — it diverges from the gallery and from WCAG-aligned focus feedback. |
| **Customise UI** | Toggle **Edit layout** on the hub dashboard toolbar inside **`PlacementsTable`** / **`TeamTable`** / **`ComplianceTable`** (the dashboard tab body renders `*DashboardChartsSection` directly — there is no shared `DashboardShell` wrapper). **`layoutEditMode`** shows on-canvas drag reorder, remove, width (half / full width), chart type, add chart, reset — **no** separate Sheet for layout. Target for coach marks: **`[aria-label='Edit dashboard layout']`**. |
| **Toolbar in edit mode** | Do **not** render **`DataTableToolbar`** while **`layoutEditMode`** — hides search, filters, **Properties**, and the edit affordance in one row. Canvas **Done** / **Cancel** / **Reset** stay on the charts section. |
| **Key metrics card** | Dashboard **`key-metrics`** uses **`KeyMetrics`** **`variant="card"`** (not **`flat`**). Users choose how many KPIs to show (**1–4**) via the canvas control in edit mode; persist **`keyMetricsKpiCount`** in the same layout object. Half-width (**span 1**) sets **`metricsHalfWidthLayout`**. |
| **Data wiring** | **`PlacementsDashboardChartsSection`** (and Team / Compliance equivalents) **MUST** receive **`cardSpans`** and **`cardChartTypes`** (or rely on defaults **inside** the component). **MUST NOT** omit them without defaults — runtime crash (`undefined[id]`). |
| **Persistence (centralized)** | Hub dashboard layouts share one bundle: **`lib/data-view-dashboard-storage.ts`** (key **`exxat-ds:data-view-dashboards:v1`**). Each hub registers under a string scope (e.g. **`library`**); the generic API is **`loadDataViewLayout`** / **`saveDataViewLayout`** + **`mergeDashboardLayoutGeneric`** (`lib/dashboard-layout-merge.ts`) for default-layout safety. **MUST NOT** add a sibling `localStorage` key for the same layout shape without extending this module. |

**Reference:** `components/library-dashboard-charts.tsx` (`LibraryDashboardChartsSection`), `components/library-table.tsx` (dashboard tab body wires the section + edit toolbar inline), `components/charts-overview.tsx` (full-page gallery), `lib/chart-keyboard-selection.ts`, `lib/data-view-dashboard-storage.ts`, **`apps/web/.cursor/rules/exxat-dashboard-view-charts.mdc`**.

### 4.4 Board cards (kanban)

**MUST** for **product board views** on list hubs (Team, Compliance, Placements, and any new hub with **`viewType === "board"`**):

| Topic | Rule |
|-------|------|
| **Shell** | Compose **`ListPageBoardCard`** from **`components/data-views/list-page-board-card.tsx`** — same **`Card` `size="sm"`** ring/hover/`isNew` pattern as **`BoardPlacementCard`**. **MUST NOT** hand-roll alternate card chrome (one-off `<button>` + border classes) for the same surfaces. |
| **Information hierarchy** | **(1)** **`ListPageBoardCardTitleRow`** — title + optional **`ListPageBoardCardAvatar`** (`trailing`). **(2)** **`ListPageBoardCardBadgeRow`** — status / tags as **`Badge`** chips when the entity has a status (not raw body text for status). **(3)** **`ListPageBoardCardBody`** — facts via **`BoardCardTwoLineBlock`** and/or **`BoardCardIconRow`** from **`board-card-primitives.tsx`**. **(4)** Optional **`ListPageBoardCardSecondary`** for empty-state hints. |
| **Facts rows** | Prefer **`BoardCardTwoLineBlock`** (icon + primary line + optional secondary line) so rows match Placements. **`line2`** may be omitted for a single-line fact. Use **`BoardCardIconRow`** when the cell mirrors **`ColumnDef` cell renderers** (e.g. Placements). |
| **Avatar** | Use **`ListPageBoardCardAvatar`** with entity **`initials`** when present; otherwise derive with **`initialsFromDisplayName`** from **`lib/initials-from-name.ts`** (e.g. compliance owner name). |
| **Status labels + colors** | **All list hubs** **MUST** render status chips with **`ListHubStatusBadge`** and compose per-domain label / tint / icon maps next to the entity's mock data (reference: `lib/mock/library.ts` + `components/library-board-view.tsx`). Generic semantic tints live in **`lib/list-status-badges.ts`** (**`LIST_HUB_STATUS_TINT_SUCCESS / WARNING / INFO / NEUTRAL / DANGER`**). **`surface="table"`** for **`DataTable`** / **list** rows; **`surface="board"`** in **`ListPageBoardCardBadgeRow`**. **SHOULD** map domain statuses onto **`LIST_HUB_STATUS_TINT_*`** before inventing new palettes. **MUST NOT** duplicate the same tint table across feature files or add **`uppercase`** / **`tracking-wide`**. |

**Reference:** **`components/library-board-view.tsx`**, **`components/list-hub-status-badge.tsx`**, **`lib/list-status-badges.ts`** (generic tints), **`components/data-views/list-page-board-template.tsx`**, **`@exxatdesignux/ui/components/list-page-board-card`** (primitive). **Skill (Cursor + Claude):** **`.cursor/skills/exxat-board-cards/SKILL.md`** and **`.claude/skills/exxat-board-cards/SKILL.md`**.

### 4.5 View layout shells (centered, reusable, not page-tied)

**MUST** keep **shared view chrome** (horizontal gutter, optional **centered max-width** on ultra-wide screens) in **`ListPageViewFrame`** from **`components/data-views/list-page-view-frame.tsx`** (re-exported from **`components/data-views/index.ts`**). Use the exported constants **`LIST_PAGE_VIEW_FRAME_GUTTER`**, **`LIST_PAGE_VIEW_FRAME_MAX_ICON_GRID`** (`max-w-6xl`), and **`LIST_PAGE_VIEW_FRAME_MAX_WIDE`** (`max-w-7xl`) instead of ad-hoc `mx-*` / `max-w-*` pairs in each hub.

| Topic | Rule |
|-------|------|
| **Folder / icon / panel-style views** | Compose **`FolderGridView`**, **`FinderPanelView`**, or another **`data-views/`** primitive; those shells **should** use **`ListPageViewFrame`** internally or as a direct wrapper so every hub gets the same rhythm. |
| **New view types** | Implement the **generic** grid/shell under **`components/data-views/`** with render props; **`TeamTable`** / **`LibraryTable`** **MUST** only wire data + callbacks — **MUST NOT** own one-off full-page grid markup that another entity would duplicate. |
| **`DataTable` branch** | **MUST NOT** wrap **`DataTable`** in **`ListPageViewFrame`** when it would **stack** horizontal inset with the table toolbar (**§5**). |

**Cursor rule:** **`.cursor/rules/exxat-list-page-view-shells.mdc`**. **Skill:** **`.cursor/skills/exxat-list-page-view-shells/SKILL.md`**.

### 4.6 Primary nav hub → secondary panel (nested scope nav)

**Use when** a **single primary nav destination** needs **inner scopes** (All / Mine / tree / filters) in a **panel** beside content — **not** as extra **primary** or **collapsible child** rows.

**MUST:**

| Step | Action |
|------|--------|
| **Nav** | Set **`secondaryPanel`** on the **`NavLinkItem`** in **`lib/mock/navigation.tsx`** to a **stable id** (e.g. **`"library"`**). **`url`** stays the **hub route**. |
| **Registry** | Map that id in **`PANELS`** inside **`components/secondary-panel.tsx`** to a component that renders **panel header** + **secondary nav** UI. |
| **Route** | Mount **`*PanelActivator`** on the hub that calls **`useAutoPanel(id)`** with the **same id** so the panel opens while the route is mounted (see **`LibraryPanelActivator`** on **`LibraryClient`**). |
| **Data** | Keep using **one** **`useTableState`** row bag; **scope** filters via **URL** + shared helpers (**`lib/library-nav.ts`**) so **refresh** and **links** match the panel — **`.cursor/rules/exxat-centralized-list-dataset.mdc`**. |

**MUST NOT:** Set **`secondaryPanel`** without **`PANELS[id]`** and **`useAutoPanel`** — users see **collapsed** main nav with **no** panel body.

**Folder-scoped library (Library):** When the URL is scoped to a folder (**`scope === "folder"`** + **`folderId`** via **`lib/library-nav.ts`**), the hub **`LibraryPageHeader`** **⋯ More** menu **MUST** include **Customize folder** and open **`LibraryNewFolderSheet`** from the **hub client** so the action works on **every** **`ListPageTemplate`** view tab — not only inside **`LibraryTable`** branches that mount their own sheet. **Pattern:** **`docs/library-hub-header-pattern.md`**. **Cursor rule:** **`.cursor/rules/exxat-library-hub-header.mdc`**.

**Surface elevation:** Secondary panel = **level 1** between primary sidebar (**`--sidebar`**, level 0) and page canvas (**`--background`**, level 2). **`NestedSecondaryPanelShell`** uses **`bg-[var(--secondary-panel-bg)]`** — OKLCH mix from **`--brand-tint*`** per active product (**One** indigo, **Prism** rose, **`theme-custom`** when accent differs from default). **MUST NOT** set panel to **`bg-sidebar`** or a fixed rose fill for all products. **`docs/shell-surface-elevation-pattern.md`**.

**Cursor rule (panel wiring):** **`.cursor/rules/exxat-primary-nav-secondary-panel.mdc`**. **Icons in panel:** **`.cursor/rules/exxat-fontawesome-icons.mdc`**.

### 4.7 Collaboration & access (shared hubs)

**Use when** a hub is **shared** and users need a **who has access** roster plus **invite by email** with **library access** (Owner / Editor / Commenter / Viewer). **Directory role tags** (Faculty, Program coordinator, Director) are **separate** from library access.

**MUST:**

| Step | Action |
|------|--------|
| **Header** | **`PageHeader`** **`variant="collaboration"`** with **`collaborators`**; **empty roster** → outline **Add collaborator**; **non-empty** → face rail (faces / **`+N`** open the invite sheet). |
| **Invite entry** | **⋯ More** → **Invite people**; header empty CTA / face rail → **`InviteCollaboratorsDrawer`** (floating **`Sheet`**, same family as **`ExportDrawer`**). |
| **Hub client** | Prefer **`CollaborationAccessFlow`** (or own **`collaborators`** + **`inviteOpen`**); successful invite updates **`collaborators`** for header + sheet. |
| **Types** | **`PageHeaderCollaborator`** + **`lib/collaborator-access.ts`** — **one** access map per product; customize invite copy per hub, not enum forks. |
| **Roster** | Single bordered list, row dividers; **name → email → role tags**; trailing **access** badge. |
| **Invite field** | **`FieldGroup`** + **`Field`**; email + access in **`InputGroup`** (**`InputGroupInput`** + **`InputGroupAddon`** **`Select`** with **`SelectGroup`**); **`FieldDescription`** for email format; **no** toast (**§6.5**). |

**MUST NOT:** **`Select`** in **`InputGroupAddon`** without **`InputGroupInput`** / **`SelectGroup`**; per-person cards in the roster; a second invite control **beside** an existing face rail.

**Narrative:** **`docs/collaboration-access-pattern.md`**. **Cursor rule:** **`.cursor/rules/exxat-collaboration-access.mdc`**. **Skill:** **`.cursor/skills/exxat-collaboration-access/SKILL.md`**. **Reference:** Library header + client + **`InviteCollaboratorsDrawer`**.

### 4.8 Dedicated search (landing vs results)

**Use when** a hub uses **one primary query param** (typically **`?q=`**) with two product states: **empty** → centered **landing** (composer ± recents) vs **non-empty** → **`ListPageTemplate`** / **`DataTable`** results on the same hub stack.

**MUST:**

| Step | Action |
|------|--------|
| **Templates** | **`DedicatedSearchLandingTemplate`** for the empty-query shell; **`DedicatedSearchResultsHeaderChrome`** + **`DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME`** for the results branch chrome. |
| **Composer** | **`DedicatedSearchUrlComposer`** — hub passes **`patchSearchParams`** (preserve scope / feature flags while merging text) and optional **`onRecordSubmission`**. |
| **Recents** | **`DedicatedSearchRecents`** + **`createDedicatedSearchRecentsController`** — **MUST NOT** read **`localStorage`** in **`useState`** initializers (**hydration**). |
| **Naming** | Keep **`DedicatedSearch*`** / **`dedicated-search-*`** generic; domain copy + patchers live next to the hub (**`lib/<entity>-dedicated-search.ts`**) or inline in the hub client. |

**Cursor rule:** **`.cursor/rules/exxat-dedicated-search-surfaces.mdc`**. **Skill:** **`.cursor/skills/exxat-dedicated-search-surfaces/SKILL.md`**.

---

## 5. Layout alignment (avoid double inset)

**MUST NOT** wrap `DataTable` in **extra** horizontal padding (`px-*` / `mx-*`) if `DataTable` already applies margin/padding on its shell or toolbar — that **staircases** the filter bar and table vs tabs.

**SHOULD:** Follow Placements / Team: one horizontal rhythm from `ListPageTemplate` + `DataTable`’s own inset.

---

## 6. Dense lists, export, primary hubs

### 6.1 Dense lists (more than ~10 rows/cards)

**SHOULD** provide **search**, **filter**, **user-visible sorting**, and a **properties** entry point (drawer/sheet) appropriate to the surface. **Table/list/board:** use `TablePropertiesDrawer` / toolbar patterns. **Card-only pages:** a lighter properties sheet is OK if there is no `DataTable`.

Below the threshold, these MAY be omitted unless the page is a **primary hub** (§6.3).

### 6.2 Pages with exportable data

Match **Placements**:

- **Primary CTA:** one **default (filled)** `Button`, often `size="lg"` — e.g. "New question", "Invite collaborator", "Add token". **MUST NOT** use `variant="outline"` for that primary action.
- **More (⋯):** outline **icon** button → menu including **Export** → **`ExportDrawer`** (or same pattern).

**Subtitle:** Short line with **count + freshness** (e.g. `24 records · Last updated now`) when useful — see `PlacementsPageHeader` / `TeamPageHeader`.

### 6.3 Primary pages with large or complex data

**Primary nav destinations** that show **large or highly interactive** datasets **MUST** use the **primary page template**:

- **`ListPageTemplate`** + **`KeyMetrics`** (when metrics apply) + export wiring + the same **client composition** as **`PlacementsClient`** / **`TeamClient`** — not a minimal `PageHeader`-only layout for that hub.

**MUST NOT** treat a main hub table page as a “light” sub-section: use the same shell as Placements (tabs, optional metrics strip, template-level export).

### 6.4 Page vs drawer vs dialog (actions and auxiliary views)

**SHOULD** choose the surface by whether the user must keep **page context** while acting, and whether the hub may stay **interactable**:

| Use a **drawer / sheet** (side panel) | Use a **dialog** (modal) | Use a **new page** (dedicated route) |
|--------------------------------------|---------------------------|----------------------------------------|
| The user needs **the current page behind them** (list, hub, or parent task) **and** a **quick view**, **quick actions**, or a **short auxiliary step** — e.g. properties, export, invite | A **blocking** short choice — confirm/alert/destructive ack — where the page **must not** stay interactable until answered | The flow is **primary**, **long-form**, **multi-step**, or should have its **own URL**, bookmark, or history entry **without** the parent page visible |
| Examples: table/column properties, export, glance at row metadata | Examples: `AlertDialog`, delete confirm, compact “save changes?” | Examples: full create/edit forms, wizards, deep detail that is the main task |

**Rationale:** Drawers preserve **spatial context**; dialogs enforce **focus**; full pages avoid cramming complex work into overlays.

**Details:** `docs/data-views-pattern.md` (Page vs drawer), **`docs/drawer-vs-dialog-pattern.md`** (drawer vs modal on the same route). Root **`.cursor/rules/exxat-page-vs-drawer.mdc`**, **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**.

### 6.5 Messaging — no toast

**MUST NOT** use **toast** APIs (e.g. **Sonner** `toast()`), **snackbars**, or other **transient corner notifications** for product feedback.

**SHOULD** use **`LocalBanner`** / **`SystemBanner`**, **inline status** next to the control (e.g. saved state on a button row), or **dialog / drawer** when acknowledgment matters.

**Rationale:** Toasts are easy to miss, compete with dense app chrome, and are inconsistent for accessibility (focus, announcements). Root **`.cursor/rules/exxat-no-toast.mdc`**.

---

## 7. Keyboard shortcuts (`Kbd`)

Follow root **`.cursor/rules/exxat-kbd-shortcuts.mdc`**. Summary:

- Show **`Kbd`** / **`KbdGroup`** where users discover actions (primary/secondary CTAs, search, Ask Leo, sidebar) — not on every control.
- If a tooltip shows a chord, **implement** it (respect inputs / `contenteditable` via `@/lib/editable-target`).
- Use **`useModKeyLabel`** / **`useAltKeyLabel`** for correct OS labels.
- **Avoid** browser-reserved chords; prefer **⌘⌥** / **Ctrl+Alt** + letter for app actions; table search stays **⌘K** / **Ctrl+K** without Alt.

### 7.1 Global command palette (⌘K)

**Product intent:** **`CommandMenu`** is **global search** and the primary **AI entry**—not a second nav tree. Config: **`buildCommandMenuConfig()`** in **`lib/command-menu-config.ts`**, provider in **`app/(app)/layout.tsx`**. Optional searchable rows (e.g. student names, question stems, record IDs) come from **`dataGroups`**, typically via **`getCommandMenuSearchDataGroups()`** in **`lib/command-menu-search-data.ts`**.

| SHOULD | Rationale |
|--------|-----------|
| Treat the palette as **global search** for routes, library, patterns, and AI suggestion starters | One mental model: ⌘K finds things and starts tasks. |
| For **natural language / AI**, prefer **quick results in the palette** when answers are short or lookup-style (inline snippets, citations, lightweight “research”) | Keeps users in flow; matches “search → pick result”. |
| Route **longer, exploratory, or multi-step** answers to **Ask Leo** (`AskLeoSidebar`) | Side panel fits long-form chat and complex help. |
| For **large row indexes** in **`dataGroups`**, set **`searchOnly: true`** on the group so users are not shown every record before they type (cmdk shows all items when the query is empty). | Keeps the first-open palette usable; matches “type to find a student / row”. |

**MUST NOT** implement the palette as **only** static links without room for AI/search evolution. **SHOULD** keep **`docs/command-menu-pattern.md`** updated as inline AI or search behavior ships.

**Reference:** `components/command-menu.tsx`, `lib/command-menu-search-data.ts`, `docs/command-menu-pattern.md`.

---

## 8. Accessibility (WCAG / ARIA)

**Standard:** **WCAG 2.1 Level AA** (and **2.2** where noted, e.g. target size).

**Authoritative detail (badges, sidebar count colors, audit table):** **`.cursor/skills/exxat-accessibility/SKILL.md`** at the monorepo root (when the parent repo is open). If the skill path differs in your checkout, search for **`exxat-accessibility`**.

### 8.1 ARIA roles & structure (SC 1.3.1)

| MUST | MUST NOT |
|------|----------|
| Keep **`role="tablist"`** for **tabs only** — children resolve to **`role="tab"`** | Put **`role="button"`**, menus (`aria-haspopup`), or unrelated controls **inside** the same **`tablist`** container |
| For **composite view switchers** (tabs + per-tab settings + remove): use **`role="toolbar"`** + **`aria-label`**, **`aria-pressed`** on toggles where appropriate | Misuse **`tab` / `tablist`** for mixed toolbars |
| Prefer **`<button type="button">`** over **`span role="button"`** for icon actions | Sole click targets at **`size-4`** (16px) |

### 8.2 Touch targets (WCAG 2.2 — 2.5.8)

**MUST:** Interactive controls (including icon-only chevrons and close icons) are at least **24×24 CSS pixels**, or have **24px** spacing so **24px** hit circles do not overlap.

**SHOULD:** **`min-h-6 min-w-6`** or **`size-6`** with centered icons for icon-only controls.

### 8.3 Color (SC 1.4.3 / 1.4.11)

- **Minimum text size** for visible product UI: **11px** — use **`text-xs`** or larger; **MUST NOT** use arbitrary Tailwind classes below that (e.g. `text-[10px]`, `text-[0.65rem]` when it resolves under 11px). Theme tokens: **`app/globals.css`** (`@theme` `--text-xs` = `0.6875rem` at 16px root).
- **Normal text** (including small badge labels): **≥ 4.5:1** against its background.
- **UI components** (borders, focus rings where required): **≥ 3:1**.
- **Muted text on tinted surfaces** (e.g. sidebar): use tokens mixed against the **correct surface** (e.g. **`--sidebar`** / `--sidebar-section-label-foreground`), not only `--background`.

### 8.4 Overlays (Dialog / Sheet)

**MUST:** Provide an accessible **title** — `DialogTitle` / `SheetTitle`; use **`className="sr-only"`** when the title is visually hidden (align with shadcn patterns in this repo). Product side panels use **`Sheet`** only (Export, Properties, invite — not a separate Vaul drawer primitive).

### 8.5 Verification

**SHOULD** re-run **axe** (or your checker) on **Placements** (or the page you changed) after editing **views toolbar**, **tabs**, or **primary list** surfaces.

### 8.6 Icons that communicate information MUST be accessible (SC 1.1.1, 3.3.2, 2.4.6)

Any icon (FA glyph, inline SVG, avatar placeholder) that carries **information** — not just icon-only buttons — MUST be accessible to screen readers AND to sighted users who may not recognise the glyph. Three cases, each with a required pattern:

#### Case A — Decorative icon next to text that already names it

When the icon sits adjacent to a visible text label that already carries the meaning, the icon is **decorative**. It MUST be `aria-hidden` and MUST NOT repeat the label via `aria-label` (screen readers would announce it twice).

```tsx
<span className="flex items-center gap-1.5">
  <i className="fa-light fa-calendar-days" aria-hidden />
  <span>12/14/2025 – 12/20/2025</span>
</span>
```

No tooltip needed — the text is the alt. This is the default when icons prefix/suffix a label in a cell, button with text, badge, breadcrumb, etc.

#### Case B — Informational icon standing alone (no adjacent text label)

When the icon is the **only** visible carrier of information — e.g. a `fa-calendar-days` in a compact table column header meaning "date range", `fa-clock` meaning "updated at", `fa-location-dot` meaning "site", `fa-graduation-cap` meaning "student", trending arrow in a KPI card, chart kind indicator, status dot, icon-only chart legend key — the icon MUST:

1. Announce itself to AT via **`role="img"` + `aria-label`** (non-interactive) **OR** live inside a labelled parent (`aria-labelledby`).
2. Show a visible **`Tooltip`** on hover/focus so sighted users who don't recognise the icon learn the meaning.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    {/* non-interactive icon: span with role="img" is focusable via tabIndex={0} so
        the tooltip opens on keyboard focus too */}
    <span
      role="img"
      aria-label="Placement date range"
      tabIndex={0}
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <i className="fa-light fa-calendar-days" aria-hidden />
    </span>
  </TooltipTrigger>
  <TooltipContent side="top">Placement date range</TooltipContent>
</Tooltip>
```

Rules:
1. `TooltipContent` text MUST match the `aria-label`.
2. The inner `<i>` / `<svg>` still has `aria-hidden` — the accessible name lives on the wrapping element.
3. If a visible text label could fit, **prefer adding the label** (Case A) over tooltip-only.
4. Target/focus size still **≥ 24×24 CSS px** (§8.2) so keyboard users can focus the icon.

#### Case C — Interactive icon-only button / link

Any button or link whose visible content is a **single icon** — close (`×`), chevron, overflow (`⋯`), sort direction, filter chip dismiss, copy-to-clipboard, Ask Leo toggle, expand/collapse, row actions — MUST pair **`aria-label`** with a wrapping **`Tooltip`**.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      aria-label="Close insight"
      onClick={onClose}
      className="inline-flex size-7 min-h-7 min-w-7 items-center justify-center rounded-md …"
    >
      <i className="fa-solid fa-xmark" aria-hidden />
    </button>
  </TooltipTrigger>
  <TooltipContent side="top" className="flex items-center gap-1.5">
    <span>Close</span>
    <Kbd>Esc</Kbd>
  </TooltipContent>
</Tooltip>
```

Rules:
1. `TooltipContent` MUST match or extend the `aria-label`.
2. Inside tooltips use the default **tile** `<Kbd>` — NOT `variant="bare"`.
3. The inner `<i>` / `<svg>` MUST be `aria-hidden`.
4. Target size **≥ 24×24 CSS px** (§8.2).

Narrow exceptions (all cases): a chevron inside a labelled composite (`Select`, `Combobox`) where the parent control already names the whole thing; drag handles that reference a labelled ancestor via `aria-describedby`.

**When in doubt: add the accessible name + tooltip.** Silence is never the right answer for an icon that means something.

### 8.7 `Kbd` variant inside buttons MUST be `"bare"` (no background)

Keyboard shortcut hints rendered **inline inside a `Button`** (primary, secondary, wizard Next/Back/Submit) **MUST** use **`<Kbd variant="bare">`**. The default `tile` variant is reserved for **tooltip content** and menu `shortcut=` slots. Glue multi-key chords into a single bare kbd (e.g. `<Kbd variant="bare">⌘⌥K</Kbd>`), not one tile per key.

```tsx
// ✅ inside a button (primary/secondary/wizard)
<Button>Next <KbdGroup className="ml-1.5"><Kbd variant="bare">⌘⏎</Kbd></KbdGroup></Button>

// ✅ inside a tooltip (icon-only button above)
<TooltipContent><span>Close</span><Kbd>Esc</Kbd></TooltipContent>
```

Reference: `components/new-library-item-form.tsx` (Next/Back buttons); full shortcut table in **`.cursor/rules/exxat-kbd-shortcuts.mdc`**.

---

## 9. Architecture pointers (reuse, don’t fork)

| Need | Reuse | Where |
|------|--------|--------|
| View tabs + shell | `ListPageTemplate` | `components/templates/list-page.tsx` |
| Table + toolbar | `DataTable`, `DataTableToolbar`, `useTableState` | `components/data-table/` |
| Properties | `TablePropertiesDrawer` (+ **`currentView`** / **`onViewChange`** when using view tabs — §4.2) | `@/components/table-properties` |
| Full hub (table / board / dashboard) | `LibraryHubClient`, `LibraryTable` | `components/library-hub-client.tsx`, `components/library-table.tsx` |
| Single-view catalog hub | `ColumnsClient`, `ColumnsShowcase` | `components/columns-client.tsx`, `components/columns-showcase.tsx` |
| Dashboard view tab (KPIs + charts) | **`DashboardReportCharts`**; default **`ChartsOverview`** (full-page gallery). Hubs pass **`chartsSection`** with their own `*DashboardChartsSection` so graphs match the row set. KPIs from **`tableState.rows`**. | `components/dashboard-report-charts.tsx`, `components/library-dashboard-charts.tsx`, `components/library-table.tsx` |
| Data view layout + graph keyboard tokens | **`loadDataViewLayout` / `saveDataViewLayout`**, **`CHART_KBD_ACTIVE_BAR`**, **`CHART_KBD_ACTIVE_PIE_SHAPE`** | `lib/data-view-dashboard-storage.ts`, `lib/chart-keyboard-selection.ts` |
| Customize dashboard coach marks | Shared steps in **`lib/dashboard-customize-coach-mark.ts`**; one flow per hub scope (e.g. **`library-dashboard-customize`**) | `hooks/use-coach-mark.ts` (`enabled`, `dependsOnDismissedFlowId`), `library-table.tsx` |
| Board columns (simple hubs) | **`ListPageBoardTemplate`** + **`ListPageBoardCard`** + primitives + **`lib/list-status-badges`** + **`ListHubStatusBadge`** (when applicable) | `components/data-views/list-page-board-template.tsx`, `list-hub-status-badge.tsx`, `library-board-view.tsx`, **`§4.4`** |
| Full dashboard route | `DashboardTabs`, `KeyMetrics`, `ChartsOverview` | `app/(app)/dashboard/page.tsx`, `components/dashboard-tabs.tsx` |
| Board cards | **`ListPageBoardCard`** + primitives + entity card (**§4.4**) | `components/data-views/list-page-board-card.tsx`, `board-card-primitives.tsx`, `library-board-view.tsx` |
| **Application sidebar** (school/program, product, profile, child nav) | **`AppSidebar`**, **`TeamSwitcher`**, **`NavUser`**, collapsible + **popover** (icon rail) | `components/app-sidebar.tsx`, `nav-user.tsx`, `product-switcher.tsx`, `lib/mock/navigation.tsx`, `lib/logo-dev.ts`, `lib/stock-portrait.ts` — patterns in **exxat-ds-skill §3.1** |
| **Collaboration & access** (face rail + invite sheet) | **`PageHeader` `variant="collaboration"`**, **`InviteCollaboratorsDrawer`**, **`lib/collaborator-access.ts`** | `components/page-header.tsx`, `components/invite-collaborators-drawer.tsx`, `components/library-page-header.tsx`, `components/library-client.tsx`, **`§4.7`**, **`docs/collaboration-access-pattern.md`** |
| **Dedicated search** (empty `?q=` landing vs results) | **`DedicatedSearchLandingTemplate`**, **`DedicatedSearchUrlComposer`**, **`DedicatedSearchRecents`**, **`DedicatedSearchResultsHeaderChrome`**, **`lib/dedicated-search-recents.ts`** | **`§4.8`**, **`components/templates/dedicated-search-*`**, **`components/dedicated-search-*.tsx`** |
| Persistence (example) | Page + lifecycle keys | `lib/data-list-persistence.ts`, `PlacementsClient` / `PlacementsTable` |
| Coach marks / tours | `CoachMark`, `useCoachMark`, coach mark registry | `components/ui/coach-mark.tsx`, `hooks/use-coach-mark.ts`, `lib/coach-mark-registry.ts` |
| Settings page | Coach mark management | `app/(app)/settings/page.tsx`, `components/settings-client.tsx` |

**MUST:** One **`useTableState` per logical table**; remount with **`key`** when column set or entity context changes.

### 9.1 Application sidebar shell

**MUST:**

- **Product (Exxat One / Prism):** Use **`ExxatProductLogo`** for the header product control and **`ProductSwitcher`** — do **not** substitute logo.dev rasters unless product explicitly requests it.
- **School logos:** Use **`logoDevUrl()`** from **`lib/logo-dev.ts`** in **`NAV_SCHOOLS`**; optional env **`VITE_LOGO_DEV_TOKEN`**.
- **Team / program dropdown:** The shared **`DropdownMenuContent`** uses **intrinsic width** (**`min-w-52 w-max`** + viewport-capped **`max-w`**) so view menus and table actions are not squeezed to the trigger. The **school / program** switcher still passes an explicit wider surface (**`!w-max min-w-72 max-w-[min(100vw-2rem,28rem)]`**) for long labels. **Do not truncate** school or program labels; wrap with **`items-start`**, **`break-words`**, **`whitespace-normal`**. Selected-school summary shows **school + current program**.
- **Team switcher trigger:** **`SidebarMenuButton` `size="lg"`** is **`h-12`** + **`overflow-hidden`** and **clips** the program line — when expanded or mobile, use **`h-auto min-h-12`** and **`overflow-x-clip overflow-y-visible`**; on **icon rail**, hide text with **`group-data-[collapsible=icon]:hidden`**.
- **Nav items with children:** **Popover** on desktop **icon rail**; **Collapsible** when expanded. **MUST NOT** use **`SidebarMenuButton` `tooltip={…}`** as the **direct** child of **`CollapsibleTrigger asChild`** (extra **`Tooltip` root** breaks Radix **`Slot`** / **`React.Children.only`**).
- **Mock profile photo:** **`stockPortraitUrl()`** from **`lib/stock-portrait.ts`**; **`AvatarImage`** **`referrerPolicy="no-referrer"`** for external URLs.
- **Icon rail layout:** Default **`SidebarMenuButton`** icon mode is **`size-8` + `p-2`** (~16px inner width), which **clips** 32px avatars/logos. Override with **`!size-9`**, **`!p-0`**, and **`overflow-visible`** on product/school header controls so marks stay centered and uncropped. **Chevrons** on those header triggers are optional — omit if they read as decoration next to logos.
- **Motion (Animate UI–style):** [Animate UI](https://animate-ui.com/docs) is an **open component distribution** (copy/tweak, Motion + Tailwind — not a single NPM UI package). This app uses **`motion/react`** with small presets in **`lib/motion-ui.ts`**; add more patterns by porting pieces from their registry as needed.

**Full detail:** **`.cursor/skills/exxat-ds-skill/SKILL.md`** (or **`.claude/skills/…`**) **§3.1**.

---

## 10. Persistence (when copying Placements behavior)

- **Page-level:** tabs, `showMetrics`, `displayOptions`, `activeTabId` — see `lib/data-list-persistence.ts` and `PlacementsClient`.
- **Per-lifecycle / tab:** sort, filters, columns, etc. — see `PlacementsTable` and `scheduleLifecycleSave`.

New pages **SHOULD** namespace keys and version JSON (`v: 1`) for future migrations.

---

## 11. Coach Marks (onboarding tours)

**MUST:** Use the **coach mark system** for all onboarding, feature discovery, and guided tours. Do **not** build one-off walkthrough overlays.

| Component | Location |
|-----------|----------|
| `CoachMark` | `@/components/ui/coach-mark` |
| `useCoachMark` hook | `@/hooks/use-coach-mark` |
| Coach mark registry | `@/lib/coach-mark-registry` |
| Settings page | `app/(app)/settings/page.tsx` + `@/components/settings-client` |

### How to add a tour

1. Define steps as `CoachMarkStep[]` — each with a `target` CSS selector (prefer `aria-label`, `role`, or `data-coach-mark` attributes), `title`, `description`, optional `side`/`align`/`image`.
2. Call `useCoachMark({ flowId, steps, delay })` and render `<CoachMark state={tour} />` anywhere (it targets by selector, no child wrapping).
3. Register the flow in `lib/coach-mark-registry.ts` so it appears in the Settings page.

### Key behaviors

- **Selector-based:** each step finds its element by CSS selector, scrolls to it, and positions a Radix popover with a spotlight overlay.
- **Brand-colored:** popover background is `bg-brand-deep text-white` — not `bg-popover`.
- **Persistent:** once completed/skipped, the flow is dismissed via `localStorage` and won't reshow until reset from Settings.
- **Settings page:** `/settings` lists all registered flows with reset/preview controls.
- **Sequencing / gating:** `useCoachMark` supports **`enabled`** (e.g. only when **`view === "dashboard"`**) and **`dependsOnDismissedFlowId`** (e.g. customize-dashboard after a "views" tour completes). Completed flows dispatch **`COACH_MARK_FLOW_COMPLETED_EVENT`** on `window` so follow-up tours can open in the same tab.
- **Customize Data dashboard:** registered flows target **`[aria-label='Edit dashboard layout']`**; shared step copy lives in **`lib/dashboard-customize-coach-mark.ts`**.

### Variants

- **Single** (1-step array) — standalone tip, "Got it" button
- **Flow** (2+ steps) — step dots, Skip, Back, Next
- **With image** — set `image` + `imageAlt` on the step
- **Without image** — text-only

**Reference:** `references/coach-marks.md` in the skill, `components/dashboard-tabs.tsx` (dashboard tour), `components/library-hub-client.tsx` (views tour).

---

## 12. Documentation

- **Deep dive:** `docs/data-views-pattern.md` (includes **Page vs drawer** with **§6.4**)
- **Scaling to 5K+ rows:** `docs/large-dataset-strategy.md` (client mode, pagination, server mode, virtualization follow-up)
- **Drawer vs dialog (same route):** `docs/drawer-vs-dialog-pattern.md` — **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**
- **Cards vs table rows:** `docs/card-vs-rows-pattern.md` — **`.cursor/rules/exxat-card-vs-list-rows.mdc`**
- **KPI strip (max four tiles):** `docs/kpi-strip-max-four-pattern.md` — **`.cursor/rules/exxat-kpi-max-four.mdc`**
- **KPI flat band (list hubs):** `docs/kpi-flat-band-pattern.md` — **`.cursor/rules/exxat-kpi-flat-band.mdc`**
- **Shell surfaces (sidebar · secondary panel · page):** `docs/shell-surface-elevation-pattern.md`
- **KPI deltas & trend arrows:** `docs/kpi-trend-pattern.md` (`MetricItem.trendPolarity`, `KeyMetrics`, chart mini-metrics)
- **Global command palette (⌘K):** `docs/command-menu-pattern.md`
- **No toast / snackbars:** **§6.5**, root **`.cursor/rules/exxat-no-toast.mdc`**
- **Token taxonomy:** `docs/token-taxonomy.md` — namespaces, layering (L0 / L1 / L2 / L3), naming, deprecation policy. Machine-readable index at `packages/ui/tokens/hooks-index.json` (163 tokens · 36 namespaces · regenerate via `pnpm --filter @exxatdesignux/ui tokens:index`).
- **Exxat L0 canonical namespace:** `--exxat-color-surface-*`, `--exxat-color-ink-*`, `--exxat-color-brand-*`, `--exxat-radius-*`, `--exxat-spacing-*`, … (taxonomy §2.0; rollout: `docs/migrations/0002-exxat-token-namespace.md`).
- **Component selection guide:** `docs/component-selection-guide.md` — decision tree across the whole DS.
- **Blueprints:** `docs/blueprints/` — framework-agnostic specs. Start with `page-header.md` and `data-table.md`; add new ones via `_template.md`.
- **Migrations:** `docs/migrations/` — token rename + removal history. Open a new entry alongside every breaking change.
- **Components audit:** `docs/components-audit-2026-05.md` — observation log; §2.1 (form-layout / section-cards) and §2.2 (onboarding consolidation) both resolved 2026-05-19.
- **This handbook:** `apps/web/AGENTS.md` (keep checklist sections updated when patterns change)

### 12.1 Design-system meta-rules

| Concern | Rule | Enforcement |
|---|---|---|
| Salesforce / SLDS / LWC cross-contamination | **`.cursor/rules/exxat-no-slds-leakage.mdc`** | ESLint: `exxat-ds/no-slds-classes`, `exxat-ds/no-lightning-elements` |
| Hex literals, deprecated tokens, wrong token family | **`.cursor/rules/exxat-token-discipline.mdc`** | ESLint: `exxat-ds/no-hex-color`, `exxat-ds/no-deprecated-tokens` |
| No-toast feedback policy | **`.cursor/rules/exxat-no-toast.mdc`** (§6.5) | ESLint: `exxat-ds/no-sonner-toast` |

The ESLint rules ship as a **workspace package**:
**`packages/eslint-plugin-exxat-ds/`** (published as `@exxatdesignux/eslint-plugin`).
`apps/web/eslint.config.mjs` imports it via `import exxatDs from "@exxatdesignux/eslint-plugin"`
and consumers of `@exxatdesignux/ui` can install the plugin from npm with the
same wiring. See [`packages/eslint-plugin-exxat-ds/README.md`](../../packages/eslint-plugin-exxat-ds/README.md)
for rule docs and authoring guidance.

When you **introduce** a new token in `packages/ui/src/globals.css` (the canonical CSS — app/template `globals.css` are thin `@import` shells):

1. **Prefer L0** — declare the canonical name in the `Exxat L0 — canonical namespace`
   block (`--exxat-color-<bucket>-<slot>` / `--exxat-radius-N` / `--exxat-spacing-N`).
2. Add a row to `docs/token-taxonomy.md` in the right § (§2.0 if L0; §2.1–§2.17 for legacy L1 surfaces).
3. Run `pnpm --filter @exxatdesignux/ui tokens:index` and commit the
   regenerated `packages/ui/tokens/hooks-index.json`.
4. If you are **deprecating** a token, also open a numbered entry under
   `docs/migrations/` (see `docs/migrations/README.md` template).

---

## 12. Summary — MUST / MUST NOT

| MUST | MUST NOT |
|------|----------|
| Use **`HubTable`** (from **`@/components/data-views`**) inside **`ListPageTemplate.renderContent`** — it wires `useTableState`, the **toolbar** (search + filter chips + filter dropdown + sort), and **`TablePropertiesDrawerButton`** in one place. Pass **`view`** / **`onViewChange`** through (§4.2); raw **`DataTable`** is fine **only** outside hubs (drawer/dialog mini-grids) | Mount raw **`<DataTable>`** in a hub or showcase — users lose filter chips and Properties; introduce a second table stack for the same surfaces; omit **`currentView`** on multi-view pages |
| Wrap main `DataTable` in `ListPageTemplate` | `DataTable` only under `PageHeader` without view tabs |
| Use primary template (`ListPageTemplate` + metrics + export pattern) for primary hubs with large data | Hub pages that look like “nested cards” with staggered margins |
| Match Placements for export + primary CTA + More menu | Outline button as the single primary CTA on exportable pages |
| Pair `Kbd` hints with real shortcuts | Browser-reserved chords for app actions |
| Global palette: **§7.1** — search + quick in-menu AI vs **Ask Leo**; **`dataGroups`** + **`searchOnly`** for bulky indexes | Palette as link-only dump; AI that belongs in **Ask Leo** forced into the palette; mounting full **`dataGroups`** on open when **`searchOnly`** should hide them |
| **§6.4** — **drawer** when **page context + quick** view/actions; **dialog** for **blocking** confirm/alert/short choice; **new page** for primary / long / own-URL flows | Forcing **full workflows** into a drawer when a route fits; using a **dialog** when users must **reference** the grid (prefer drawer); **routing** for tasks that are only quick glances over a hub |
| **KPI strips** — **≤ 4** `MetricItem` per **`KeyMetrics`** on template metrics + Data-tab key-metrics cards (**`KEY_METRICS_KPI_COUNT_MAX`**) | Fifth+ headline tile in the same strip; duplicate tiles to pad count |
| **Cards vs rows** — **DataTable** for dense comparable hubs; **`ListPageBoardCard`** / **`ListPageViewFrame`** when visual/kanban/folder — **`docs/card-vs-rows-pattern.md`** | Card walls for **50+** homogeneous records where the product expects **sort/filter/compare** without a deliberate UX exception |
| **Reuse before custom** — scan **`components/`** + **§9**; **ask the user** before new shared primitives or large bespoke widgets — **`exxat-reuse-before-custom.mdc`** | Parallel stacks; silent new “table” or metric systems when **`DataTable`** / **`KeyMetrics`** already apply |
| **§6.5** — feedback via **banners / inline / dialogs** — **no** toast or snackbar | **`toast()`** / **Sonner** / transient corner notifications for product messaging |
| Meet **§8** + **`exxat-accessibility`** skill (ARIA, 24px targets, contrast, **§8.3** min **11px** text, overlay titles) | `tablist` mixing non-tabs; **16px** sole targets; dialogs without titles; text below **11px** (except legally required fine print) |
| Use `CoachMark` + `useCoachMark` for onboarding tours (§11); register in `coach-mark-registry` | Build one-off walkthrough overlays or custom onboarding modals |
| Data view charts: **`ChartFigure`** + **`ChartDataTable`**; keyboard highlight via **`chart-keyboard-selection`** (§4.3); layout via **`data-view-dashboard-storage`** | Ad-hoc `localStorage` keys for dashboard layout; opacity-only “selection” without `activeBar`/`activeShape` |
| Board cards: **`ListPageBoardCard`** shell; status via **`ListHubStatusBadge`** + **`lib/list-status-badges`**; no **`uppercase`** on status chips (§4.4) | One-off board card markup; status as plain body text; duplicated status maps outside **`list-status-badges`**; **empty placeholder** primary hubs (§4.1) |
| **§4.5** — Non-table view bodies use **`ListPageViewFrame`** (+ **`data-views/`** shells); new grids are generic components, not route-only markup | Duplicated `mx-4` / `max-w-*` per hub; wrapping **`DataTable`** so inset **doubles** (**§5**) |
| **§4.6** — **`secondaryPanel`** + **`PANELS`** + **`useAutoPanel`** together for nested scope nav; **folder URL scope** → header **⋯** **Customize folder** + client-mounted **`LibraryNewFolderSheet`** (**`exxat-library-hub-header.mdc`**) | **`secondaryPanel`** id with no panel component or activator; folder scope with customize **only** inside a single view tab’s subtree |
| **§4.7** — **`PageHeader` `variant="collaboration"`** + **`CollaborationAccessFlow`** / **`InviteCollaboratorsDrawer`**; empty **Add collaborator** + non-empty face rail; roster + invite from **`collaborator-access.ts`** | Extra invite beside a populated face rail; per-person roster cards; forked access enums; toast on invite |
| **§4.8** — **`DedicatedSearch*`** templates + composer + recents; **no** `localStorage` in **`useState`** initial paint; hub-specific **`patchSearchParams`** only | Forked `*Library*SearchLanding*` shells for another entity; hydration mismatch on recents |
| **Font Awesome** — Kit in **`app/layout.tsx`**; **`fa-light` / `fa-solid`** conventions; **`aria-hidden`** on decorative **`<i>`**; run **`fa:subset-audit`** when adding glyphs (**`exxat-fontawesome-icons.mdc`**) | Parallel icon libraries for the same product chrome |
| **System IDs** — **`font-mono tabular-nums`** on question/record keys; mono **only** the ID token in mixed subtitles (**`exxat-mono-ids.mdc`**) | Mono on names, statuses, dates, or whole subtitle lines |

---

## 13. AI execution checklist (list / table / board page)

Copy and complete when implementing or reviewing:

- [ ] **Centralized dataset:** One **`useTableState`** / **`tableState.rows`** for **all** view tabs and inspectors; **TablePropertiesDrawer** on the **same** `DataTable`; **no** parallel mock arrays per view — **`.cursor/rules/exxat-centralized-list-dataset.mdc`**.
- [ ] **Hub primitive (`HubTable`):** Every page that mounts a hub grid inside **`ListPageTemplate`** uses **`HubTable`** (from **`@/components/data-views`**), not raw **`<DataTable>`**. **`HubTable`** wires `useTableState`, the toolbar (search + filter chips + filter dropdown + sort), and **`TablePropertiesDrawerButton`** in one place; raw **`<DataTable>`** is reserved for tiny embedded grids (drawer/dialog body). When a column ships **`filter:`**, the chips appear automatically — **MUST NOT** add a parallel search/filter UI above the table — **`.cursor/rules/exxat-data-tables.mdc`**.
- [ ] **Reuse:** `ListPageTemplate`, `DataTable` / `useTableState`, `TablePropertiesDrawer` — no parallel bespoke tabs/filters. **New shared primitives:** **ask the user** after scanning **`components/`** + **§9** — **`.cursor/rules/exxat-reuse-before-custom.mdc`**.
- [ ] **Tabs:** Any main `DataTable` sits under `ListPageTemplate` with appropriate view tabs.
- [ ] **Inset:** No double horizontal padding around `DataTable`.
- [ ] **§4.5 View shells:** Folder / panel / icon views use **`ListPageViewFrame`** (or a **`data-views/`** component that uses it); no page-tied-only grid wrappers; **`DataTable`** not double-wrapped (**§5**).
- [ ] **> ~10 items:** Search, filter, sort, properties (per surface type in §6.1).
- [ ] **Exportable data:** Filled primary CTA; **⋯** menu with Export → `ExportDrawer`.
- [ ] **Primary hub + large data:** Same composition as `PlacementsClient` / `TeamClient` (template + metrics when applicable).
- [ ] **All view tabs:** List/board/dashboard use **`tableState.rows`**; dashboard view uses **`KeyMetrics`** + shared KPI helpers — no “not wired” placeholders or duplicate metric cards.
- [ ] **Properties drawer:** **`TablePropertiesDrawer`** receives **`currentView`** and **`onViewChange`** from **`renderContent`** / **`updateTab`** + **`dataListViewIcon`** (§4.2) — not table-only copy on Board/List/Dashboard.
- [ ] **Add view parity:** **`FULL_HUB_SUPPORTED_VIEWS`** on **`ListPageTemplate`** + **`HubTable`** (in sync); every allowed view has a renderer; list uses **`ListPageBoardCard`** — **`.cursor/rules/exxat-hub-supported-views.mdc`**, **`docs/hub-supported-views-pattern.md`**.
- [ ] **Data view dashboard (Placements / Team / Compliance):** Charts use **`ChartFigure`** + **`ChartDataTable`**; **Edit layout** on toolbar; **`activeBar` / `activeShape`** keyboard styling from **`lib/chart-keyboard-selection`** — not opacity-only **`Cell`** hacks (§4.3).
- [ ] **Dashboard layout persistence:** **`lib/data-view-dashboard-storage`** (or **`saveDashboardLayout`** / **`loadDashboardLayout`** on Placements); **`mergeDashboardLayout`** on load — no new ad-hoc storage keys for the same layout (§4.3).
- [ ] **⌘K palette (§7.1):** If adding or changing **`dataGroups`**, map rows in **`lib/command-menu-search-data.ts`** (not `command-menu.tsx`); use **`searchOnly`** on bulky groups; keep **`docs/command-menu-pattern.md`** aligned.
- [ ] **Page vs drawer vs dialog (§6.4):** Quick auxiliary with **parent context** and interactable hub → **drawer/sheet**; **blocking** short confirm → **dialog**; primary or long flows → **new route** — **`docs/data-views-pattern.md`**, **`docs/drawer-vs-dialog-pattern.md`**.
- [ ] **Cards vs rows:** Primary sortable hub with many homogeneous records → **`DataTable`**; kanban / visual tiles → **`ListPageBoardCard`** — **`docs/card-vs-rows-pattern.md`**, **`.cursor/rules/exxat-card-vs-list-rows.mdc`**.
- [ ] **KPI count (max four):** **`entityKpiMetrics`** (and any static **`MetricItem[]`** for the same strip) has **≤ 4** tiles for template metrics + Data-tab key-metrics — **`docs/kpi-strip-max-four-pattern.md`**, **`.cursor/rules/exxat-kpi-max-four.mdc`**.
- [ ] **No toast (§6.5):** No **`toast()`** / Sonner / snackbars — use banners, inline status, or dialogs.
- [ ] **Typography (§8.3):** No visible copy below **11px** — use **`text-xs`** (`--text-xs` in **`globals.css`**); board/list cards use **`text-xs`** / **`text-sm`** for body lines.
- [ ] **Board cards (§4.4):** **`ListPageBoardCard`** + hierarchy (title → badge row → body); **`ListPageBoardCardAvatar`** when appropriate; status via **`ListHubStatusBadge`** + **`lib/list-status-badges`** — **not** `uppercase` on labels; **`BoardCardTwoLineBlock`** for stacked facts.
- [ ] **New primary hub routes:** **Not** placeholder-only pages — full **`ListPageTemplate`** stack + mock rows + connected views (**§4.1**).
- [ ] **List hub status (§4.4):** **`ListHubStatusBadge`** or Placements **`StatusBadge`**; maps only in **`lib/list-status-badges.ts`**; prefer **`LIST_HUB_STATUS_TINT_*`** for new entities.
- [ ] **Kbd:** Follow `exxat-kbd-shortcuts.mdc` if adding shortcuts or hints.
- [ ] **Accessibility:** §8 — tablist/toolbar patterns, **≥24px** targets for icon-only controls, contrast on tinted surfaces, dialog/sheet/drawer **titles**; **every icon that communicates info has a text alternative** — adjacent label (preferred) OR `aria-label` + `Tooltip` (§8.6 Case A/B/C, covers informational icons like calendar-for-date, status dots, AND icon-only buttons); **kbd inside a button uses `<Kbd variant="bare">`** (§8.7); re-run **axe** on Placements when changing views toolbar.
- [ ] **Coach marks (§11):** `CoachMark` + `useCoachMark`; register in **`coach-mark-registry`**; use **`enabled`** / **`dependsOnDismissedFlowId`** when a tour must wait for another flow or a specific view (e.g. **dashboard**); customize-dashboard flows use **`lib/dashboard-customize-coach-mark.ts`**.
- [ ] **Application sidebar (§9.1):** **`ExxatProductLogo`** for product; **`logoDevUrl`** for schools; team switcher **`DropdownMenuContent`** keeps the explicit wide school/program surface (**`!w-max`** + min/max width); expanded switcher **`h-auto min-h-12`**; no **`CollapsibleTrigger` → `SidebarMenuButton` with `tooltip` prop**; child links **popover** on icon rail; profile **`stockPortraitUrl`** + **`referrerPolicy="no-referrer"`** on **`AvatarImage`**.
- [ ] **Secondary panel (§4.6):** If **`NavLinkItem.secondaryPanel`** is set — **`PANELS[id]`** in **`secondary-panel.tsx`**, hub mounts **`useAutoPanel(id)`**, scope syncs to URL + **`tableState.rows`** — **`.cursor/rules/exxat-primary-nav-secondary-panel.mdc`**. Panel shell uses **`--secondary-panel-bg`** (brand OKLCH, not **`bg-sidebar`**) — **`docs/shell-surface-elevation-pattern.md`**. **Library folder scope:** header **⋯** → **Customize folder** + **`LibraryNewFolderSheet`** on **`LibraryClient`** — **`docs/library-hub-header-pattern.md`**, **`.cursor/rules/exxat-library-hub-header.mdc`**.
- [ ] **Flat KPI strip:** **`KeyMetrics variant="flat"`** — transparent cells, radial glow only, **`flatMetricsHairlineClass`** borders — **`docs/kpi-flat-band-pattern.md`**, **`.cursor/rules/exxat-kpi-flat-band.mdc`**.
- [ ] **Collaboration & access (§4.7):** Shared hubs use **`variant="collaboration"`**, empty **Add collaborator** / non-empty face rail, **⋯ → Invite people**, **`CollaborationAccessFlow`** or **`InviteCollaboratorsDrawer`**, **`lib/collaborator-access.ts`**, roster **name → email → role tags** — **`.cursor/rules/exxat-collaboration-access.mdc`**.
- [ ] **Dedicated search (§4.8):** Landing uses **`DedicatedSearchLandingTemplate`**; results use **`DedicatedSearchResultsHeaderChrome`** + outer **`DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME`**; **`DedicatedSearchUrlComposer`** + **`DedicatedSearchRecents`** with **`createDedicatedSearchRecentsController`** — **`.cursor/rules/exxat-dedicated-search-surfaces.mdc`**.
- [ ] **KPI trends:** **`MetricItem.trend`** matches the delta direction; **`trendPolarity`** set for “more is worse” metrics (flags, defects, overdue); **`delta`** is a count (not prose) and is **left empty** when there is no comparison (chip is suppressed — no `—` placeholder); supporting prose lives in **`MetricItem.description`** (renders below the value) — **`docs/kpi-trend-pattern.md`**, **`.cursor/rules/exxat-kpi-trends.mdc`**.
- [ ] **Person rails — no overlap:** Face rails / reviewer piles / collaborator stacks render avatars **side-by-side** with **`gap-1`** / **`gap-1.5`** (use **`AvatarGroup`** + **`AvatarGroupCount`** for **`+N`**); **MUST NOT** restore negative-margin overlap (`-space-x-*` + `*:ring-*`) — **`.cursor/rules/exxat-person-identity-display.mdc`**.
- [ ] **Font Awesome:** New glyphs covered by **`fa:subset-audit`** / Kit subset; decorative **`<i>`** has **`aria-hidden`**; icon-only controls follow **§8.6** — **`.cursor/rules/exxat-fontawesome-icons.mdc`**.
- [ ] **System IDs:** Visible **`questionId`**, record keys, and copy-pasteable identifiers use **`font-mono tabular-nums`**; mixed lines mono-wrap **only** the ID — **`.cursor/rules/exxat-mono-ids.mdc`**, **`.cursor/skills/exxat-mono-ids/SKILL.md`**.

---

*Last updated: HubTable is the canonical hub primitive (raw DataTable only outside hubs); filter button tooltip nesting fix; KPI delta vs description (chip suppressed when empty) + no overlapping avatars (`AvatarGroup` is gapped, not negative-margin); KPI flat band + shell surface elevation pattern docs/rules/skills; §4.6 secondary panel OKLCH; monospace system IDs; library folder header; drawer vs dialog / card vs rows / KPI max-four; §4.8 dedicated search; §4.7 collaboration; §4.1 centralized dataset; §4.5 view shells; Font Awesome; §9.1 sidebar; §4.4 board cards; §6.5 no toast; §7.1 command palette; §13 checklist.*
