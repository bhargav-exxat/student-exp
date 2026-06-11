"use client"

import * as React from "react"
import {
  FolderGridView,
  ListPageBoardCard,
  ListPageSplitHubChrome,
  type HubTableRendererArgs,
  type HubTableRenderers,
} from "@/components/data-views"
import { ListPageTreeColumnHeader } from "@/components/data-views/list-page-tree-column-header"
import {
  LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS,
  LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS,
  LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS,
} from "@/components/data-views/list-page-split-hub-tokens"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { categoryPreview, type TokenRecord } from "@/components/tokens-themes-section"

export interface TokenHubRow extends Record<string, unknown> {
  id: string
  name: string
  namespace: string
  category: string
  value: string
  deprecated: boolean
  record: TokenRecord
}

export function TokensDashboardBody({
  metrics,
  insight,
}: {
  metrics: MetricItem[]
  insight: MetricInsight
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:px-6">
      <KeyMetrics variant="flat" metrics={metrics} insight={insight} showHeader={false} metricsSingleRow />
    </div>
  )
}

export function TokensFolderBody({ rows }: { rows: TokenHubRow[] }) {
  return (
    <FolderGridView
      rows={rows}
      getRowId={r => r.id}
      ariaLabel="Design tokens"
      constrainWidth
      renderTile={row => (
        <button
          type="button"
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center",
            "transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <div className="flex size-12 items-center justify-center">{categoryPreview(row.name, row.record)}</div>
          <span className="line-clamp-2 font-mono text-xs text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.namespace}</span>
        </button>
      )}
      emptyContent={<p className="text-sm text-muted-foreground">No tokens match your filters.</p>}
    />
  )
}

function TokenDetailPanel({ row }: { row: TokenHubRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30">
          {categoryPreview(row.name, row.record)}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.namespace}</p>
        </div>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground">Value</span>
        <p className="mt-1 font-mono text-xs text-foreground break-all">{row.value}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground">Category</span>
        <p className="mt-1 text-sm text-foreground">{String(row.category)}</p>
      </div>
    </div>
  )
}

export function TokensPanelBody({ rows }: { rows: TokenHubRow[] }) {
  const namespaces = React.useMemo(
    () => [...new Set(rows.map(r => r.namespace))].toSorted((a, b) => a.localeCompare(b)),
    [rows],
  )
  const [pickedNamespace, setPickedNamespace] = React.useState<string | null>(null)
  const [pickedId, setPickedId] = React.useState<string | null>(null)

  const activeNamespace =
    pickedNamespace && namespaces.includes(pickedNamespace)
      ? pickedNamespace
      : (namespaces[0] ?? null)

  const inNamespace = React.useMemo(
    () => (activeNamespace ? rows.filter(r => r.namespace === activeNamespace) : []),
    [rows, activeNamespace],
  )

  const activeId =
    pickedId && inNamespace.some(r => r.id === pickedId)
      ? pickedId
      : (inNamespace[0]?.id ?? null)

  const activeRow = inNamespace.find(r => r.id === activeId) ?? null

  return (
    <ListPageSplitHubChrome aria-label="Token namespaces and details">
      <ResizablePanelGroup direction="horizontal" className="flex h-full min-h-0 w-full flex-1">
        <ResizablePanel defaultSize={28} minSize={18} className={LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS}>
          <ListPageTreeColumnHeader title="Namespaces" />
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {namespaces.map(ns => (
              <button
                key={ns}
                type="button"
                onClick={() => setPickedNamespace(ns)}
                className={cn(
                  "flex w-full items-center rounded-md px-3 py-2 text-left text-sm",
                  activeNamespace === ns ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {ns}
              </button>
            ))}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />
        <ResizablePanel defaultSize={32} minSize={20} className={LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS}>
          <ListPageTreeColumnHeader title={activeNamespace ?? "Tokens"} />
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {inNamespace.map(row => (
              <button
                key={row.id}
                type="button"
                onClick={() => setPickedId(row.id)}
                className={cn(
                  "flex w-full flex-col rounded-md px-3 py-2 text-left",
                  activeId === row.id ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <span className="truncate font-mono text-xs text-foreground">{row.name}</span>
                <span className="truncate text-xs text-muted-foreground">{String(row.category)}</span>
              </button>
            ))}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />
        <ResizablePanel defaultSize={40} minSize={24} className={LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS}>
          <ListPageTreeColumnHeader title="Details" className="px-4" />
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeRow ? <TokenDetailPanel row={activeRow} /> : <p className="text-sm text-muted-foreground">Select a token.</p>}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ListPageSplitHubChrome>
  )
}

export function TokensTreePanelBody({ rows }: { rows: TokenHubRow[] }) {
  const byNamespace = React.useMemo(() => {
    const map = new Map<string, TokenHubRow[]>()
    for (const row of rows) {
      const list = map.get(row.namespace) ?? []
      list.push(row)
      map.set(row.namespace, list)
    }
    return [...map.entries()].toSorted(([a], [b]) => a.localeCompare(b))
  }, [rows])

  const [openNs, setOpenNs] = React.useState<Set<string>>(() => new Set(byNamespace.map(([ns]) => ns)))
  const [activeId, setActiveId] = React.useState<string | null>(rows[0]?.id ?? null)
  const activeRow = rows.find(r => r.id === activeId) ?? null

  return (
    <ListPageSplitHubChrome aria-label="Token tree">
      <ResizablePanelGroup direction="horizontal" className="flex h-full min-h-0 w-full flex-1">
        <ResizablePanel defaultSize={40} minSize={24} className={LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS}>
          <ListPageTreeColumnHeader title="All tokens" />
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {byNamespace.map(([ns, items]) => {
              const open = openNs.has(ns)
              return (
                <div key={ns} className="mb-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-muted/50"
                    onClick={() =>
                      setOpenNs(prev => {
                        const next = new Set(prev)
                        if (next.has(ns)) next.delete(ns)
                        else next.add(ns)
                        return next
                      })
                    }
                  >
                    <i
                      className={cn("fa-light text-xs text-muted-foreground", open ? "fa-chevron-down" : "fa-chevron-right")}
                      aria-hidden="true"
                    />
                    {ns}
                  </button>
                  {open ? (
                    <div className="ms-4 border-s border-border ps-2">
                      {items.map(row => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => setActiveId(row.id)}
                          className={cn(
                            "flex w-full rounded-md px-2 py-1.5 text-left font-mono text-xs",
                            activeId === row.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          {row.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />
        <ResizablePanel defaultSize={60} minSize={30} className={LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS}>
          <ListPageTreeColumnHeader title="Details" className="px-4" />
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeRow ? <TokenDetailPanel row={activeRow} /> : <p className="text-sm text-muted-foreground">Select a token.</p>}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ListPageSplitHubChrome>
  )
}

export function buildTokensHubRenderers(
  metrics: MetricItem[],
  insight: MetricInsight,
): Pick<
  HubTableRenderers<TokenHubRow>,
  "dashboard-with-toolbar" | "folder-with-toolbar" | "panel-with-toolbar" | "tree-panel-with-toolbar"
> {
  return {
    "dashboard-with-toolbar": ({ toolbar }: HubTableRendererArgs<TokenHubRow>) => (
      <div className="flex min-h-0 flex-1 flex-col">
        {toolbar}
        <TokensDashboardBody metrics={metrics} insight={insight} />
      </div>
    ),
    "folder-with-toolbar": ({ state, toolbarShell }) =>
      toolbarShell(<TokensFolderBody rows={state.rows as TokenHubRow[]} />),
    "panel-with-toolbar": ({ state, toolbarShell }) =>
      toolbarShell(<TokensPanelBody rows={state.rows as TokenHubRow[]} />),
    "tree-panel-with-toolbar": ({ state, toolbarShell }) =>
      toolbarShell(<TokensTreePanelBody rows={state.rows as TokenHubRow[]} />),
  }
}

export function renderTokenListRow(row: TokenHubRow) {
  return (
    <ListPageBoardCard layout="row" rowContainerClassName="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/20">
          {categoryPreview(row.name, row.record)}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-mono text-sm font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.namespace} · {String(row.category)}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.value}</p>
        </div>
      </div>
    </ListPageBoardCard>
  )
}
