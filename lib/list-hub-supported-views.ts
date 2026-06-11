import type { DataListViewType } from "@/lib/data-list-view"

/** Views implemented in `ListHubTable` — keep in sync with `ListPageConnectedViewBody` renderers. */
export const LIST_HUB_SUPPORTED_VIEWS = [
  "table",
  "list",
  "board",
  "calendar",
  "panel",
] as const satisfies readonly DataListViewType[]
