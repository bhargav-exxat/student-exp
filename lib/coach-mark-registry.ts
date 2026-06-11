/**
 * Coach Mark Registry — central definition of all coach mark flows.
 *
 * Used by:
 *   • Settings page to list/reset/preview flows
 *   • Individual pages to look up their flow steps
 */

export interface CoachMarkFlowDef {
  /** Unique flow ID — matches the key in localStorage */
  id: string
  /** Human-readable name shown in settings */
  name: string
  /** Short description of what the tour covers */
  description: string
  /** Which page this flow runs on */
  page: string
  /** Page URL (for "Preview" navigation) */
  pageUrl: string
  /** Number of steps */
  stepCount: number
}

export const COACH_MARK_FLOWS: CoachMarkFlowDef[] = [
  {
    id: "dashboard-tour",
    name: "Dashboard Tour",
    description:
      "Introduces the dashboard — key metrics, AI insights, Ask Leo, and view switching.",
    page: "Dashboard",
    pageUrl: "/dashboard",
    stepCount: 4,
  },
  {
    id: "data-list-views-tour",
    name: "Views & Properties Tour",
    description:
      "Walks through view tabs, customisation, adding views, search, filters, and the Properties panel.",
    page: "List hub",
    pageUrl: "/data-list",
    stepCount: 6,
  },
  {
    id: "data-list-dashboard-customize",
    name: "Customize dashboard (List hub)",
    description:
      "Highlights Edit layout on the Data view dashboard toolbar — drag widgets, chart types, and width.",
    page: "List hub",
    pageUrl: "/data-list",
    stepCount: 1,
  },
]
