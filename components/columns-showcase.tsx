"use client"

/**
 * ColumnsShowcase — a single `HubTable` exercising every cell pattern the
 * design system already ships. Lives at `/columns` under Resources.
 *
 * Hosted inside `columns-client.tsx` so the page client owns `ListPageTemplate`,
 * `PageHeader`, and `KeyMetrics`. `HubTable` (NOT raw `<DataTable>`) is the
 * canonical primitive for a hub view body — it wires `useTableState`, search,
 * filter chips, the filter dropdown, sort, the **Table properties** drawer,
 * bulk-actions, and conditional rules. Pages that drop down to raw `<DataTable>`
 * silently lose filters and Properties; do not do that.
 *
 * **All cell renderers come from `@/components/data-views`** (re-exported from
 * `components/data-views/table-cells.tsx`). This file is the **catalog page** —
 * if you need any of these cells in a real hub, **import them**, do not
 * re-implement. The token-economy skill (`.cursor/skills/exxat-token-economy/SKILL.md`
 * §3) lists each one by name so the AI imports directly.
 *
 * Rows are real `LibraryItem` mocks (so the favorite/star pattern lights
 * up out of the box), augmented with demo-only fields — `reviewStatus`,
 * `reviewers`, `attempts`, `progress`, `cost`, `rating`, `lastActivityAt`,
 * `sourceUrl`, `attachmentCount`, `published` — courtesy of the row type's
 * `Record<string, unknown>` extension.
 *
 * Patterns in column order (mirrors what Linear / Notion / Airtable / Asana /
 * Salesforce / Stripe / Jira / Monday all ship for grid surfaces):
 *
 *   1.  Row select          — explicit `key: "select"`, pinned-left, locked
 *   2.  Stem + ID + ⭐      — primary identity (QB favorite-button pattern)
 *   3.  Author identity     — avatar + name + mailto email (two-line cell)
 *   4.  Reviewers face rail — `PeopleAvatarRailCell` (+N more overflow)
 *   5.  Type pill w/ icon   — `PillCell` + leading FA icon
 *   6.  Difficulty signal   — `SignalBarsCell` (Wi-Fi-style ordinal)
 *   7.  Status (chip+icon)  — `ListHubStatusBadge` (color + icon, never alone)
 *   8.  Published toggle    — `BooleanToggleCell` (inline `ToggleSwitch`)
 *   9.  Tag list +N         — `TagListCell` (soft `Badge`s with overflow tip)
 *   10. Rating              — `RatingCell` (1–5 FA stars + value)
 *   11. Progress            — `ProgressCell` (track + filled bar + label)
 *   12. Cost                — `CurrencyCell` (right-aligned `tabular-nums`)
 *   13. Attempts            — `NumericCell` (right-aligned `tabular-nums`)
 *   14. Files               — `AttachmentCountCell` (paperclip + count)
 *   15. Source              — `ExternalLinkCell` (host + new-tab icon)
 *   16. Last activity       — `RelativeTimeCell` (+ absolute on hover)
 *   17. Updated             — absolute date (matches QB column)
 *   18. Row actions ⋯       — `RowActionsCell<LibraryItem>` (generic)
 */

import * as React from "react"
import {
  AttachmentCountCell,
  BooleanToggleCell,
  CurrencyCell,
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
  type RowActionDef,
} from "@/components/data-views"
import type { DataListViewType } from "@/lib/data-list-view"
import { FULL_HUB_SUPPORTED_VIEWS } from "@/lib/data-list-view-registry"
import type { CreatedViewSpec } from "@/components/data-views"
import { LibraryTable } from "@/components/library-table"
import { DEFAULT_LIBRARY_FOLDERS, type LibraryFolder } from "@/lib/mock/library-folders"
import { AvatarInitials } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  LibraryFavoriteButton,
  LIBRARY_FAVORITE_HOVER_GROUP,
} from "@/components/library-favorite-button"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  LIST_HUB_STATUS_TINT_DANGER,
  LIST_HUB_STATUS_TINT_INFO,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
} from "@/lib/list-status-badges"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { formatDateUS } from "@/lib/date-filter"
import { mailtoHref } from "@/lib/mailto"
import {
  LIBRARY_ITEMS,
  type LibraryItem,
  type LibraryItemType,
  type LibraryLevel,
} from "@/lib/mock/library"
import type { ColumnDef } from "@/components/data-table/types"

/* ── Demo-only row augmentation ────────────────────────────────────────── */

type ReviewStatus = "draft" | "in_review" | "approved" | "needs_update" | "archived"

const STATUS_LABEL: Record<ReviewStatus, string> = {
  draft:        "Draft",
  in_review:    "In review",
  approved:     "Approved",
  needs_update: "Needs update",
  archived:     "Archived",
}

const STATUS_TINT: Record<ReviewStatus, string> = {
  draft:        LIST_HUB_STATUS_TINT_NEUTRAL,
  in_review:    LIST_HUB_STATUS_TINT_INFO,
  approved:     LIST_HUB_STATUS_TINT_SUCCESS,
  needs_update: LIST_HUB_STATUS_TINT_WARNING,
  archived:     LIST_HUB_STATUS_TINT_DANGER,
}

const STATUS_ICON: Record<ReviewStatus, string> = {
  draft:        "fa-pen-to-square",
  in_review:    "fa-eye",
  approved:     "fa-circle-check",
  needs_update: "fa-triangle-exclamation",
  archived:     "fa-box-archive",
}

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Multiple choice",
  true_false:      "True / false",
  short_answer:    "Short answer",
}

const TYPE_ICON: Record<LibraryItemType, string> = {
  multiple_choice: "fa-list-check",
  true_false:      "fa-toggle-on",
  short_answer:    "fa-pen-line",
}

const DIFFICULTY_LEVEL: Record<LibraryLevel, number> = {
  easy: 1, medium: 2, hard: 3,
}

const DIFFICULTY_TONE: Record<LibraryLevel, "success" | "warning" | "danger"> = {
  easy: "success", medium: "warning", hard: "danger",
}

const REVIEWER_POOL: PersonStub[] = [
  { name: "Aisha Khan",      initials: "AK" },
  { name: "Marcus Patel",    initials: "MP" },
  { name: "Sofia Rinaldi",   initials: "SR" },
  { name: "Jamal Brooks",    initials: "JB" },
  { name: "Priya Iyer",      initials: "PI" },
  { name: "Diego Suarez",    initials: "DS" },
  { name: "Hannah Reed",     initials: "HR" },
  { name: "Mei Lin",         initials: "ML" },
]

const REVIEW_STATUSES: ReviewStatus[] = [
  "draft", "in_review", "approved", "needs_update", "approved", "in_review",
  "draft", "archived", "approved", "in_review", "needs_update", "approved",
]

const SOURCE_URLS: string[] = [
  "https://nlm.nih.gov/medlineplus",
  "https://merckmanuals.com/professional",
  "https://uptodate.com/contents/diabetes",
  "https://cdc.gov/asthma/clinical-care",
  "https://ada.org/resources/research",
  "https://heart.org/health-topics",
  "https://aap.org/en/practice-management",
  "https://nice.org.uk/guidance/ng17",
]

const PUBLISHED_BY_INDEX = [
  true, true, false, true, false, true, true, false, true, true, false, true,
]

/** Build the showcase dataset once. Keeps `LibraryItem` as the row type so
 *  `LibraryFavoriteButton` plugs in with zero adaptation. The demo
 *  augmentations exercise the long tail of SaaS-grid cell patterns. */
function buildRows(): LibraryItem[] {
  const NOW = Date.UTC(2026, 4, 21, 10, 30, 0)
  return LIBRARY_ITEMS.slice(0, 12).map((item, i) => {
    const lastActivityAt = new Date(
      NOW - i * 1000 * 60 * 60 * 17 - 1000 * 60 * 13,
    ).toISOString()
    return {
      ...item,
      reviewStatus:    REVIEW_STATUSES[i % REVIEW_STATUSES.length],
      reviewers:       REVIEWER_POOL.slice(i % 3, (i % 3) + 3 + (i % 3)),
      attempts:        27 + ((i * 11) % 96),
      isStarred:       i % 4 === 0,
      progress:        8 + ((i * 17) % 92),
      cost:            12 + ((i * 91) % 488) + ((i * 31) % 100) / 100,
      rating:          1 + ((i * 7) % 5),
      attachmentCount: i === 1 ? 0 : 1 + ((i * 5) % 7),
      sourceUrl:       SOURCE_URLS[i % SOURCE_URLS.length],
      lastActivityAt,
      published:       PUBLISHED_BY_INDEX[i % PUBLISHED_BY_INDEX.length],
    }
  })
}

/* ── Row actions definition ────────────────────────────────────────────── */

const ROW_ACTIONS: RowActionDef<LibraryItem>[] = [
  { label: "Open",      icon: "fa-arrow-up-right", onSelect: () => {} },
  { label: "Edit",      icon: "fa-pen-to-square",  onSelect: () => {} },
  { label: "Duplicate", icon: "fa-clone",          onSelect: () => {} },
  { label: "Archive",   icon: "fa-box-archive",    onSelect: () => {}, variant: "destructive" },
]

/* ── Column definitions ────────────────────────────────────────────────── */

function useColumns(
  onToggleFavorite:  (row: LibraryItem) => void,
  onTogglePublished: (row: LibraryItem) => void,
): ColumnDef<LibraryItem>[] {
  return React.useMemo<ColumnDef<LibraryItem>[]>(() => [
    // 1. Select — explicit checkbox column. DataTable renders the checkbox cell
    //    automatically; declaring it here makes it visible in the Properties
    //    drawer column list and pins it left.
    {
      key:        "select",
      label:      "",
      width:      40,
      minWidth:   40,
      defaultPin: "left",
      lockPin:    true,
    },
    // 2. Primary identity — name + mono ID + favorite star.
    {
      key: "stem",
      label: "Name",
      width: 320,
      minWidth: 220,
      defaultPin: "left",
      sortable: true,
      sortKey: "stem",
      cell: (row) => (
        <div className={cn(LIBRARY_FAVORITE_HOVER_GROUP, "flex min-w-0 items-start gap-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pe-1">
            <span className="line-clamp-2 text-sm font-medium text-foreground">{row.stem}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{row.questionId}</span>
          </div>
          <LibraryFavoriteButton row={row} onToggleFavorite={onToggleFavorite} />
        </div>
      ),
    },
    // 3. Person identity — avatar + name + email (two-line cell).
    {
      key: "author",
      label: "Owner",
      width: 260,
      minWidth: 200,
      sortable: true,
      sortKey: "author",
      filter:   { type: "text", icon: "fa-user", operators: ["contains", "not_contains"] },
      cell: (row) => {
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
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.authorEmail}
                </a>
              ) : null}
            </div>
          </div>
        )
      },
    },
    // 4. Face rail (+N overflow) — `PeopleAvatarRailCell`.
    {
      key: "reviewers",
      label: "Reviewers",
      width: 160,
      minWidth: 140,
      cell: (row) => (
        <PeopleAvatarRailCell people={row.reviewers as PersonStub[] | undefined} />
      ),
    },
    // 5. Single-select pill with icon — `PillCell`.
    {
      key: "type",
      label: "Type",
      width: 170,
      minWidth: 150,
      sortable: true,
      sortKey: "type",
      filter: {
        type: "select",
        icon: "fa-list-check",
        options: (Object.keys(TYPE_LABEL) as LibraryItemType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] })),
      },
      cell: (row) => <PillCell label={TYPE_LABEL[row.type]} icon={TYPE_ICON[row.type]} />,
    },
    // 6. Level signal — `SignalBarsCell` (Wi-Fi metaphor).
    {
      key: "difficulty",
      label: "Level",
      width: 100,
      minWidth: 90,
      sortable: true,
      sortKey: "difficulty",
      filter: {
        type: "select",
        icon: "fa-signal-bars",
        options: [
          { value: "easy",   label: "Low"    },
          { value: "medium", label: "Normal" },
          { value: "hard",   label: "High"   },
        ],
      },
      cell: (row) => (
        <SignalBarsCell
          level={DIFFICULTY_LEVEL[row.difficulty]}
          tone={DIFFICULTY_TONE[row.difficulty]}
          label={`Difficulty: ${row.difficulty}`}
        />
      ),
    },
    // 7. Status — chip + icon (color + glyph; never color alone).
    {
      key: "reviewStatus",
      label: "Status",
      width: 150,
      minWidth: 130,
      filter: {
        type: "select",
        icon: "fa-circle-check",
        options: (Object.keys(STATUS_LABEL) as ReviewStatus[]).map((k) => ({
          value: k,
          label: STATUS_LABEL[k],
          // Render the same chip in filter dropdowns + Properties drawer so
          // the picker is visually grounded — not a plain text list.
          node: (
            <ListHubStatusBadge
              label={STATUS_LABEL[k]}
              tintClassName={STATUS_TINT[k]}
              icon={STATUS_ICON[k]}
            />
          ),
        })),
      },
      cell: (row) => {
        const s = (row.reviewStatus as ReviewStatus | undefined) ?? "draft"
        return (
          <ListHubStatusBadge
            label={STATUS_LABEL[s]}
            tintClassName={STATUS_TINT[s]}
            icon={STATUS_ICON[s]}
          />
        )
      },
    },
    // 8. Inline toggle — `BooleanToggleCell` for a boolean lifecycle field.
    {
      key: "published",
      label: "Active",
      width: 110,
      minWidth: 100,
      cell: (row) => (
        <BooleanToggleCell
          checked={Boolean((row as Record<string, unknown>).published)}
          onChange={() => onTogglePublished(row)}
          labelOn="Active — click to disable"
          labelOff="Inactive — click to activate"
        />
      ),
    },
    // 9. Tag list +N — `TagListCell`.
    {
      key: "tags",
      label: "Tags",
      width: 180,
      minWidth: 140,
      cell: (row) => <TagListCell tags={row.tags} />,
    },
    // 10. Rating — `RatingCell` (5 stars + value).
    {
      key: "rating",
      label: "Rating",
      width: 130,
      minWidth: 110,
      sortable: true,
      sortKey: "rating",
      cell: (row) => <RatingCell value={(row.rating as number | undefined) ?? 0} />,
    },
    // 11. Progress — `ProgressCell` (track + filled + label).
    {
      key: "progress",
      label: "Progress",
      width: 180,
      minWidth: 150,
      sortable: true,
      sortKey: "progress",
      cell: (row) => <ProgressCell value={(row.progress as number | undefined) ?? 0} />,
    },
    // 12. Currency — `CurrencyCell` (right-aligned tabular-nums USD).
    {
      key: "cost",
      label: "Cost",
      width: 110,
      minWidth: 90,
      sortable: true,
      sortKey: "cost",
      cell: (row) => <CurrencyCell value={(row.cost as number | undefined) ?? 0} />,
    },
    // 13. Plain numeric — `NumericCell` (right-aligned).
    {
      key: "attempts",
      label: "Count",
      width: 100,
      minWidth: 80,
      sortable: true,
      sortKey: "attempts",
      cell: (row) => <NumericCell value={(row.attempts as number | undefined) ?? 0} />,
    },
    // 14. Attachment count — `AttachmentCountCell`.
    {
      key: "attachmentCount",
      label: "Files",
      width: 80,
      minWidth: 70,
      sortable: true,
      sortKey: "attachmentCount",
      cell: (row) => (
        <AttachmentCountCell count={(row.attachmentCount as number | undefined) ?? 0} />
      ),
    },
    // 15. External link — `ExternalLinkCell` (host + new-tab icon).
    {
      key: "sourceUrl",
      label: "Link",
      width: 200,
      minWidth: 160,
      cell: (row) => <ExternalLinkCell url={(row.sourceUrl as string | undefined) ?? ""} />,
    },
    // 16. Relative time + absolute on hover — `RelativeTimeCell`.
    {
      key: "lastActivityAt",
      label: "Last activity",
      width: 150,
      minWidth: 130,
      sortable: true,
      sortKey: "lastActivityAt",
      cell: (row) => (
        <RelativeTimeCell iso={(row.lastActivityAt as string | undefined) ?? ""} />
      ),
    },
    // 17. Absolute date.
    {
      key: "updatedAt",
      label: "Updated",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "updatedAt",
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground/90 whitespace-nowrap">
          {formatDateUS(row.updatedAt)}
        </span>
      ),
    },
    // 18. Row actions overflow — `RowActionsCell<LibraryItem>`.
    {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: (row) => (
        <div className="flex items-center justify-center">
          <RowActionsCell row={row} actions={ROW_ACTIONS} triggerLabel={`Actions for item ${row.questionId}`} />
        </div>
      ),
    },
  ], [onToggleFavorite, onTogglePublished])
}

/* ── Public ───────────────────────────────────────────────────────────── */

/** Column patterns showcased in this HubTable — surfaced as KPIs by the page client. */
export const COLUMNS_SHOWCASE_PATTERN_COUNT  = 18
export const COLUMNS_SHOWCASE_PINNED_COUNT   = 3  // select + name + actions
export const COLUMNS_SHOWCASE_SORTABLE_COUNT = 11 // name, owner, type, level, rating, progress, cost, count, files, lastActivityAt, updatedAt

/** Same seven views as Library / All questions (Add view + Properties). */
export const COLUMNS_SUPPORTED_VIEWS = FULL_HUB_SUPPORTED_VIEWS

export interface ColumnsShowcaseProps {
  /** Active view from `ListPageTemplate.renderContent`. */
  view: DataListViewType
  /** Tab update callback from `ListPageTemplate.renderContent`. */
  onViewChange: (v: DataListViewType) => void
  /**
   * Active view's display name + commit handler — forwarded to `LibraryTable` /
   * `HubTable` so the Properties drawer renders an editable Name input.
   * Bind to the active `ViewTab.label` + an `updateTab({ label })` callback.
   */
  viewName?: string
  onViewNameChange?: (name: string) => void
  /** Ref forwarded to the inner HubTable so the parent can read drawerToolbarProps. */
  tableRef?: React.Ref<import("@/components/data-views").HubTableHandle | null>
  /** Show record counts on each view tab — forwarded to Properties Display panel. */
  showViewCounts?: boolean
  onShowViewCountsChange?: (v: boolean) => void
  /** 2-step "Add view" creation flow — pass-through to inner `HubTable`. */
  creatingViewType?: DataListViewType | null
  creatingViewName?: string
  onCreatingViewNameChange?: (name: string) => void
  onCancelCreation?: () => void
  onCommitCreation?: (spec: CreatedViewSpec) => void
}

/**
 * The actual hub surface — wrapped by `columns-client.tsx` inside
 * `ListPageTemplate.renderContent`. No outer card chrome — keep this lean so
 * the host template owns header / KPIs / view tabs.
 */
export function ColumnsShowcase({
  view,
  onViewChange,
  viewName,
  onViewNameChange,
  tableRef,
  showViewCounts,
  onShowViewCountsChange,
  creatingViewType,
  creatingViewName,
  onCreatingViewNameChange,
  onCancelCreation,
  onCommitCreation,
}: ColumnsShowcaseProps) {
  const [rows, setRows] = React.useState<LibraryItem[]>(() => buildRows())
  const [folders, setFolders] = React.useState<LibraryFolder[]>(() =>
    DEFAULT_LIBRARY_FOLDERS.map(f => ({ ...f })),
  )
  const [pagination, setPagination] = React.useState(false)

  const toggleFavorite = React.useCallback((row: LibraryItem) => {
    setRows((current) =>
      current.map((r) => (r.id === row.id ? { ...r, isStarred: !r.isStarred } : r)),
    )
  }, [])

  const togglePublished = React.useCallback((row: LibraryItem) => {
    setRows((current) =>
      current.map((r) =>
        r.id === row.id
          ? { ...r, published: !(r as Record<string, unknown>).published }
          : r,
      ),
    )
  }, [])

  const columns = useColumns(toggleFavorite, togglePublished)

  return (
    <LibraryTable
      ref={tableRef}
      items={rows}
      onItemsChange={setRows}
      folders={folders}
      onFoldersChange={setFolders}
      view={view}
      onViewChange={onViewChange}
      viewName={viewName}
      onViewNameChange={onViewNameChange}
      columnDefs={columns}
      hubLabels={{
        hubLabel: "Column types",
        lifecycleTabLabel: "Column types",
        searchAriaLabel: "Search columns showcase",
        listAriaLabel: "Column types",
        defaultSort: { key: "stem", dir: "asc" },
      }}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationInitialPageSize={5}
      paginationPageSizeOptions={[5, 10, 25]}
      showBulkActions={false}
      showViewCounts={showViewCounts}
      onShowViewCountsChange={onShowViewCountsChange}
      creatingViewType={creatingViewType}
      creatingViewName={creatingViewName}
      onCreatingViewNameChange={onCreatingViewNameChange}
      onCancelCreation={onCancelCreation}
      onCommitCreation={onCommitCreation}
    />
  )
}
