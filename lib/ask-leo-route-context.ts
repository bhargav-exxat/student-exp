/**
 * Route-derived defaults for Ask Leo when no page calls `useAskLeoPageContext`.
 * Copy stays generic for the design-system shell.
 */

export interface AskLeoRouteContextPayload {
  title: string
  description?: string
  suggestions?: string[]
  data?: Record<string, unknown>
}

/** Fallback starters when a page provides no `suggestions`. */
export const ASK_LEO_GENERIC_SUGGESTIONS = [
  "How do I meet WCAG 2.1 AA for tables and dialogs?",
  "Explain how semantic tokens map to components",
  "What belongs on a ListPageTemplate hub?",
  "How should charts expose keyboard exploration?",
]

function normalizeProductPath(pathname: string): string {
  return pathname.replace(/^\/[^/]+\/(library|dashboard|settings|leo)(?=\/|$)/, "/$1")
}

export function getAskLeoRouteContext(pathname: string | null): AskLeoRouteContextPayload {
  if (!pathname || pathname === "/") {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and layout patterns.",
      suggestions: [
        "What changed in the headline metrics this week?",
        "Summarize the dashboard layout for a stakeholder",
        "Which chart should I inspect first for anomalies?",
      ],
    }
  }

  const normalizedPathname = normalizeProductPath(pathname)

  if (normalizedPathname.startsWith("/dashboard")) {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and layout patterns.",
      suggestions: [
        "What changed in the headline metrics this week?",
        "Summarize the dashboard layout for a stakeholder",
        "Which chart should I inspect first for anomalies?",
      ],
    }
  }

  if (pathname.startsWith("/data-list")) {
    return {
      title: "List hub",
      description: "Demo list with table, list, board, and dashboard views sharing one table state.",
      suggestions: [
        "How do filters and search interact with board and dashboard tabs?",
        "Summarize what is shown in the active view",
        "What columns are useful for a dense data grid?",
      ],
    }
  }

  if (normalizedPathname.endsWith("/settings") || normalizedPathname.startsWith("/settings/")) {
    const organization =
      normalizedPathname.endsWith("/settings") || normalizedPathname.includes("/settings/organization")
    return {
      title: organization ? "Organization settings" : "Profile settings",
      description: organization
        ? "Workspace products and branding shared across products in this browser."
        : "Your theme, banner, tours, and display preferences on this device.",
      suggestions: organization
        ? ["How do I add a custom product?", "Where is brand color configured?"]
        : ["How do I reset onboarding tours?", "Where is high contrast configured?"],
    }
  }

  if (normalizedPathname.startsWith("/library/all") || normalizedPathname.startsWith("/library/list") || normalizedPathname.startsWith("/library/find")) {
    return {
      title: "Question library",
      description: "Browse folders, views, and mock assessment items.",
      suggestions: [
        "Summarize items in the active folder scope",
        "Suggest folders for a new library section",
        "How do panel and tree views relate to the same dataset?",
      ],
    }
  }

  if (normalizedPathname.startsWith("/library")) {
    return {
      title: "Library",
      description: "Search in plain language, draft items with AI, or open the full library.",
      suggestions: [
        "Draft a multiple-choice question on clinical reasoning",
        "Outline a new library for a course module",
        "Rewrite this stem for clarity and bias-free wording",
      ],
    }
  }

  if (pathname.startsWith("/help")) {
    return {
      title: "Get help",
      description: "Support and documentation entry points.",
      suggestions: [
        "Where do I find training articles?",
        "How do I contact support?",
      ],
    }
  }

  // Product-scoped Leo landing — the Sheet opened on top of /leo is a
  // quick-ask escape hatch. Keep suggestions short and action-oriented so
  // the Sheet does not duplicate the landing's chip rail.
  if (pathname.endsWith("/leo") || pathname.includes("/leo/")) {
    return {
      title: "Leo workspace",
      description: "Quick-ask while you have the focused workspace open.",
      suggestions: [
        "What can you do with the data I see here?",
        "Summarize the most urgent items across my hubs",
        "Suggest a follow-up to my last question",
      ],
    }
  }

  const last = pathname.split("/").filter(Boolean).pop() ?? "this page"
  const title = last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title,
    suggestions: ASK_LEO_GENERIC_SUGGESTIONS,
  }
}
