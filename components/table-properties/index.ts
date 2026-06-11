/**
 * Table / data properties drawer — configure filters, sort, columns, display, and view type.
 * Pass column metadata and filter field definitions for any row shape; placement defaults live in types.ts.
 *
 * List page ↔ Properties: `createListPageEditViewHandler` + `OpenTablePropertiesHandle`, or pass
 * `tablePropertiesRef` on `ListPageTemplate` (see `lib/list-page-table-properties.ts`).
 */

export { TablePropertiesDrawer } from "./drawer"
export type { TablePropertiesDrawerProps } from "./drawer"
export { TablePropertiesDrawerButton } from "./drawer-button"
export type {
  TablePropertiesDrawerButtonProps,
  TablePropertiesDrawerButtonState,
} from "./drawer-button"
export * from "./types"

export {
  createListPageEditViewHandler,
  isDataListSurfaceViewType,
  type OpenTablePropertiesHandle,
} from "@/lib/list-page-table-properties"
