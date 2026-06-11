/**
 * Typed `ListPageConnectedViewBody` renderers aligned with `supportedViewTypes`.
 */

import type * as React from "react"
import type { DataListViewType } from "@/lib/data-list-view"
import {
  getDataListViewRenderKind,
  type DataListViewRenderKind,
} from "@/lib/data-list-view-registry"
import type { ListPageConnectedViewRenderers } from "@/components/data-views/list-page-connected-view-body"

/** Maps each `DataListViewType` to its `DataListViewRenderKind` (compile-time). */
export type DataListViewRenderKindMap = {
  table: "data-table"
  list: "list-with-toolbar"
  board: "board-with-toolbar"
  dashboard: "dashboard-with-toolbar"
  calendar: "calendar-with-toolbar"
  folder: "folder-with-toolbar"
  panel: "panel-with-toolbar"
  "tree-panel": "tree-panel-with-toolbar"
}

export type HubRenderKindForViews<Supported extends readonly DataListViewType[]> =
  DataListViewRenderKindMap[Supported[number]]

export type HubConnectedViewRenderers<Supported extends readonly DataListViewType[]> = Partial<
  Record<HubRenderKindForViews<Supported>, React.ReactNode | (() => React.ReactNode)>
>

/** Render kinds required for a hub's `supportedViewTypes` array. */
export function hubRenderKindsForSupported(
  supported: readonly DataListViewType[],
): DataListViewRenderKind[] {
  return supported.map(v => getDataListViewRenderKind(v))
}

/**
 * Build renderers for `ListPageConnectedViewBody` and warn in dev when a supported view has no body.
 */
export function defineHubViewRenderers<Supported extends readonly DataListViewType[]>(
  supported: Supported,
  renderers: HubConnectedViewRenderers<Supported>,
): ListPageConnectedViewRenderers {
  if (import.meta.env.DEV) {
    for (const viewType of supported) {
      const kind = getDataListViewRenderKind(viewType)
      if (renderers[kind as HubRenderKindForViews<Supported>] == null) {
        console.warn(
          `[Exxat DS] Missing ListPageConnectedViewBody renderer for view "${viewType}" (${kind}). ` +
            "Add it to defineHubViewRenderers or remove the view from supportedViewTypes.",
        )
      }
    }
  }
  return renderers as ListPageConnectedViewRenderers
}
