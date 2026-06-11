"use client"

/**
 * Column types — hub client.
 *
 * Same composition as Placements / Library
 * (`PrimaryPageTemplate` + `ListPageTemplate`):
 *   - `header`  : `PageHeader` with title + one-line subtitle describing the demo.
 *   - `metrics` : `KeyMetrics` `variant="flat"` — patterns, pinned, sortable, demo rows.
 *   - tabs      : default `table` tab; Add view offers list / board / dashboard (same as Library).
 *   - `renderContent` : the `<ColumnsShowcase />` DataTable surface.
 *
 * Cell patterns are exercised inside `columns-showcase.tsx` so the rendered
 * DataTable mirrors what real product hubs ship (favorite star, mono IDs,
 * `ListHubStatusBadge`, `AvatarGroup` + `+N`, etc.).
 */

import * as React from "react"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import {
  KeyMetrics,
  type MetricInsight,
  type MetricItem,
} from "@/components/key-metrics"
import {
  ListPageTemplate,
  type ViewTab,
  VIEW_TYPES,
} from "@/components/data-views"
import type { ViewType, HubTableHandle, CreatedViewSpec } from "@/components/data-views"
import {
  ColumnsShowcase,
  COLUMNS_SHOWCASE_PATTERN_COUNT,
  COLUMNS_SHOWCASE_PINNED_COUNT,
  COLUMNS_SHOWCASE_SORTABLE_COUNT,
  COLUMNS_SUPPORTED_VIEWS,
} from "@/components/columns-showcase"

const COLUMNS_DEFAULT_TABS: ViewTab[] = [
  {
    id: "columns-all",
    label: "All columns",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

const COLUMNS_SUBTITLE =
  "Every cell pattern the design system ships — checkbox select, primary identity, avatar group, status chip, inline toggle, tag overflow, rating stars, progress bar, currency, attachments, external link, relative time, absolute date, and row actions overflow."

const COLUMNS_TABLE_ANCHOR = "columns-table"

/**
 * Canonical KPI shape (matches `placement-kpi.ts` precedent):
 *   - every `MetricItem` is clickable (`href` anchor-jumps the table region),
 *   - a `MetricInsight` provides the narrative on the right side.
 * See `apps/web/docs/kpi-flat-band-pattern.md` + `exxat-kpi-trends.mdc`.
 */
const COLUMNS_KPIS: MetricItem[] = [
  {
    id: "patterns",
    label: "Cell patterns",
    value: COLUMNS_SHOWCASE_PATTERN_COUNT,
    delta: "",
    trend: "neutral",
    trendPolarity: "informational",
    metricVariant: "hero",
    description: "every SaaS-grid pattern, in one HubTable",
    href: `#${COLUMNS_TABLE_ANCHOR}`,
  },
  {
    id: "pinned",
    label: "Pinned columns",
    value: COLUMNS_SHOWCASE_PINNED_COUNT,
    delta: "",
    trend: "neutral",
    trendPolarity: "informational",
    description: "select + question on the left, actions on the right",
    href: `#${COLUMNS_TABLE_ANCHOR}`,
  },
  {
    id: "sortable",
    label: "Sortable",
    value: COLUMNS_SHOWCASE_SORTABLE_COUNT,
    delta: "",
    trend: "neutral",
    trendPolarity: "informational",
    description: "click any sortable header",
    href: `#${COLUMNS_TABLE_ANCHOR}`,
  },
  {
    id: "rows",
    label: "Demo rows",
    value: 12,
    delta: "",
    trend: "neutral",
    trendPolarity: "informational",
    description: "real library mocks + demo augmentations",
    href: `#${COLUMNS_TABLE_ANCHOR}`,
  },
]

const COLUMNS_INSIGHT: MetricInsight = {
  title: "Catalog, not playground",
  description:
    "Every cell pattern below is an importable named export from `@/components/data-views` — `ProgressCell`, `CurrencyCell`, `RatingCell`, `RowActionsCell`, and ten more. On a real hub, do not inline-implement these; import the named cell and pass the value.",
  severity: "info",
  actionLabel: "Ask Leo",
}

export function ColumnsClient() {
  const [tabs, setTabs] = React.useState<ViewTab[]>(COLUMNS_DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = React.useState<string>(COLUMNS_DEFAULT_TABS[0]!.id)
  const [showViewCounts, setShowViewCounts] = React.useState(true)
  const hubTableRef = React.useRef<HubTableHandle>(null)

  // ── 2-step "Add view" creation flow ─────────────────────────────────────
  // The creation drawer is mounted inside `<HubTable>` (see
  // `ColumnsShowcase` → `LibraryTable` → `HubTable`). The template-vite
  // columns demo doesn't persist, so we don't seed localStorage here.
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
    const newTab: ViewTab = {
      id: `${spec.viewType}-${Date.now().toString(36)}`,
      label: spec.name || def.label,
      viewType: spec.viewType,
      icon: def.icon,
      filterId: "all",
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setCreatingViewType(null)
    setCreatingName("")
  }, [])

  const getTabCount = React.useCallback(() => 12, [])

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }],
        title: "Column types",
      }}
    >
      <ListPageTemplate
        defaultTabs={COLUMNS_DEFAULT_TABS}
        tabs={tabs}
        onTabsChange={setTabs}
        activeTabId={activeTabId}
        onActiveTabChange={setActiveTabId}
        getTabCount={getTabCount}
        supportedViewTypes={COLUMNS_SUPPORTED_VIEWS}
        onRequestCreateView={handleRequestCreateView}
        showViewCounts={showViewCounts}
        onShowViewCountsChange={setShowViewCounts}
        header={
          <PageHeader
            title="Column types"
            subtitle={COLUMNS_SUBTITLE}
          />
        }
        metrics={
          <KeyMetrics
            variant="flat"
            metrics={COLUMNS_KPIS}
            insight={COLUMNS_INSIGHT}
            showHeader={false}
            metricsSingleRow
          />
        }
        renderContent={(tab, updateTab) => (
          <div id={COLUMNS_TABLE_ANCHOR}>
            <ColumnsShowcase
              view={tab.viewType}
              onViewChange={(v) => updateTab({ viewType: v })}
              viewName={tab.label}
              onViewNameChange={(name) => updateTab({ label: name })}
              tableRef={hubTableRef}
              showViewCounts={showViewCounts}
              onShowViewCountsChange={setShowViewCounts}
              creatingViewType={creatingViewType}
              creatingViewName={creatingName}
              onCreatingViewNameChange={setCreatingName}
              onCancelCreation={handleCancelCreation}
              onCommitCreation={handleCommitCreation}
            />
          </div>
        )}
      />
    </PrimaryPageTemplate>
  )
}
