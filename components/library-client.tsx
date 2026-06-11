"use client"

/**
 * Library hub — ListPageTemplate + KeyMetrics + LibraryTable (Team / Compliance pattern).
 * URL hash syncs the active view tab; `?scope=` + `folderId=` sync with the secondary nav (`lib/library-nav.ts`).
 * (Primary sidebar “Library” must not treat that hash as “off-route” — `app-sidebar` `isNavActive` ignores hash for `href` without `#…`.)
 */

import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ListPageTemplate,
  type ViewTab,
  dataListViewIcon,
  type DataListViewType,
  VIEW_TYPES,
  seedTableStateLifecycle,
} from "@/components/data-views"
import type { ViewType, CreatedViewSpec } from "@/components/data-views"
import { LIBRARY_SUPPORTED_VIEWS } from "@/lib/library-supported-views"
import { LibraryPageHeader } from "@/components/library-page-header"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import { CollaborationAccessFlow } from "@/components/collaboration-access-flow"
import { LibraryTable, type LibraryTableHandle } from "@/components/library-table"
import type { BulkAction } from "@/components/data-views"
import { SecondaryPanelHubTemplate } from "@/components/templates/secondary-panel-hub-template"
import { LibraryAccessBridge, LibraryFolderBridge } from "@/components/sidebar"
import { KeyMetrics } from "@/components/key-metrics"
import { useSidebar } from "@/components/ui/sidebar"
import { useProduct } from "@/contexts/product-context"
import { productPersistKey } from "@/stores/app-store"
import { useSecondaryPanelHubNav } from "@/hooks/use-secondary-panel-hub-nav"
import { LIBRARY_ITEMS, type LibraryItem } from "@/lib/mock/library"
import { LIBRARY_HEADER_COLLABORATORS } from "@/lib/mock/library-header-collaborators"
import { DEFAULT_LIBRARY_FOLDERS, type LibraryFolder } from "@/lib/mock/library-folders"
import { libraryKpiInsight, libraryKpiMetrics } from "@/lib/mock/library-kpi"
import {
  applyLibraryHubDisplayFilters,
  isLibraryDefaultNav,
  isLibraryDedicatedSearchPathname,
  parseLibraryNav,
  LIBRARY_HUB_BREADCRUMB,
  LIBRARY_HUB_FIND_PATH,
  LIBRARY_ALL_PATH,
  LIBRARY_LIBRARY_HUB_PATHS,
  LIBRARY_LIST_PATH,
  libraryCanonicalNavHref,
  libraryHubHeaderModel,
  libraryHubTextMatchesNothing,
  libraryRouteHref,
  type LibraryLandingFilterState,
} from "@/lib/library-nav"
import {
  patchLibraryDedicatedSearchParams,
  LIBRARY_DEDICATED_SEARCH_PLACEHOLDERS,
} from "@/lib/library-dedicated-search"
import { recordLibraryRecentSearch, libraryDedicatedSearchRecents } from "@/lib/library-recent-searches"
import { DedicatedSearchRecents } from "@/components/dedicated-search-recents"
import { DedicatedSearchUrlComposer } from "@/components/dedicated-search-url-composer"
import { DedicatedSearchLandingTemplate } from "@/components/templates/dedicated-search-landing-template"
import {
  DedicatedSearchResultsHeaderChrome,
  DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME,
} from "@/components/templates/dedicated-search-results-template"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: "questions",
    label: "Questions",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

const SEARCH_LANDING_TABS: ViewTab[] = [DEFAULT_TABS[0]]

function ignoreLibraryTabsUpdate(_next: ViewTab[]) {}
function ignoreLibraryTabActivation(_id: string) {}
/** Stable no-op for search-landing branch where manage-access is not available. */
function noopManageAccess() {}

function libraryQueryPrefixFromSearchString(qs: string) {
  return qs ? `?${qs}` : ""
}

export function LibraryClient() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { product, customProducts, activeCustomIndex } = useProduct()
  const libraryPersistKey = productPersistKey(product, "library", customProducts, activeCustomIndex)
  const librarySearchPersistKey = productPersistKey(product, "library:search", customProducts, activeCustomIndex)
  const [items, setItems] = React.useState(() => LIBRARY_ITEMS.map(q => ({ ...q })))
  const [folders, setFolders] = React.useState(() => DEFAULT_LIBRARY_FOLDERS.map(f => ({ ...f })))
  const canonicalLibraryNavHref = React.useCallback(
    (sp: URLSearchParams) => libraryCanonicalNavHref(sp, folders),
    [folders],
  )
  const { navState, searchParamsKey, pathname, isHubPath, hubBasePath, libraryBasePath } = useSecondaryPanelHubNav({
    hubPathname: LIBRARY_ALL_PATH,
    hubPathnames: LIBRARY_LIBRARY_HUB_PATHS,
    panelId: "library",
    parseNav: parseLibraryNav,
    canonicalHref: canonicalLibraryNavHref,
    shouldReopenPanel: isLibraryDefaultNav,
    /** Hub/find + list are full-width — layout closes the panel; do not fight it with `openPanel`. */
    reopenPanelOnPathnames: [LIBRARY_ALL_PATH],
  })
  const isDedicatedSearch = isLibraryDedicatedSearchPathname(pathname)
  const isHubFindSurface = pathname === LIBRARY_HUB_FIND_PATH
  const dedicatedSearchTitle = isHubFindSurface ? "Discovery search" : "Search Questions"
  const landingFilters = React.useMemo((): LibraryLandingFilterState | null => {
    if (!isDedicatedSearch) return null
    const sp = new URLSearchParams(searchParamsKey)
    return {
      hubFreeText: sp.get("q") ?? "",
      favOnly: sp.get("fav") === "1",
      clinicalDeck: sp.get("deck") === "clinical",
    }
  }, [isDedicatedSearch, searchParamsKey])
  const urlToolbarSearchSync = searchParams.get("q") ?? ""
  const hasUrlSearch = Boolean((isDedicatedSearch ? landingFilters?.hubFreeText : urlToolbarSearchSync)?.trim())
  const [tabs, setTabs] = React.useState<ViewTab[]>(DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = React.useState(DEFAULT_TABS[0].id)

  // ── 2-step "Add view" creation flow ─────────────────────────────────────
  // The creation drawer is mounted inside `<HubTable>` (see `LibraryTable` →
  // `HubTable`), wired to a separate ephemeral `useTableState` buffer. The
  // client just supplies the lifecycle: which view type is being created, a
  // controlled name input, cancel, and commit. On commit, the spec carries
  // the configured filters / sort / columns / etc.; we seed the new tab's
  // localStorage record so those values stick when the new tab activates.
  const [showViewCounts, setShowViewCounts] = React.useState(true)
  const [creatingViewType, setCreatingViewType] = React.useState<ViewType | null>(null)
  const [creatingName, setCreatingName] = React.useState("")

  const handleRequestCreateView = React.useCallback((type: ViewType) => {
    setCreatingViewType(type)
    const def = VIEW_TYPES.find(v => v.type === type)!
    const existingCount = tabs.filter(t => t.viewType === type).length
    setCreatingName(existingCount === 0 ? def.label : `${def.label} ${existingCount + 1}`)
  }, [tabs])

  const handleCancelCreation = React.useCallback(() => {
    setCreatingViewType(null)
    setCreatingName("")
  }, [])

  const handleCommitCreation = React.useCallback((spec: CreatedViewSpec) => {
    const def = VIEW_TYPES.find(v => v.type === spec.viewType)!
    const newTabId = `${spec.viewType}-${Date.now().toString(36)}`
    seedTableStateLifecycle(libraryPersistKey, newTabId, {
      activeFilters: spec.filters,
      sortRules: spec.sortRules,
      colOrder: spec.colOrder,
      hiddenCols: spec.hiddenCols,
      groupBy: spec.groupBy,
      conditionalRules: spec.conditionalRules,
      displayOptions: spec.displayOptions,
    })
    const newTab: ViewTab = {
      id: newTabId,
      label: spec.name || def.label,
      viewType: spec.viewType,
      icon: def.icon,
      filterId: "all",
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setCreatingViewType(null)
    setCreatingName("")
  }, [libraryPersistKey])

  // Stable Set of tab ids — defaults are constant so this only updates if tabs change.
  const tabIds = React.useMemo(() => new Set(tabs.map(t => t.id)), [tabs])

  // Keep the latest pathname / searchParamsKey / tabIds available to the (stable) hashchange
  // listener via refs, so we don't re-subscribe a window listener on every URL change.
  const navRef = React.useRef({ pathname, searchParamsKey, tabIds, hubBasePath })
  React.useEffect(() => {
    navRef.current = { pathname, searchParamsKey, tabIds, hubBasePath }
  }, [pathname, searchParamsKey, tabIds, hubBasePath])

  React.useEffect(() => {
    if (!isHubPath || isDedicatedSearch) return
    const apply = () => {
      const current = navRef.current
      if (!LIBRARY_LIBRARY_HUB_PATHS.includes(current.pathname)) return
      const raw = typeof window !== "undefined" ? window.location.hash.slice(1) : ""
      const nextId = raw && current.tabIds.has(raw) ? raw : "questions"
      setActiveTabId(nextId)
      if (nextId === "questions" && raw && raw !== "questions") {
        const prefix = libraryQueryPrefixFromSearchString(current.searchParamsKey)
        navigate(`${current.hubBasePath}${prefix}`, { replace: true })
      }
    }
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
    // Re-run on pathname changes (mount/unmount); URL search-param changes are read from the ref.
  }, [isHubPath, isDedicatedSearch, navigate])

  const onActiveTabChange = React.useCallback(
    (id: string) => {
      if (isDedicatedSearch) return
      setActiveTabId(id)
      if (!isHubPath) return
      const prefix = libraryQueryPrefixFromSearchString(searchParamsKey)
      if (id === "questions") {
        navigate(`${hubBasePath}${prefix}`, { replace: true })
      } else {
        navigate(`${hubBasePath}${prefix}#${id}`, { replace: true })
      }
    },
    [hubBasePath, isHubPath, isDedicatedSearch, navigate, searchParamsKey],
  )

  const [exportOpen, setExportOpen] = React.useState(false)
  const [showMetrics, setShowMetrics] = React.useState(true)
  React.useLayoutEffect(() => {
    if (hasUrlSearch) setShowMetrics(false)
  }, [hasUrlSearch])
  const tableRef = React.useRef<LibraryTableHandle>(null)

  const [hubFolderCustomizeSheetOpen, setHubFolderCustomizeSheetOpen] = React.useState(false)
  const [hubFolderCustomizeTarget, setHubFolderCustomizeTarget] = React.useState<LibraryFolder | null>(null)

  const openHubScopedFolderCustomize = React.useCallback(() => {
    if (navState.scope !== "folder" || !navState.folderId) return
    const f = folders.find(x => x.id === navState.folderId)
    if (!f) return
    setHubFolderCustomizeTarget(f)
    setHubFolderCustomizeSheetOpen(true)
  }, [folders, navState.folderId, navState.scope])

  /**
   * Open the full-page authoring composer (`/library/new`).
   * Pre-collapses the main sidebar (Placements pattern) so the user sees one
   * smooth animation into the focused authoring flow. Folder scope, when
   * present, is forwarded as `?folderId=` so the destination dropdown lands
   * pre-selected on the right rail.
   */
  const { setOpen: setMainSidebarOpen } = useSidebar()
  const handleNewQuestion = React.useCallback(() => {
    const folderQuery =
      navState.scope === "folder" && navState.folderId
        ? `?folderId=${encodeURIComponent(navState.folderId)}`
        : ""
    setMainSidebarOpen(false)
    window.setTimeout(
      () => navigate(`${libraryRouteHref("/library/new", libraryBasePath)}${folderQuery}`),
      260,
    )
  }, [libraryBasePath, navState.folderId, navState.scope, navigate, setMainSidebarOpen])

  // ── Polaris-style structured bulk actions (HubTable demo) ──────────────
  // Wired here to demonstrate the new `bulkActions` prop. Selecting one or
  // more rows reveals the floating bulk-action bar with Favorite + Archive
  // buttons; `onSelect` receives the actual `LibraryItem[]`. Esc clears the
  // selection (handled inside `DataTable`). The bar is `role="status"`
  // `aria-live="polite"` so AT announces "N rows selected".
  const handleBulkFavorite = React.useCallback(
    (rows: LibraryItem[]) => {
      console.info("[Library] bulk favorite", rows.map(r => r.id))
      setItems(prev =>
        prev.map(r =>
          rows.some(s => s.id === r.id) ? { ...r, isStarred: !r.isStarred } : r,
        ),
      )
    },
    [],
  )
  const handleBulkArchive = React.useCallback(
    (rows: LibraryItem[]) => {
      console.info("[Library] bulk archive (demo only — no removal)", rows.map(r => r.id))
    },
    [],
  )
  // Per `exxat-ux-principles.mdc` P3 the bar has no single primary action —
  // both Favorite and Archive render as `outline`. Archive is a soft-state
  // change, NOT destructive; only a real "Delete" callback would warrant
  // `variant: "destructive"`.
  const libraryBulkActions = React.useMemo<BulkAction<LibraryItem>[]>(
    () => [
      {
        id: "favorite",
        label: "Favorite",
        icon: "fa-star",
        ariaLabel: "Toggle favorite on selected questions",
        onSelect: handleBulkFavorite,
      },
      {
        id: "archive",
        label: "Archive",
        icon: "fa-box-archive",
        ariaLabel: "Archive selected questions",
        onSelect: handleBulkArchive,
      },
    ],
    [handleBulkFavorite, handleBulkArchive],
  )

  const filteredItems = React.useMemo(
    () => applyLibraryHubDisplayFilters(items, folders, navState, landingFilters),
    [items, folders, landingFilters, navState],
  )

  const count = filteredItems.length

  const metrics = React.useMemo(() => libraryKpiMetrics(filteredItems), [filteredItems])
  const insight = React.useMemo(() => libraryKpiInsight(filteredItems), [filteredItems])

  const hubHeader = React.useMemo(
    () => {
      const model = libraryHubHeaderModel(folders, navState)
      return {
        ...model,
        breadcrumbs: model.breadcrumbs?.map(crumb => ({
          ...crumb,
          href: crumb.href ? libraryRouteHref(crumb.href, libraryBasePath) : crumb.href,
        })),
      }
    },
    [folders, libraryBasePath, navState],
  )

  const hubTextHadNoMatches = React.useMemo(
    () =>
      isDedicatedSearch &&
      landingFilters != null &&
      libraryHubTextMatchesNothing(items, folders, navState, landingFilters),
    [folders, isDedicatedSearch, items, landingFilters, navState],
  )

  if (isDedicatedSearch) {
    const dedicatedReplacePath = libraryRouteHref(
      isHubFindSurface ? LIBRARY_HUB_FIND_PATH : LIBRARY_LIST_PATH,
      libraryBasePath,
    )
    const showDedicatedSearchResults = hasUrlSearch

    return (
      <>
        <LibraryFolderBridge
          folders={folders}
          onFoldersChange={setFolders}
          items={items}
          onItemsChange={setItems}
        />
        <LibraryAccessBridge openManageAccess={noopManageAccess} />
        <SecondaryPanelHubTemplate
          siteHeader={{
            title: dedicatedSearchTitle,
            breadcrumbs: [
              {
                label: LIBRARY_HUB_BREADCRUMB.label,
                href: libraryRouteHref(LIBRARY_HUB_BREADCRUMB.href, libraryBasePath),
              },
            ],
          }}
          contentClassName={
            showDedicatedSearchResults ? DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME : undefined
          }
        >
          {showDedicatedSearchResults ? (
            <ListPageTemplate
              defaultTabs={DEFAULT_TABS}
              tabs={SEARCH_LANDING_TABS}
              onTabsChange={ignoreLibraryTabsUpdate}
              activeTabId={SEARCH_LANDING_TABS[0]!.id}
              onActiveTabChange={ignoreLibraryTabActivation}
              hideViewsToolbar
              supportedViewTypes={LIBRARY_SUPPORTED_VIEWS}
              getTabCount={() => count}
              tablePropertiesRef={tableRef}
              header={(
                <DedicatedSearchResultsHeaderChrome>
                  <LibraryPageHeader
                    variant="default"
                    title={dedicatedSearchTitle}
                    questionCount={count}
                    hideNewQuestion
                    onNewQuestion={handleNewQuestion}
                    onExport={() => setExportOpen(true)}
                  />
                  <DedicatedSearchUrlComposer
                    searchParamsKey={searchParamsKey}
                    replacePath={dedicatedReplacePath}
                    patchSearchParams={patchLibraryDedicatedSearchParams}
                    onRecordSubmission={recordLibraryRecentSearch}
                    layout="default"
                    animatedPlaceholders={LIBRARY_DEDICATED_SEARCH_PLACEHOLDERS}
                    animatedPlaceholderIntervalMs={4800}
                    animatedPlaceholderMaxLines={2}
                    placeholder="Search the bank…"
                    inputLabel="AI search"
                    submitAppearance="search"
                    submitButtonAriaLabel="Run AI search"
                    srOnlyDescription={
                      <>
                        Type a plain-language request, then press Enter to filter the question list. This control
                        does not open Ask Leo.
                      </>
                    }
                  />
                  {hubTextHadNoMatches ? (
                    <p className="px-4 pb-3 text-sm text-muted-foreground lg:px-6">
                      No questions matched that wording for this scope — showing the list without that text filter.
                    </p>
                  ) : null}
                </DedicatedSearchResultsHeaderChrome>
              )}
              exportOpen={exportOpen}
              onExportOpenChange={setExportOpen}
              exportTotalRows={count}
              renderContent={(tab, updateTab) => (
                <LibraryTable
                  key={tab.id}
                  ref={tableRef}
                  items={items}
                  navState={navState}
                  urlListSearch={undefined}
                  landingFilters={landingFilters}
                  searchLanding
                  folders={folders}
                  onFoldersChange={setFolders}
                  onItemsChange={setItems}
                  view={tab.viewType}
                  onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
                  viewName={tab.label}
                  onViewNameChange={(name: string) => updateTab({ label: name })}
                  persistKey={librarySearchPersistKey}
                  persistTabId={tab.id}
                  showViewCounts={showViewCounts}
                  onShowViewCountsChange={setShowViewCounts}
                />
              )}
            />
          ) : (
            <DedicatedSearchLandingTemplate
              title={isHubFindSurface ? "Discovery search" : "Search your library"}
              composer={(
                <DedicatedSearchUrlComposer
                  searchParamsKey={searchParamsKey}
                  replacePath={dedicatedReplacePath}
                  patchSearchParams={patchLibraryDedicatedSearchParams}
                  onRecordSubmission={recordLibraryRecentSearch}
                  layout="hero"
                  animatedPlaceholders={LIBRARY_DEDICATED_SEARCH_PLACEHOLDERS}
                  animatedPlaceholderIntervalMs={4800}
                  animatedPlaceholderMaxLines={2}
                  placeholder="Search the bank…"
                  inputLabel="AI search"
                  submitAppearance="search"
                  submitButtonAriaLabel="Run AI search"
                  srOnlyDescription={
                    <>
                      Type a plain-language request, then press Enter to filter the question list. This control does
                      not open Ask Leo.
                    </>
                  }
                />
              )}
              trailing={(
                <DedicatedSearchRecents
                  recents={libraryDedicatedSearchRecents}
                  searchParamsKey={searchParamsKey}
                  replacePath={dedicatedReplacePath}
                  patchSearchParams={patchLibraryDedicatedSearchParams}
                />
              )}
            />
          )}
        </SecondaryPanelHubTemplate>
      </>
    )
  }

  return (
    <CollaborationAccessFlow
      initialCollaborators={LIBRARY_HEADER_COLLABORATORS}
      resourceLabel={hubHeader.title}
    >
      {({ collaborators, openInvite }) => (
        <>
          <SecondaryPanelHubTemplate
            bridges={(
              <>
                <LibraryFolderBridge
                  folders={folders}
                  onFoldersChange={setFolders}
                  items={items}
                  onItemsChange={setItems}
                />
                <LibraryAccessBridge openManageAccess={openInvite} />
              </>
            )}
            siteHeader={{
              title: hubHeader.title,
              breadcrumbs: hubHeader.breadcrumbs,
            }}
          >
            <ListPageTemplate
              defaultTabs={DEFAULT_TABS}
              tabs={tabs}
              onTabsChange={setTabs}
              activeTabId={activeTabId}
              onActiveTabChange={onActiveTabChange}
              supportedViewTypes={LIBRARY_SUPPORTED_VIEWS}
              getTabCount={() => count}
              tablePropertiesRef={tableRef}
              onRequestCreateView={handleRequestCreateView}
              showViewCounts={showViewCounts}
              onShowViewCountsChange={setShowViewCounts}
              header={(
                <LibraryPageHeader
                  variant="collaboration"
                  title={hubHeader.title}
                  questionCount={count}
                  collaborators={collaborators}
                  onNewQuestion={handleNewQuestion}
                  onExport={() => setExportOpen(true)}
                  onAddCollaborator={openInvite}
                  onCollaboratorsOpen={openInvite}
                  showMetrics={showMetrics}
                  onToggleMetrics={() => setShowMetrics(v => !v)}
                  onCustomizeFolder={
                    navState.scope === "folder" && navState.folderId ? openHubScopedFolderCustomize : undefined
                  }
                />
              )}
              metrics={(
                <KeyMetrics
                  variant="flat"
                  metrics={metrics}
                  insight={insight}
                  showHeader={false}
                  metricsSingleRow
                />
              )}
              showMetrics={showMetrics}
              exportOpen={exportOpen}
              onExportOpenChange={setExportOpen}
              exportTotalRows={count}
              renderContent={(tab, updateTab) => (
                <LibraryTable
                  key={tab.id}
                  ref={tableRef}
                  items={items}
                  navState={navState}
                  urlListSearch={urlToolbarSearchSync}
                  landingFilters={null}
                  searchLanding={false}
                  folders={folders}
                  onFoldersChange={setFolders}
                  onItemsChange={setItems}
                  view={tab.viewType}
                  onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
                  viewName={tab.label}
                  onViewNameChange={(name: string) => updateTab({ label: name })}
                  persistKey={libraryPersistKey}
                  persistTabId={tab.id}
                  showViewCounts={showViewCounts}
                  onShowViewCountsChange={setShowViewCounts}
                  bulkActions={libraryBulkActions}
                  creatingViewType={creatingViewType}
                  creatingViewName={creatingName}
                  onCreatingViewNameChange={setCreatingName}
                  onCancelCreation={handleCancelCreation}
                  onCommitCreation={handleCommitCreation}
                />
              )}
            />
          </SecondaryPanelHubTemplate>

          <LibraryNewFolderSheet
            open={hubFolderCustomizeSheetOpen}
            onOpenChange={open => {
              setHubFolderCustomizeSheetOpen(open)
              if (!open) setHubFolderCustomizeTarget(null)
            }}
            parentFolderId={hubFolderCustomizeTarget?.parentId ?? null}
            customizingFolder={hubFolderCustomizeTarget}
            descriptionText="Update how this folder appears in the bank. Name, color, and icon apply everywhere the folder is shown."
            onCreated={newFolder => {
              const target = hubFolderCustomizeTarget
              if (!target) return
              setFolders(prev =>
                prev.map(f =>
                  f.id === target.id
                    ? { ...f, name: newFolder.name, icon: newFolder.icon, colorKey: newFolder.colorKey }
                    : f,
                ),
              )
              setHubFolderCustomizeTarget(null)
            }}
          />
        </>
      )}
    </CollaborationAccessFlow>
  )
}
