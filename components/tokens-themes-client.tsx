"use client"

/**
 * Tokens & themes — hub client.
 *
 * Composition mirrors `Library → Library` and matches every other
 * primary hub (Placements / Team / Sites / Compliance):
 *   - **Secondary panel** (`tokens`) — category scope lives in the rail
 *     (Colors, Radius, Motion, …) via `TokensSecondaryNav`. Opening the panel
 *     also collapses the main sidebar via `secondary-panel.tsx#openPanel`.
 *   - `PrimaryPageTemplate` + `ListPageTemplate` — same hub frame as
 *     Placements / Library.
 *   - **`HubTable`** (NOT raw `<DataTable>`) — the canonical primitive that
 *     wires `useTableState`, the toolbar (search + filter chips + filter
 *     dropdown + sort), `TablePropertiesDrawerButton`, view-type tiles,
 *     bulk-actions, and conditional rules. Hubs that drop down to raw
 *     `<DataTable>` silently lose filters and Properties; do not do that.
 *   - One view tab (`viewType: "table"`) — category scope is the panel's
 *     job, not the view tabs'.
 *
 * Token index (`packages/ui/tokens/hooks-index.json`) is the single source of
 * truth; visualizers live in `tokens-themes-section.tsx`.
 */

import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { useProduct } from "@/contexts/product-context"
import { productPersistKey } from "@/stores/app-store"
import {
  KeyMetrics,
  type MetricInsight,
  type MetricItem,
} from "@/components/key-metrics"
import {
  HubTable,
  ListPageBoardCard,
  ListPageTemplate,
  type ViewTab,
} from "@/components/data-views"
import type { ListPageBoardColumnDef } from "@/components/data-views/list-page-board-template"
import type { ColumnDef } from "@/components/data-table/types"
import { FULL_HUB_SUPPORTED_VIEWS } from "@/lib/data-list-view-registry"
import {
  buildTokensHubRenderers,
  renderTokenListRow,
  type TokenHubRow,
} from "@/components/tokens-hub-auxiliary-views"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { Badge } from "@/components/ui/badge"
import {
  CATEGORY_COUNTS,
  CATEGORY_TABS,
  DEPRECATED_COUNT,
  TOKENS_INDEX,
  categoryPreview,
  primaryValueText,
  type TokenCategory,
} from "@/components/tokens-themes-section"
import {
  readTokensCategory,
  TOKENS_ALL_CATEGORY,
  type TokensCategoryParam,
} from "@/components/tokens-themes-section"

/** Row shape consumed by `DataTable` — flat fields make built-in search work out of the box. */
type TokenRow = TokenHubRow & { category: TokenCategory | string }

/** Build all token rows once at module load (token index is static at runtime). */
const TOKEN_ROWS: TokenRow[] = (() => {
  const out: TokenRow[] = []
  for (const [name, record] of Object.entries(TOKENS_INDEX.tokens)) {
    out.push({
      id: name,
      name,
      namespace: record.namespace,
      category: record.category,
      value: primaryValueText(record),
      deprecated: Boolean(record.deprecated),
      record,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
})()

/** Pre-bucket rows by category so each panel selection slices in O(1). */
const ROWS_BY_CATEGORY = (() => {
  const map = new Map<TokensCategoryParam, TokenRow[]>()
  map.set(TOKENS_ALL_CATEGORY, TOKEN_ROWS)
  for (const tab of CATEGORY_TABS) {
    map.set(
      tab.id as TokensCategoryParam,
      TOKEN_ROWS.filter((r) => tab.matches(String(r.category))),
    )
  }
  return map
})()

/** Namespace select-filter options — built once from the index. */
const NAMESPACE_OPTIONS = TOKENS_INDEX.namespaces
  .slice()
  .sort()
  .map((ns) => ({ value: ns, label: ns }))

const STATUS_OPTIONS = [
  { value: "active",     label: "Active" },
  { value: "deprecated", label: "Deprecated" },
]

const TOKENS_HEADER_SUBTITLE = `${TOKENS_INDEX.tokenCount} tokens · ${TOKENS_INDEX.namespaces.length} namespaces · v${TOKENS_INDEX.version}`

const TOKENS_VIEW_TABS: ViewTab[] = [
  {
    id: "tokens-table",
    label: "Tokens",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

/** Same seven views as Library / Column types — each has a renderer on `HubTable` below. */
const TOKENS_SUPPORTED_VIEWS = FULL_HUB_SUPPORTED_VIEWS

/**
 * Canonical KPI shape (matches `placement-kpi.ts` precedent):
 *   - every `MetricItem` is clickable — tiles drive the secondary-panel
 *     category by pushing `?category=…`, the same URL the panel rail uses,
 *   - a `MetricInsight` summarizes the current scope on the right.
 * See `apps/web/docs/kpi-flat-band-pattern.md` + `exxat-kpi-trends.mdc`.
 */
function buildMetrics(
  navigate: (category: TokensCategoryParam) => void,
): MetricItem[] {
  return [
    {
      id: "total",
      label: "Total tokens",
      value: TOKENS_INDEX.tokenCount,
      delta: "",
      trend: "neutral",
      trendPolarity: "informational",
      metricVariant: "hero",
      description: `${TOKENS_INDEX.namespaces.length} namespaces`,
      onClick: () => navigate(TOKENS_ALL_CATEGORY),
    },
    {
      id: "color",
      label: "Color tokens",
      value: CATEGORY_COUNTS.color ?? 0,
      delta: "",
      trend: "neutral",
      trendPolarity: "informational",
      description: "semantic + alias",
      onClick: () => navigate("color" as TokensCategoryParam),
    },
    {
      id: "motion",
      label: "Motion tokens",
      value: CATEGORY_COUNTS.transition ?? 0,
      delta: "",
      trend: "neutral",
      trendPolarity: "informational",
      description: "easings + durations",
      onClick: () => navigate("motion" as TokensCategoryParam),
    },
    {
      id: "deprecated",
      label: "Deprecated",
      value: DEPRECATED_COUNT,
      delta: "",
      trend: "neutral",
      trendPolarity: "lower_is_better",
      description:
        DEPRECATED_COUNT > 0
          ? "scheduled for removal"
          : "none scheduled for removal",
      onClick: () => navigate("deprecated" as TokensCategoryParam),
    },
  ]
}

function buildInsight(activeCategory: TokensCategoryParam, rowCount: number): MetricInsight {
  const label = categoryDisplayLabel(activeCategory)
  return {
    title:
      activeCategory === TOKENS_ALL_CATEGORY
        ? "Token index"
        : `${label} in scope`,
    description:
      activeCategory === TOKENS_ALL_CATEGORY
        ? `${rowCount.toLocaleString()} tokens across ${TOKENS_INDEX.namespaces.length} namespaces. Click any KPI above to scope by category, or use the rail on the left for finer slicing.`
        : `${rowCount.toLocaleString()} ${label.toLowerCase()}. Filter by namespace or status from the table toolbar, or jump back to the full index from the rail.`,
    severity: "info",
    actionLabel: "Ask Leo",
  }
}

/** Friendly display label for the category currently scoped from the panel. */
function categoryDisplayLabel(category: TokensCategoryParam): string {
  if (category === TOKENS_ALL_CATEGORY) return "All tokens"
  return CATEGORY_TABS.find((c) => c.id === category)?.label ?? "Tokens"
}

/* ── Cell renderers ───────────────────────────────────────────────────── */

function useClipboard() {
  const [copied, setCopied] = React.useState<string | null>(null)
  const copy = React.useCallback((text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1200)
    }).catch(() => {})
  }, [])
  return { copied, copy }
}

function TokenNameCell({
  row,
  onCopy,
  copiedNow,
}: {
  row: TokenRow
  onCopy: (text: string) => void
  copiedNow: boolean
}) {
  const cssRef = `var(${row.name})`
  // Icon-only per-row Copy is mouse-only (`tabIndex={-1}`). With ~163 token
  // rows, making each row's hidden Copy a default tabstop produces a wall of
  // sequential focus stops in the table body — keyboard users perceive it as
  // a "Tab trap" and never reach the page chrome (sidebar drill-in, header
  // ⋯ menu, ⌘K trigger). WCAG 2.4.3 (Focus Order) + Exxat DS rule
  // `exxat-kbd-shortcuts.mdc` rule 6 ("skip dense tables, icon-only row
  // actions that already have aria-label"). Keyboard users keep the visible
  // `<code>` text (selectable by native browser copy) and can use ⌘K table
  // search to scope quickly; mouse users still see/click the button on
  // hover.
  return (
    <div className="group/token-name flex min-w-0 items-center gap-2">
      <code className="truncate font-mono text-xs text-foreground tabular-nums">{row.name}</code>
      <Tip side="top" label={copiedNow ? `Copied ${cssRef}` : `Copy ${cssRef}`}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          tabIndex={-1}
          className="size-6 shrink-0 opacity-0 transition-opacity group-hover/token-name:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onCopy(cssRef)
          }}
          aria-label={`Copy ${cssRef}`}
        >
          <i
            className={
              copiedNow
                ? "fa-light fa-check text-xs"
                : "fa-light fa-copy text-xs"
            }
            aria-hidden="true"
          />
        </Button>
      </Tip>
    </div>
  )
}

function StatusCell({ row }: { row: TokenRow }) {
  if (row.deprecated) {
    return (
      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
        deprecated
      </Badge>
    )
  }
  return <span className="text-xs text-muted-foreground">—</span>
}

/* ── Public ───────────────────────────────────────────────────────────── */

export function TokensThemesClient() {
  const dashboardHref = useProductDashboardHref()
  const { product, customProducts, activeCustomIndex } = useProduct()
  const tokensPersistKey = productPersistKey(product, "tokens", customProducts, activeCustomIndex)
  // Tokens now uses the `SidebarDrillIn` pattern (see
  // `apps/web/lib/mock/navigation.tsx` → `TOKENS_DRILL_IN_ITEMS`). The
  // sidebar handles drill-in entirely from the URL — no per-hub mount hook
  // is needed. The legacy `useAutoPanel("tokens")` and the orphaned
  // `TokensPanel` component were removed when the row was rewired.

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const activeCategory = React.useMemo(
    () => readTokensCategory(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )

  const [pagination, setPagination] = React.useState(false)
  const { copied, copy } = useClipboard()

  const navigateToCategory = React.useCallback(
    (category: TokensCategoryParam) => {
      const params = new URLSearchParams(searchParamsKey)
      if (category === TOKENS_ALL_CATEGORY) {
        params.delete("category")
      } else {
        params.set("category", String(category))
      }
      const next = params.toString()
      navigate(next ? `/tokens-themes?${next}` : "/tokens-themes")
    },
    [navigate, searchParamsKey],
  )

  const metrics = React.useMemo(
    () => buildMetrics(navigateToCategory),
    [navigateToCategory],
  )

  const rows = React.useMemo(
    () => ROWS_BY_CATEGORY.get(activeCategory) ?? TOKEN_ROWS,
    [activeCategory],
  )

  const insight = React.useMemo(
    () => buildInsight(activeCategory, rows.length),
    [activeCategory, rows.length],
  )

  const getTabCount = React.useCallback(() => rows.length, [rows.length])

  const tokenBoardGroups = React.useMemo((): ListPageBoardColumnDef<TokenRow>[] => {
    return CATEGORY_TABS.map(tab => ({
      id: String(tab.id),
      label: tab.label,
      filter: (row: TokenRow) => tab.matches(String(row.category)),
    }))
  }, [])

  const tokenHubRenderers = React.useMemo(
    () => buildTokensHubRenderers(metrics, insight),
    [metrics, insight],
  )

  const columns: ColumnDef<TokenRow>[] = React.useMemo(() => [
    {
      key: "preview",
      label: "Preview",
      width: 110,
      minWidth: 90,
      cell: (row) => (
        <div className="group flex w-full items-center justify-center">
          {categoryPreview(row.name, row.record)}
        </div>
      ),
    },
    {
      key: "name",
      label: "Token",
      width: 320,
      minWidth: 220,
      defaultPin: "left",
      sortable: true,
      sortKey: "name",
      filter: { type: "text", icon: "fa-font" },
      cell: (row) => (
        <TokenNameCell
          row={row}
          onCopy={copy}
          copiedNow={copied === `var(${row.name})`}
        />
      ),
    },
    {
      key: "namespace",
      label: "Namespace",
      width: 200,
      minWidth: 140,
      sortable: true,
      sortKey: "namespace",
      filter: {
        type: "select",
        icon: "fa-tag",
        options: NAMESPACE_OPTIONS,
      },
      cell: (row) => (
        <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {row.namespace}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      width: 340,
      minWidth: 200,
      sortable: true,
      sortKey: "value",
      filter: { type: "text", icon: "fa-magnifying-glass" },
      cell: (row) => (
        <code
          className="block truncate font-mono text-[11px] text-muted-foreground"
          title={row.value}
        >
          {row.value || "—"}
        </code>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "deprecated",
      filter: {
        type: "select",
        icon: "fa-circle-check",
        options: STATUS_OPTIONS,
      },
      cell: (row) => <StatusCell row={row} />,
    },
  ], [copy, copied])

  const headerTitle =
    activeCategory === TOKENS_ALL_CATEGORY
      ? "Tokens & themes"
      : `${categoryDisplayLabel(activeCategory)} tokens`

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [
          { label: "Dashboard", href: dashboardHref },
          { label: "Tokens & themes", href: "/tokens-themes" },
        ],
        title: headerTitle,
      }}
    >
      <ListPageTemplate
        defaultTabs={TOKENS_VIEW_TABS}
        persistKey={tokensPersistKey}
        supportedViewTypes={TOKENS_SUPPORTED_VIEWS}
        getTabCount={getTabCount}
        header={
          <PageHeader
            title={headerTitle}
            subtitle={TOKENS_HEADER_SUBTITLE}
          />
        }
        metrics={
          <KeyMetrics
            variant="flat"
            metrics={metrics}
            insight={insight}
            showHeader={false}
            metricsSingleRow
          />
        }
        renderContent={(tab, updateTab) => (
          <HubTable<TokenRow>
            rows={rows}
            columns={columns}
            view={tab.viewType}
            onViewChange={(v) =>
              updateTab({ viewType: v })
            }
            supportedViewTypes={TOKENS_SUPPORTED_VIEWS}
            hubLabel="Tokens"
            lifecycleTabLabel="Tokens & themes"
            searchAriaLabel="Search tokens"
            getRowId={(r) => r.id}
            getRowSelectionLabel={(r) => r.name}
            defaultSort={{ key: "name", dir: "asc" }}
            selectable={false}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationInitialPageSize={25}
            paginationPageSizeOptions={[10, 25, 50, 100]}
            persistKey={tokensPersistKey}
            persistTabId={tab.id}
            emptyState={
              <p className="text-sm text-muted-foreground">
                No tokens match your filters.
              </p>
            }
            listAriaLabel="Tokens"
            listEmptyState="No tokens match your filters."
            renderListRow={renderTokenListRow}
            renderBoardCard={row => (
              <ListPageBoardCard layout="stack">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-muted/20">
                    {categoryPreview(row.name, row.record)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.namespace}</p>
                  </div>
                </div>
              </ListPageBoardCard>
            )}
            boardGroups={tokenBoardGroups}
            boardEmptyColumnLabel="No tokens"
            renderers={tokenHubRenderers}
          />
        )}
      />
    </PrimaryPageTemplate>
  )
}
