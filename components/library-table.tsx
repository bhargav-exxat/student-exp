"use client"

/**
 * Library — thin wrapper around the centralized `<HubTable>`. Owns column defs,
 * folder/panel/tree-panel custom views, the new-folder + customize-folder sheet, and
 * forwards URL search via `HubTable.syncedSearchFromUrl`.
 *
 * Single dataset rule: `HubTable` runs one `useTableState(tableSourceItems, columns, …)`.
 * Every non-table renderer (list, board, folder, panel, tree-panel, dashboard) reads
 * `state.rows` — the same filtered/sorted/searched bag as the grid.
 */

import * as React from "react"
import { mailtoHref } from "@/lib/mailto"
import type { DataListViewType } from "@/lib/data-list-view"
import type { ColumnDef } from "@/components/data-table/types"
import {
  HubTable,
  type HubTableHandle,
  type HubTableRenderers,
  type BulkAction,
  type CreatedViewSpec,
} from "@/components/data-views"
import { Skeleton } from "@/components/ui/skeleton"
import { LIBRARY_SUPPORTED_VIEWS } from "@/lib/library-supported-views"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ListPageSplitHubChrome } from "@/components/data-views/list-page-split-hub-chrome"
import {
  LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS,
  LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS,
  LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS,
} from "@/components/data-views/list-page-split-hub-tokens"
import { ListPageTreeColumnHeader } from "@/components/data-views/list-page-tree-column-header"
import { LibraryBoardView, LIBRARY_BOARD_GROUP_OPTIONS } from "@/components/library-board-view"
import { ListPageBoardCard } from "@/components/data-views/list-page-board-card"
import {
  LibraryFavoriteButton,
  LIBRARY_FAVORITE_HOVER_GROUP,
} from "@/components/library-favorite-button"
import { LibraryOsFolderView } from "@/components/library-os-folder-view"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import { FolderDetailsShell } from "@/components/folder-details-shell"
import { HubTreePanelView } from "@/components/hub-tree-panel-view"
import { AvatarInitials } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDateUS } from "@/lib/date-filter"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import {
  newLibraryQuestionId,
  type LibraryLevel,
  type LibraryItem,
  type LibraryItemType,
} from "@/lib/mock/library"
import {
  type LibraryFolder,
  LIBRARY_FOLDER_COLOR_STYLES,
  LIBRARY_FOLDER_ICON_COLORS,
} from "@/lib/mock/library-folders"
import {
  toggleLibraryItemFavorite,
  applyLibraryHubDisplayFilters,
  type LibraryLandingFilterState,
  type LibraryNavState,
} from "@/lib/library-nav"

// ─── Dynamic dashboard charts section ────────────────────────────────────────

const LibraryDashboardChartsSectionLazy = React.lazy(() =>
  import("@/components/library-dashboard-charts").then(mod => ({
    default: mod.LibraryDashboardChartsSection,
  })),
)

function LibraryDashboardChartsSectionFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function LibraryDashboardChartsSection(
  props: React.ComponentProps<typeof LibraryDashboardChartsSectionLazy>,
) {
  return (
    <React.Suspense fallback={<LibraryDashboardChartsSectionFallback />}>
      <LibraryDashboardChartsSectionLazy {...props} />
    </React.Suspense>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Type 1",
  true_false: "Type 2",
  short_answer: "Type 3",
}

const DIFFICULTY_LABEL: Record<LibraryLevel, string> = {
  easy: "Low",
  medium: "Normal",
  hard: "High",
}

const TYPE_FILTER_OPTS = (Object.keys(TYPE_LABEL) as LibraryItemType[]).map(k => ({
  value: k,
  label: TYPE_LABEL[k],
}))

const DIFFICULTY_FILTER_OPTS = (Object.keys(DIFFICULTY_LABEL) as LibraryLevel[]).map(k => ({
  value: k,
  label: DIFFICULTY_LABEL[k],
}))

function newLibraryItemId() {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function defaultFolderIdForColumnParent(parentId: string | null, folders: LibraryFolder[]): string | null {
  if (parentId !== null) return parentId
  const roots = [...folders].filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name))
  return roots[0]?.id ?? null
}

function uniqueTopics(items: LibraryItem[]) {
  return [...new Set(items.map(i => i.topic))].sort().map(t => ({ value: t, label: t }))
}

function buildLibraryColumns(
  items: LibraryItem[],
  opts: { onToggleFavorite: (row: LibraryItem) => void },
): ColumnDef<LibraryItem>[] {
  const topicOpts = uniqueTopics(items)
  const { onToggleFavorite } = opts
  return [
    { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true },
    {
      key: "stem",
      label: "Question",
      width: 300,
      minWidth: 160,
      sortable: true,
      sortKey: "stem",
      defaultPin: "left",
      filter: { type: "text", icon: "fa-file-lines", operators: ["contains", "not_contains"] },
      cell: row => (
        <div className={cn(LIBRARY_FAVORITE_HOVER_GROUP, "flex min-w-0 items-start gap-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pe-1">
            <span className="line-clamp-2 text-sm font-medium text-foreground">{row.stem}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.questionId}</span>
          </div>
          <LibraryFavoriteButton row={row} onToggleFavorite={onToggleFavorite} />
        </div>
      ),
    },
    {
      key: "topic",
      label: "Topic",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "topic",
      filter: { type: "select", icon: "fa-layer-group", operators: ["is", "is_not"], options: topicOpts },
      cell: row => <span className="text-sm text-foreground/90">{row.topic}</span>,
    },
    {
      key: "type",
      label: "Type",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "type",
      filter: { type: "select", icon: "fa-list-check", operators: ["is", "is_not"], options: TYPE_FILTER_OPTS },
      cell: row => <span className="text-sm text-foreground/90">{TYPE_LABEL[row.type]}</span>,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      width: 110,
      minWidth: 96,
      sortable: true,
      sortKey: "difficulty",
      filter: { type: "select", icon: "fa-signal", operators: ["is", "is_not"], options: DIFFICULTY_FILTER_OPTS },
      cell: row => <span className="text-sm text-foreground/90">{DIFFICULTY_LABEL[row.difficulty]}</span>,
    },
    {
      key: "updatedAt",
      label: "Updated",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "updatedAt",
      filter: { type: "date", icon: "fa-calendar-days", operators: ["is", "is_not"] },
      cell: row => (
        <span className="text-sm tabular-nums text-foreground/90 whitespace-nowrap">{formatDateUS(row.updatedAt)}</span>
      ),
    },
    {
      key: "author",
      label: "Author",
      width: 260,
      minWidth: 200,
      sortable: true,
      sortKey: "author",
      filter: { type: "text", icon: "fa-user", operators: ["contains", "not_contains"] },
      cell: row => {
        const initials = initialsFromDisplayName(row.author)
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <AvatarInitials initials={initials} className="size-8 shrink-0 text-xs" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{row.author}</span>
              {row.authorEmail ? (
                <a
                  href={mailtoHref(row.authorEmail)}
                  className="truncate text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {row.authorEmail}
                </a>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: row => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={`Actions for question ${row.id}`}>
                <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <i className="fa-light fa-eye" aria-hidden="true" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <i className="fa-light fa-pen" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

// ─── Folder columns panel (custom multi-column miller view) ─────────────────

interface HubFolderColumnsPanelProps {
  folders: LibraryFolder[]
  rows: LibraryItem[]
  panelRenderDetail: (row: LibraryItem) => React.ReactNode
  onAddFolder: (parentId: string | null) => void
  onAddQuestion: (parentId: string | null) => void
  onCustomizeFolder?: (folder: LibraryFolder) => void
}

type HierarchyItem = LibraryFolder | LibraryItem

function isFolder(item: HierarchyItem): item is LibraryFolder {
  return "parentId" in item
}

function isQuestion(item: HierarchyItem): item is LibraryItem {
  return "stem" in item
}

function HubFolderColumnsPanel({
  folders,
  rows,
  panelRenderDetail,
  onAddFolder,
  onAddQuestion,
  onCustomizeFolder,
}: HubFolderColumnsPanelProps) {
  const [selectedPath, setSelectedPath] = React.useState<HierarchyItem[]>(() => {
    const rootFolders = folders
      .filter(f => f.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name))
    if (rootFolders.length > 0) return [rootFolders[0]]
    return []
  })

  const isFirstRenderRef = React.useRef(true)

  const rootFolders = React.useMemo(
    () => folders.filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const handleSelect = (item: HierarchyItem, depth: number) => {
    setSelectedPath(prev => [...prev.slice(0, depth), item])
  }

  React.useEffect(() => {
    if (isFirstRenderRef.current && selectedPath.length > 0) {
      const lastItem = selectedPath[selectedPath.length - 1]
      if (isFolder(lastItem)) {
        const folder = lastItem as LibraryFolder
        const subfolders = folders.filter(f => f.parentId === folder.id).sort((a, b) => a.name.localeCompare(b.name))
        const questionsInFolder = rows.filter(r => r.folderId === folder.id)
        const items: HierarchyItem[] = [...subfolders, ...questionsInFolder]
        if (items.length > 0 && !selectedPath[selectedPath.length + 1]) {
          setSelectedPath(prev => [...prev, items[0]])
          isFirstRenderRef.current = false
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns: Array<{ items: HierarchyItem[]; depth: number; parentId?: string | null }> = React.useMemo(() => {
    const cols: Array<{ items: HierarchyItem[]; depth: number; parentId?: string | null }> = [
      { items: rootFolders, depth: 0, parentId: null },
    ]
    for (let i = 0; i < selectedPath.length; i++) {
      const item = selectedPath[i]
      if (isFolder(item)) {
        const subfolders = folders.filter(f => f.parentId === item.id).sort((a, b) => a.name.localeCompare(b.name))
        const questionsInFolder = rows.filter(r => r.folderId === item.id)
        const items: HierarchyItem[] = [...subfolders, ...questionsInFolder]
        if (items.length > 0) cols.push({ items, depth: i + 1, parentId: item.id })
      }
    }
    return cols
  }, [selectedPath, rootFolders, folders, rows])

  const selectedLeaf = selectedPath.length > 0 ? selectedPath.at(-1)! : null
  const selectedQuestion = selectedLeaf && isQuestion(selectedLeaf) ? (selectedLeaf as LibraryItem) : null
  const selectedFolderLeaf = selectedLeaf && isFolder(selectedLeaf) ? (selectedLeaf as LibraryFolder) : null

  return (
    <ResizablePanelGroup direction="horizontal" className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      {columns.map(({ items, depth, parentId }, columnIdx) => (
        <React.Fragment key={`col-${depth}`}>
          {columnIdx > 0 && <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />}
          <ResizablePanel
            id={`col-${depth}`}
            defaultSize={columnIdx === 0 ? 35 : columnIdx === 1 ? 35 : 30}
            minSize={15}
            className={LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS}
          >
            <ListPageTreeColumnHeader
              title={
                depth === 0
                  ? "Categories"
                  : selectedPath[depth - 1] && isFolder(selectedPath[depth - 1])
                    ? (selectedPath[depth - 1] as LibraryFolder).name
                    : "Items"
              }
              trailing={
                <>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{items.length}</span>
                  {depth < columns.length - 1 && items.length > 0 ? (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onAddFolder(parentId ?? null)}
                            aria-label="Add folder"
                          >
                            <i className="fa-light fa-folder-plus text-xs" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          Add folder
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onAddQuestion(parentId ?? null)}
                            aria-label="Add question"
                          >
                            <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          Add question
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : null}
                </>
              }
            />
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {items.map(item => {
                const isSelected = selectedPath[depth]?.id === item.id
                const isFolder_ = isFolder(item)
                const folder = isFolder_ ? item : null
                const question = isQuestion(item) ? item : null
                const subfolderCount = isFolder_ ? folders.filter(f => f.parentId === item.id).length : 0
                const questionCount = isFolder_ ? rows.filter(r => r.folderId === item.id).length : 0
                const itemCount = subfolderCount + questionCount
                return (
                  <div key={item.id} className="group flex items-center hover:bg-muted/50">
                    <button
                      onClick={() => handleSelect(item, depth)}
                      className={cn(
                        "flex flex-1 items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-75",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        isSelected ? "bg-accent text-accent-foreground" : "text-foreground",
                        isFolder_ && !isSelected && folder?.colorKey && depth > 0
                          ? LIBRARY_FOLDER_COLOR_STYLES[folder.colorKey]?.tile
                          : "",
                      )}
                      aria-selected={isSelected}
                      role="option"
                    >
                      {isFolder_ ? (
                        <i
                          className={cn(
                            "fa-folder text-sm shrink-0",
                            isSelected ? "fa-solid" : "fa-light",
                            folder?.colorKey && LIBRARY_FOLDER_ICON_COLORS[folder.colorKey],
                          )}
                          aria-hidden="true"
                        />
                      ) : (
                        <i className={cn("fa-file text-sm shrink-0", isSelected ? "fa-solid" : "fa-light")} aria-hidden="true" />
                      )}
                      <span className={cn("min-w-0 flex-1 truncate leading-tight", isSelected && "font-medium")}>
                        {isFolder_ ? folder?.name : question?.stem}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums text-xs ms-auto",
                          isSelected ? "text-accent-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {isFolder_
                          ? itemCount
                          : question?.type === "multiple_choice"
                            ? "T1"
                            : question?.difficulty?.charAt(0).toUpperCase()}
                      </span>
                    </button>
                    {isFolder_ && folder && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Actions for folder ${folder.name}`}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onCustomizeFolder?.(folder)}>
                            <i className="fa-light fa-wand-magic-sparkles text-xs" aria-hidden="true" />
                            Customize
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          </ResizablePanel>
        </React.Fragment>
      ))}
      {(selectedQuestion || selectedFolderLeaf) && (
        <>
          <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />
          <ResizablePanel id="col-detail" defaultSize={30} minSize={20} className={LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS}>
            {selectedQuestion ? (
              <>
                <ListPageTreeColumnHeader title="Details" className="px-4" />
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {panelRenderDetail(selectedQuestion)}
                </div>
              </>
            ) : selectedFolderLeaf ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <FolderDetailsShell folder={selectedFolderLeaf} folders={folders} questions={rows} />
              </div>
            ) : null}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

// ─── Detail renderer reused by panel + tree-panel ───────────────────────────

function libraryPanelDetail(row: LibraryItem) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Question</h3>
        <p className="text-sm text-foreground">{row.stem}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{row.questionId}</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <span className="text-sm text-foreground">{TYPE_LABEL[row.type]}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Difficulty</span>
          <span className="text-sm text-foreground">{DIFFICULTY_LABEL[row.difficulty]}</span>
        </div>
      </div>
      {row.topic && (
        <div>
          <span className="text-xs font-medium text-muted-foreground">Topic</span>
          <p className="text-sm text-foreground mt-1">{row.topic}</p>
        </div>
      )}
      {row.type === "multiple_choice" && row.options && row.options.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">Options</span>
          <div className="flex flex-col gap-2">
            {row.options.map((option, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground mt-0.5 shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className={cn("text-sm", option.isCorrect ? "text-foreground font-medium" : "text-foreground/80")}>
                  {option.text}
                </span>
                {option.isCorrect && (
                  <i className="fa-light fa-check text-emerald-600 text-sm ms-auto shrink-0" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Public component ───────────────────────────────────────────────────────

export type LibraryTableHandle = HubTableHandle

export interface LibraryTableHubLabels {
  hubLabel: string
  lifecycleTabLabel: string
  searchAriaLabel: string
  listAriaLabel?: string
  defaultSort?: { key: string; dir: "asc" | "desc" }
}

export interface LibraryTableProps {
  items: LibraryItem[]
  /** When set, table / board / tree rows are limited to this nav scope (secondary sidebar). */
  navState?: LibraryNavState
  /** URL toolbar search binding (`?q=`) — omit on search landing so hub `q` does not pre-fill the grid search. */
  urlListSearch?: string
  /** When true, dedicated search shell: hub landing row filters; table toolbar search stays independent of URL `q`. */
  searchLanding?: boolean
  /** Applied with nav filters before `useTableState` when {@link searchLanding} is true. */
  landingFilters?: LibraryLandingFilterState | null
  view?: DataListViewType
  onViewChange?: (v: DataListViewType) => void
  /**
   * Active view's display name + commit handler — forwarded to `HubTable` so
   * the Properties drawer renders an editable Name input on its main panel.
   * Bind to the active `ViewTab.label` + an `updateTab({ label })` callback.
   */
  viewName?: string
  onViewNameChange?: (name: string) => void
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
  onItemsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
  /** e.g. Column types showcase — custom `ColumnDef`s while reusing list/board/folder renderers. */
  columnDefs?: ColumnDef<LibraryItem>[]
  /** Override default Library copy when {@link columnDefs} is set. */
  hubLabels?: LibraryTableHubLabels
  pagination?: boolean
  onPaginationChange?: (v: boolean) => void
  paginationInitialPageSize?: number
  paginationPageSizeOptions?: number[]
  showBulkActions?: boolean
  /**
   * Structured bulk-action definitions (Polaris IndexTable parity). When set,
   * each entry renders as a button inside the floating bulk-action bar and
   * receives the selected `LibraryItem` rows on click. Wins over the legacy
   * single-button slot when both are configured.
   */
  bulkActions?: BulkAction<LibraryItem>[]
  showViewCounts?: boolean
  onShowViewCountsChange?: (v: boolean) => void
  /** Forwarded to `<HubTable>`. Distinct keys per consumer so library + columns demo don't overwrite each other. */
  persistKey?: string
  persistTabId?: string

  // ─── 2-step "Add view" creation flow (pass-through to HubTable) ─────────
  /** When non-null, opens the creation drawer wired to an ephemeral state buffer. */
  creatingViewType?: DataListViewType | null
  /** Controlled new-view name input. Required when `creatingViewType` is non-null. */
  creatingViewName?: string
  onCreatingViewNameChange?: (name: string) => void
  /** Fired when the user dismisses the creation drawer (Cancel / Esc). */
  onCancelCreation?: () => void
  /** Fired when the user commits the creation drawer. Receives a typed spec. */
  onCommitCreation?: (spec: CreatedViewSpec) => void
}

export const LibraryTable = React.forwardRef<LibraryTableHandle, LibraryTableProps>(
  function LibraryTable(
    {
      items,
      navState,
      urlListSearch,
      searchLanding,
      landingFilters,
      view = "table",
      onViewChange,
      viewName,
      onViewNameChange,
      folders,
      onFoldersChange,
      onItemsChange,
      columnDefs,
      hubLabels,
      pagination,
      onPaginationChange,
      paginationInitialPageSize,
      paginationPageSizeOptions,
      showBulkActions = true,
      bulkActions,
      showViewCounts,
      onShowViewCountsChange,
      persistKey,
      persistTabId,
      creatingViewType,
      creatingViewName,
      onCreatingViewNameChange,
      onCancelCreation,
      onCommitCreation,
    },
    ref,
  ) {
    const tableSourceItems = React.useMemo(() => {
      const nav = navState ?? { scope: "all" as const, folderId: null }
      const landing = searchLanding ? (landingFilters ?? null) : null
      return applyLibraryHubDisplayFilters(items, folders, nav, landing)
    }, [items, folders, navState, searchLanding, landingFilters])

    const toggleFavorite = React.useCallback(
      (row: LibraryItem) => {
        onItemsChange(prev => prev.map(r => (r.id === row.id ? toggleLibraryItemFavorite(r) : r)))
      },
      [onItemsChange],
    )

    const columns = React.useMemo(
      () =>
        columnDefs ??
        buildLibraryColumns(tableSourceItems, { onToggleFavorite: toggleFavorite }),
      [columnDefs, tableSourceItems, toggleFavorite],
    )

    const hubLabel = hubLabels?.hubLabel ?? "Library"
    const lifecycleTabLabel = hubLabels?.lifecycleTabLabel ?? "Library"
    const searchAriaLabel = hubLabels?.searchAriaLabel ?? "Search questions"
    const listAriaLabel = hubLabels?.listAriaLabel ?? "Questions"
    const defaultSort = hubLabels?.defaultSort ?? { key: "updatedAt", dir: "desc" as const }

    // ─ New-folder / customize-folder modal state (shared by panel + tree-panel) ────
    const [newFolderOpen, setNewFolderOpen] = React.useState(false)
    const [newFolderParentId, setNewFolderParentId] = React.useState<string | null>(null)
    const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)

    const openNewFolderForColumn = React.useCallback((parentId: string | null) => {
      setNewFolderParentId(parentId)
      setCustomizingFolder(null)
      setNewFolderOpen(true)
    }, [])

    const openCustomizeFolderSheet = React.useCallback((folder: LibraryFolder) => {
      setCustomizingFolder(folder)
      setNewFolderOpen(true)
    }, [])

    const addQuestionInColumn = React.useCallback(
      (parentId: string | null) => {
        const folderId = defaultFolderIdForColumnParent(parentId, folders)
        if (!folderId) return
        const today = new Date()
        const y = today.getFullYear()
        const m = String(today.getMonth() + 1).padStart(2, "0")
        const d = String(today.getDate()).padStart(2, "0")
        onItemsChange(prev => [
          ...prev,
          {
            id: newLibraryItemId(),
            questionId: newLibraryQuestionId(),
            stem: "New question",
            topic: "General",
            type: "short_answer",
            difficulty: "medium",
            author: "Demo user",
            authorEmail: "demo.user@demo.exxat.io",
            updatedAt: `${y}-${m}-${d}`,
            folderId,
          },
        ])
      },
      [folders, onItemsChange],
    )

    const renderFilterOptionValue = React.useCallback(
      (fieldKey: string, value: string): React.ReactNode => {
        const col = columns.find(c => c.key === fieldKey)
        const opt = col?.filter?.options?.find(o => o.value === value)
        // Per-option `node` lets a column author colocate the chip / swatch
        // markup with the column definition (see `columns-showcase.tsx`
        // → reviewStatus). Plain text is the default fallback.
        if (opt?.node) return opt.node
        return <span className="text-foreground">{opt?.label ?? value}</span>
      },
      [columns],
    )

    // ─ Renderers ──────────────────────────────────────────────────────────────
    const renderers: HubTableRenderers<LibraryItem> = {
      "board-with-toolbar": ({ state, toolbarShell, displayOptions }) => {
        const boardGroupKey = LIBRARY_BOARD_GROUP_OPTIONS.some(
          o => o.key === displayOptions.boardGroupByColumnKey,
        )
          ? displayOptions.boardGroupByColumnKey
          : "topic"
        return toolbarShell(
          <LibraryBoardView
            rows={state.rows as LibraryItem[]}
            groupByColumnKey={boardGroupKey}
            onToggleFavorite={toggleFavorite}
            onRowActivate={row => state.toggleRow(row.id)}
          />,
        )
      },
      "folder-with-toolbar": ({ state, toolbarShell }) =>
        toolbarShell(
          <LibraryOsFolderView
            folders={folders}
            onFoldersChange={onFoldersChange}
            questions={state.rows as LibraryItem[]}
            onQuestionsChange={onItemsChange}
          />,
        ),
      "panel-with-toolbar": ({ state, toolbarShell }) =>
        toolbarShell(
          <ListPageSplitHubChrome aria-label="Library folder columns">
            <HubFolderColumnsPanel
              folders={folders}
              rows={state.rows as LibraryItem[]}
              panelRenderDetail={libraryPanelDetail}
              onAddFolder={openNewFolderForColumn}
              onAddQuestion={addQuestionInColumn}
              onCustomizeFolder={openCustomizeFolderSheet}
            />
          </ListPageSplitHubChrome>,
        ),
      "tree-panel-with-toolbar": ({ state, toolbarShell }) =>
        toolbarShell(
          <div className="flex min-h-0 flex-1 flex-col">
            <HubTreePanelView
              items={state.rows as LibraryItem[]}
              folders={folders}
              onItemsChange={onItemsChange}
              onFoldersChange={onFoldersChange}
            />
          </div>,
        ),
      "dashboard-with-toolbar": ({ state, toolbar }) => (
        <div className="flex min-h-0 flex-1 flex-col">
          {toolbar}
          <LibraryDashboardChartsSection rows={state.rows as LibraryItem[]} />
        </div>
      ),
    }

    return (
      <>
        <HubTable<LibraryItem>
          rows={tableSourceItems}
          columns={columns}
          view={view}
          onViewChange={onViewChange}
          viewName={viewName}
          onViewNameChange={onViewNameChange}
          supportedViewTypes={LIBRARY_SUPPORTED_VIEWS}
          hubLabel={hubLabel}
          lifecycleTabLabel={lifecycleTabLabel}
          searchAriaLabel={searchAriaLabel}
          showViewCounts={showViewCounts}
          onShowViewCountsChange={onShowViewCountsChange}
          {...(persistKey ? { persistKey } : {})}
          {...(persistTabId ? { persistTabId } : {})}
          getRowId={row => row.id}
          getRowSelectionLabel={row => row.stem}
          defaultSort={defaultSort}
          emptyState={<p className="text-sm text-muted-foreground">No questions in the bank.</p>}
          boardGroupByColumnOptions={[...LIBRARY_BOARD_GROUP_OPTIONS]}
          renderFilterOptionValue={renderFilterOptionValue}
          syncedSearchFromUrl={searchLanding ? undefined : urlListSearch}
          listAriaLabel={listAriaLabel}
          listEmptyState="No questions match your filters."
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          paginationInitialPageSize={paginationInitialPageSize}
          paginationPageSizeOptions={paginationPageSizeOptions}
          renderListRow={row => (
            <ListPageBoardCard
              className={LIBRARY_FAVORITE_HOVER_GROUP}
              layout="row"
              rowContainerClassName="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
              rowEnd={
                <div className="flex shrink-0 items-center gap-1">
                  <LibraryFavoriteButton row={row} onToggleFavorite={toggleFavorite} />
                  <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
                </div>
              }
            >
              <div className="space-y-0.5">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{row.stem}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.questionId}</p>
                <p className="text-xs text-muted-foreground">
                  {row.topic} · Updated {formatDateUS(row.updatedAt)}
                </p>
                <p className="text-xs text-muted-foreground">{row.author}</p>
              </div>
            </ListPageBoardCard>
          )}
          bulkActions={showBulkActions ? bulkActions : undefined}
          bulkActionsSlot={
            showBulkActions && !bulkActions
              ? selected => {
                  if (selected.size === 0) return null
                  return (
                    <>
                      <span className="sr-only">{selected.size} selected</span>
                      <Tip label="Export selection (demo)">
                        <Button size="sm" variant="outline" type="button">
                          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                          Export
                        </Button>
                      </Tip>
                    </>
                  )
                }
              : undefined
          }
          renderers={renderers}
          handleRef={ref}
          creatingViewType={creatingViewType}
          creatingViewName={creatingViewName}
          onCreatingViewNameChange={onCreatingViewNameChange}
          onCancelCreation={onCancelCreation}
          onCommitCreation={onCommitCreation}
        />
        <LibraryNewFolderSheet
          open={newFolderOpen}
          onOpenChange={setNewFolderOpen}
          parentFolderId={customizingFolder?.parentId ?? newFolderParentId}
          customizingFolder={customizingFolder}
          onCreated={(newFolder) => {
            if (customizingFolder) {
              onFoldersChange(prev =>
                prev.map(f =>
                  f.id === customizingFolder.id
                    ? { ...f, name: newFolder.name, icon: newFolder.icon, colorKey: newFolder.colorKey }
                    : f,
                ),
              )
              setCustomizingFolder(null)
            } else {
              onFoldersChange(prev => [
                ...prev,
                {
                  id: `fld-${Date.now()}`,
                  name: newFolder.name,
                  icon: newFolder.icon,
                  colorKey: newFolder.colorKey,
                  parentId: newFolder.parentId,
                },
              ])
            }
            setNewFolderOpen(false)
          }}
        />
      </>
    )
  },
)

LibraryTable.displayName = "LibraryTable"
