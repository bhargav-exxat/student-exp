import type { DiscoveryHubSearchGroup } from "@/lib/discovery-hub"
import {
  LIBRARY_ENTRY_PATH,
  LIBRARY_ALL_PATH,
} from "@/lib/library-nav"

export type { DiscoveryHubSearchGroup, DiscoveryHubSearchItem } from "@/lib/discovery-hub"

export function buildLibraryHubSearchGroups(): DiscoveryHubSearchGroup[] {
  return [
    {
      id: "ai-create",
      heading: "Create with AI",
      items: [
        {
          id: "ai-mcq",
          label: "Draft a choice-style item from a prompt",
          keywords: "ai leo create item choice prompt",
          askLeoPrompt:
            "Help me draft a new choice-style library item. Ask clarifying questions about category, level, and intent before proposing a name and options.",
        },
        {
          id: "ai-osce",
          label: "Generate a checklist from a sample scenario",
          keywords: "ai leo checklist scenario",
          askLeoPrompt:
            "I want to generate a checklist from a sample scenario. Walk me through the scenario details you need, then propose observable steps and scoring notes.",
        },
        {
          id: "ai-remediation",
          label: "Turn flagged items into follow-up entries",
          keywords: "ai leo follow-up review flagged items",
          askLeoPrompt:
            "Turn a list of flagged items into follow-up library entries. Ask what category and level to target, then suggest short-text or choice-style follow-ups.",
        },
        {
          id: "ai-bank-outline",
          label: "Outline a new library section",
          keywords: "ai leo outline library section folders",
          askLeoPrompt:
            "Help me outline a new library section. Suggest folder structure, item types, and a balanced mix of levels before we add items.",
        },
      ],
    },
    {
      id: "actions",
      heading: "Quick actions",
      items: [
        {
          id: "browse-library",
          label: "Browse the library",
          keywords: "library table folder panel tree views",
          icon: "fa-light fa-table-list",
          href: LIBRARY_ALL_PATH,
        },
        {
          id: "browse-my",
          label: "Open my items",
          keywords: "my items owner scope",
          icon: "fa-light fa-user",
          href: `${LIBRARY_ALL_PATH}?scope=my`,
        },
        {
          id: "new-question",
          label: "Create new item",
          keywords: "new item create draft owner",
          icon: "fa-light fa-plus",
          askLeoPrompt:
            "Help me create a new library item. Start by asking for category, item type, level, and intent, then draft the name, options, and notes.",
        },
        {
          id: "hub-entry",
          label: "Library home",
          keywords: "home hub search",
          icon: "fa-light fa-house",
          href: LIBRARY_ENTRY_PATH,
        },
      ],
    },
  ]
}

export const LIBRARY_HUB_SEARCH_PLACEHOLDER =
  "Search items, folders, or describe what you want to create…"

export const LIBRARY_HUB_ASK_LEO_PROMPTS = [
  "Draft five choice-style items for Category 1",
  "Suggest folder names for a new library section",
  "Rewrite this name for clarity",
] as const
