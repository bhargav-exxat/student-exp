/**
 * Central exports for list-page data surfaces and shared view chrome.
 *
 * **Pattern:** `ListPageTemplate` + `HubTable` — one `useTableState`, one toolbar,
 * table | list | board | dashboard from the same primitive (`AGENTS.md` §4,
 * `docs/data-views-pattern.md`). See `columns-showcase.tsx` and
 * `tokens-themes-client.tsx` for reference compositions in this app.
 *
 * **View UI:** `ViewSegmentedControl` matches the template’s views toolbar (`bg-muted/60` pills).
 */

export type { DataListViewType } from "@/lib/data-list-view"
export { DATA_LIST_VIEW_TILES, dataListViewIcon, dataListViewLabel } from "@/lib/data-list-view"

/** View registry — single source for view labels/icons/render kinds + per-hub allowlist filtering. */
export {
  DATA_LIST_VIEW_REGISTRY,
  dataListViewDefinition,
  dataListViewTilesForHub,
  dataListViewSelectionTilesForHub,
  showsListPageHubMetricsStrip,
  isDataListSurfaceViewType,
  isDataListViewTypeSupported,
  type DataListViewDefinition,
  type DataListViewRenderKind,
} from "@/lib/data-list-view-registry"

/** Per-hub view router — switches the active view body by render kind, with a clear empty state for unsupported views (never silent dashboard fallback). */
export {
  ListPageConnectedViewBody,
  ListPageViewNotConfigured,
  type ListPageConnectedViewBodyProps,
  type ListPageConnectedViewRenderers,
} from "@/components/data-views/list-page-connected-view-body"

/** Single centralized hub table — owns `useTableState`, drawer wiring, and view-body routing.
 *  Every list-page hub composes this with its own columns + renderer map. */
export {
  HubTable,
  columnsToFilterFields,
  columnsToFieldDefinitions,
  type HubTableProps,
  type HubTableHandle,
  type HubTableRendererArgs,
  type HubTableRenderers,
  type HubDrawerToolbarProps,
  type BulkAction,
  type CreatedViewSpec,
} from "@/components/data-views/hub-table"

/** Seed helper for the 2-step "Add view" creation flow — pre-populate
 *  localStorage so the new tab restores spec'd filters/sort/columns/etc.
 *  on first mount. */
export {
  seedTableStateLifecycle,
  type SeedTableStateLifecyclePartial,
} from "@exxatdesignux/ui/lib/table-state-lifecycle"

/** Typed renderer builder for hubs declaring `supportedViewTypes` — dev-time warning when a supported view has no body. */
export {
  defineHubViewRenderers,
  hubRenderKindsForSupported,
  type HubConnectedViewRenderers,
  type HubRenderKindForViews,
} from "@/lib/hub-connected-view-renderers"

export {
  ListPageTemplate,
  type ViewTab,
  type ViewType,
  VIEW_TYPES,
} from "@/components/templates/list-page"

export {
  ViewSegmentedControl,
  viewSegmentedToolbarClass,
  viewSegmentedButtonClass,
  type ViewSegmentOption,
} from "@/components/ui/view-segmented-control"

/** Shared gutter + centered max-width for list view bodies (folder grid, OS explorer, etc.). */
export {
  ListPageViewFrame,
  LIST_PAGE_VIEW_FRAME_GUTTER,
  LIST_PAGE_VIEW_FRAME_MAX_ICON_GRID,
  LIST_PAGE_VIEW_FRAME_MAX_WIDE,
  type ListPageViewFrameProps,
} from "@/components/data-views/list-page-view-frame"

/** Centered bordered card + viewport height for finder / tree / multi-column split hubs. */
export {
  ListPageSplitHubChrome,
  LIST_PAGE_SPLIT_HUB_HEIGHT_STYLE,
  type ListPageSplitHubChromeProps,
} from "@/components/data-views/list-page-split-hub-chrome"

export {
  ListPageTreeColumnHeader,
  type ListPageTreeColumnHeaderProps,
} from "@/components/data-views/list-page-tree-column-header"

/** VS Code–style outline tree chrome — mirrors shadcn `SidebarMenuSub` (see module doc). */
export {
  OutlineTreeCollapsibleContentRail,
  OutlineTreeLeafButton,
  OutlineTreeMenu,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  OutlineTreeSubItem,
  OUTLINE_TREE_COLLAPSIBLE_CONTENT_RAIL_CLASS,
  OUTLINE_TREE_CHEVRON_GUIDE_SPACER_CLASS,
  OUTLINE_TREE_SUB_ROW_SHIFT_CLASS,
  type OutlineTreeGuideLayout,
  type OutlineTreeLeafButtonProps,
  type OutlineTreeSurface,
} from "@/components/data-views/outline-tree-menu"

export { LibraryFolderTreeBranch } from "@/components/data-views/library-folder-tree-branch"
export type { LibraryFolderTreeBranchProps } from "@/components/data-views/library-folder-tree-branch"

export {
  LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS,
  LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS,
  LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS,
} from "@/components/data-views/list-page-split-hub-tokens"

export {
  ListPageSplitDetailsPlaceholder,
  type ListPageSplitDetailsPlaceholderProps,
} from "@/components/data-views/list-page-split-details-placeholder"

/** Tree / outline + inspector — `ListPageTreePanelShell`; composed hub wiring (`HubTreePanelView`); folder metrics (`FolderDetailsShell`). */
export {
  FolderDetailsShell,
  type FolderDetailsShellProps,
} from "@/components/folder-details-shell"

export {
  HubTreePanelView,
  type HubTreePanelViewProps,
} from "@/components/hub-tree-panel-view"

export {
  ListPageTreePanelShell,
  type ListPageTreePanelShellProps,
} from "@/components/data-views/list-page-tree-panel-shell"

/** Windows 11–style folder art (Icons8) + FA overlay for icon-folder hubs. */
export {
  OsFolderGlyph,
  OS_FOLDER_GLYPH_SRC,
  type OsFolderGlyphProps,
} from "@/components/data-views/os-folder-glyph"

/** Generic folder icon-grid — reusable across all list hubs. */
export { FolderGridView, type FolderGridViewProps } from "@/components/data-views/folder-grid-view"

/** Generic vertical row list — used by every hub's "list" tab. Composes
 *  `ListPageBoardCard layout="row"` via a `renderRow` prop. */
export { DataRowList, type DataRowListProps } from "@/components/data-views/data-row-list"

/** Reusable `ColumnDef['cell']` renderers — progress, currency, rating,
 *  relative time, attachments, external link, face rails, pills, signal bars,
 *  inline toggles, and a generic `<TRow>` `RowActionsCell`. The live catalog
 *  is `columns-showcase.tsx` (`/columns`).
 *  Skill: `.cursor/skills/exxat-token-economy/SKILL.md` §3. */
export {
  AttachmentCountCell,
  BooleanToggleCell,
  CurrencyCell,
  EMPTY_DASH,
  ExternalLinkCell,
  NumericCell,
  PeopleAvatarRailCell,
  PillCell,
  ProgressCell,
  RatingCell,
  RelativeTimeCell,
  RowActionsCell,
  SignalBarsCell,
  TagListCell,
  type PersonStub,
  type ProgressTone,
  type RowActionDef,
  type SignalTone,
} from "@/components/data-views/table-cells"


/** Unified hub tile + list row surface — see `list-page-board-card.tsx`. */
export {
  HubRecordCard,
  ListPageBoardCard,
  ListPageBoardCardAvatar,
  ListPageBoardCardBadgeRow,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardSecondary,
  ListPageBoardCardTitleRow,
  type ListPageBoardCardLayout,
  type ListPageBoardCardProps,
} from "@/components/data-views/list-page-board-card"
