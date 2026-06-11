/**
 * Command palette (⌘K) — types, static groups, and `buildCommandMenuConfig()`.
 * Optional **`dataGroups`** can be passed from the app shell when you want searchable row data.
 */

export type CommandMenuItem = {
  id: string
  label: string
  /** cmdk filter keywords */
  keywords?: string
  /** Font Awesome classes for link rows */
  icon?: string
  /** Navigate to this in-app route */
  href?: string
  /** If set, opens Ask Leo with this prompt (no navigation) */
  askLeoPrompt?: string
}

export type CommandMenuGroup = {
  id: string
  heading: string
  items: CommandMenuItem[]
  /**
   * When true, this group is not rendered until the user types a non-empty search.
   * Use for large row indexes (e.g. placements) so the palette does not list every record on open.
   */
  searchOnly?: boolean
}

export type CommandMenuConfig = {
  /** cmdk accessible name */
  commandLabel: string
  dialogTitle: string
  dialogDescription: string
  inputPlaceholder: string
  inputAriaLabel: string
  emptyMessage: string
  closeMenuAriaLabel: string
  groups: CommandMenuGroup[]
}

const COMMAND_MENU_SHELL: Omit<CommandMenuConfig, "groups"> = {
  commandLabel: "Command menu",
  dialogTitle: "Search",
  dialogDescription:
    "Search pages and components, or use AI suggestions. Use arrow keys to move through results, Enter to open, Escape to close.",
  inputPlaceholder: "Search routes, patterns, and demo rows…",
  inputAriaLabel: "Search routes, patterns, or demo data",
  emptyMessage: "No results found.",
  closeMenuAriaLabel: "Close command menu",
}

/** AI prompts, navigation, library, and patterns — fixed product chrome (not row data). */
const STATIC_COMMAND_GROUPS: CommandMenuGroup[] = [
  {
    id: "ai",
    heading: "AI suggestions",
    items: [
      {
        id: "ai-a11y",
        label: "How do I meet WCAG 2.1 AA for tables and dialogs?",
        keywords: "leo ai accessibility wcag aria keyboard",
        askLeoPrompt: "How do I meet WCAG 2.1 AA for tables and dialogs in this design system?",
      },
      {
        id: "ai-tokens",
        label: "Explain how semantic tokens map to components",
        keywords: "leo ai theme tokens css variables tailwind",
        askLeoPrompt: "Explain how semantic tokens map to components in this app shell.",
      },
      {
        id: "ai-list-page",
        label: "What belongs on a ListPageTemplate hub?",
        keywords: "leo ai list page data views board dashboard",
        askLeoPrompt: "What belongs on a ListPageTemplate hub in Exxat DS?",
      },
      {
        id: "ai-charts",
        label: "How should charts expose keyboard exploration?",
        keywords: "leo ai charts keyboard chartfigure recharts",
        askLeoPrompt: "How should charts expose keyboard exploration in this design system?",
      },
    ],
  },
  {
    id: "navigation",
    heading: "Navigation",
    items: [
      { id: "nav-dashboard", icon: "fa-light fa-grid-2", label: "Dashboard", href: "/prism/dashboard" },
      {
        id: "nav-library",
        icon: "fa-light fa-books",
        label: "Question bank",
        href: "/library",
        keywords: "search ai create ask leo discovery hub library home",
      },
      {
        id: "nav-library-all",
        icon: "fa-light fa-table-list",
        label: "Library",
        href: "/library/all",
        keywords: "all questions folders assessment items tree panel table",
      },
      {
        id: "nav-settings-organization",
        icon: "fa-light fa-gear",
        label: "Organization settings",
        href: "/settings/organization",
        keywords: "workspace products branding appearance custom tenant",
      },
      {
        id: "nav-settings-profile",
        icon: "fa-light fa-sliders",
        label: "Profile settings",
        href: "/settings/profile",
        keywords: "theme display tours banner preferences personal",
      },
      { id: "nav-help", icon: "fa-light fa-circle-question", label: "Help", href: "/help" },
    ],
  },
]

export type BuildCommandMenuConfigOptions = {
  /**
   * Searchable row groups from your data layer (mock or API). Omitted or empty = no data rows.
   * Order: inserted after AI suggestions, before Navigation / Components / Patterns.
   */
  dataGroups?: CommandMenuGroup[]
}

/**
 * Merge shell copy + static product groups with optional **`dataGroups`** from the app.
 */
export function buildCommandMenuConfig(
  options: BuildCommandMenuConfigOptions = {},
): CommandMenuConfig {
  const { dataGroups = [] } = options
  const [aiGroup, ...staticRest] = STATIC_COMMAND_GROUPS

  return {
    ...COMMAND_MENU_SHELL,
    groups: [aiGroup, ...dataGroups, ...staticRest],
  }
}
