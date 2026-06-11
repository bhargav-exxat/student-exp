/**
 * Library authoring — generic demo constants for the new-item composer.
 *
 * Storage in `lib/mock/library.ts` keeps the simple `LibraryItemType` enum
 * (`multiple_choice` | `true_false` | `short_answer`). The authoring surface
 * exposes a richer item-writer model and maps back to that base enum on save.
 *
 * All copy is intentionally generic so the demo applies to any product domain.
 */

import type { LibraryBloomLevel, LibraryItemType } from "@/lib/mock/library"

// ─────────────────────────────────────────────────────────────────────────────
// Item type
// ─────────────────────────────────────────────────────────────────────────────

/** Authoring-time item type — richer than the storage enum. */
export type AuthoringQuestionType =
  | "mcq_single"
  | "mcq_multiple"
  | "true_false"
  | "short_answer"
  | "numeric"
  | "essay"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "hotspot"

export interface AuthoringQuestionTypeOption {
  value: AuthoringQuestionType
  label: string
  shortLabel: string
  icon: string
  /** Long, sentence-form description for the inspector caption. */
  description: string
  /** Compact one-liner shown under the title in `SelectionTileGrid` tiles. */
  tileSummary: string
  /** "Single best answer", "Multiple response", etc. — appears under the title. */
  badge?: string
  /** Maps to the storage type when persisting. */
  storageType: LibraryItemType
}

export const AUTHORING_QUESTION_TYPES: readonly AuthoringQuestionTypeOption[] = [
  {
    value: "mcq_single",
    label: "Single choice",
    shortLabel: "Single choice",
    icon: "fa-list-radio",
    description:
      "One correct answer from a set of options. Default 5 distractors.",
    tileSummary: "Single correct answer from a set of options",
    badge: "Single best answer",
    storageType: "multiple_choice",
  },
  {
    value: "mcq_multiple",
    label: "Multi-select",
    shortLabel: "Multi-select",
    icon: "fa-list-check",
    description:
      "Select every correct option from the list. Optional partial credit.",
    tileSummary: "One or more correct answers — partial credit",
    badge: "Multiple response",
    storageType: "multiple_choice",
  },
  {
    value: "true_false",
    label: "True / False",
    shortLabel: "True / False",
    icon: "fa-circle-half-stroke",
    description:
      "Use for simple, unambiguous statements.",
    tileSummary: "Binary statement — quick recall",
    storageType: "true_false",
  },
  {
    value: "short_answer",
    label: "Short answer",
    shortLabel: "Short answer",
    icon: "fa-input-text",
    description:
      "Free-text response with an expected answer + acceptable variants.",
    tileSummary: "Single word or short phrase, exact-match",
    storageType: "short_answer",
  },
  {
    value: "numeric",
    label: "Numeric",
    shortLabel: "Numeric",
    icon: "fa-input-numeric",
    description:
      "Number-only response with optional units and a ± tolerance band.",
    tileSummary: "Number with units and tolerance band",
    badge: "Auto-graded",
    storageType: "short_answer",
  },
  {
    value: "essay",
    label: "Essay",
    shortLabel: "Essay",
    icon: "fa-paragraph",
    description:
      "Long-form response graded against a rubric.",
    tileSummary: "Long response — rubric-graded",
    badge: "Rubric",
    storageType: "short_answer",
  },
  {
    value: "fill_blank",
    label: "Fill in the blank",
    shortLabel: "Fill in the blank",
    icon: "fa-text-size",
    description:
      "Sentence with one or more {{blanks}}; respondents type the missing word(s).",
    tileSummary: "Sentence with one or more blanks to fill",
    storageType: "short_answer",
  },
  {
    value: "matching",
    label: "Matching",
    shortLabel: "Matching",
    icon: "fa-arrow-right-arrow-left",
    description:
      "Two columns — pair each prompt on the left to its correct match on the right.",
    tileSummary: "Pair entries on the left to entries on the right",
    storageType: "multiple_choice",
  },
  {
    value: "ordering",
    label: "Ordering",
    shortLabel: "Ordering",
    icon: "fa-list-ol",
    description:
      "Show steps; respondents re-order them into the correct sequence.",
    tileSummary: "Place items in the correct sequence",
    storageType: "multiple_choice",
  },
  {
    value: "hotspot",
    label: "Hotspot",
    shortLabel: "Hotspot",
    icon: "fa-bullseye-pointer",
    description:
      "Image-based item — respondents click the correct region.",
    tileSummary: "Click the correct region of an image",
    badge: "Image-based",
    storageType: "multiple_choice",
  },
] as const

export function authoringQuestionType(value: AuthoringQuestionType): AuthoringQuestionTypeOption {
  return AUTHORING_QUESTION_TYPES.find(t => t.value === value) ?? AUTHORING_QUESTION_TYPES[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// Level + tier + cognitive level
// ─────────────────────────────────────────────────────────────────────────────

export const AUTHORING_DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Low", description: "Quick recall — most respondents complete" },
  { value: "medium", label: "Normal", description: "Standard application — mixed completion" },
  { value: "hard", label: "High", description: "Deeper analysis — fewer respondents complete" },
] as const

export const AUTHORING_BLOOM_OPTIONS: readonly {
  value: LibraryBloomLevel
  label: string
  hint: string
}[] = [
  { value: "Remember", label: "Remember", hint: "Recall basic facts" },
  { value: "Understand", label: "Understand", hint: "Explain, summarise, classify" },
  { value: "Apply", label: "Apply", hint: "Use knowledge in a new situation" },
  { value: "Analyze", label: "Analyze", hint: "Break information apart, examine relationships" },
  { value: "Evaluate", label: "Evaluate", hint: "Justify a stand, defend a decision" },
  { value: "Create", label: "Create", hint: "Produce new or original work" },
] as const

/** Cognitive level — broader bucketing for analytics. */
export const AUTHORING_COG_LEVEL_OPTIONS = [
  { value: "recall", label: "Recall", hint: "Definitions and core concepts" },
  { value: "application", label: "Application", hint: "Apply concept to a new scenario" },
  { value: "analysis", label: "Analysis", hint: "Compare, evaluate, synthesise" },
] as const
export type AuthoringCogLevel = typeof AUTHORING_COG_LEVEL_OPTIONS[number]["value"]

// ─────────────────────────────────────────────────────────────────────────────
// Category / subject / track / phase
// ─────────────────────────────────────────────────────────────────────────────

export const AUTHORING_SUBJECT_AREAS = [
  "Category 1",
  "Category 2",
  "Category 3",
  "Category 4",
  "Category 5",
  "Category 6",
  "Category 7",
  "Category 8",
  "Category 9",
  "Category 10",
] as const
export type AuthoringSubjectArea = typeof AUTHORING_SUBJECT_AREAS[number]

export const AUTHORING_BODY_SYSTEMS = [
  { value: "topic-a", label: "Topic A", icon: "fa-circle" },
  { value: "topic-b", label: "Topic B", icon: "fa-circle" },
  { value: "topic-c", label: "Topic C", icon: "fa-circle" },
  { value: "topic-d", label: "Topic D", icon: "fa-circle" },
  { value: "topic-e", label: "Topic E", icon: "fa-circle" },
  { value: "topic-f", label: "Topic F", icon: "fa-circle" },
  { value: "topic-g", label: "Topic G", icon: "fa-circle" },
  { value: "topic-h", label: "Topic H", icon: "fa-circle" },
  { value: "topic-i", label: "Topic I", icon: "fa-circle" },
  { value: "topic-j", label: "Topic J", icon: "fa-circle" },
  { value: "topic-k", label: "Topic K", icon: "fa-circle" },
  { value: "topic-l", label: "Topic L", icon: "fa-circle" },
  { value: "topic-multi", label: "Multi-topic", icon: "fa-circle-nodes" },
] as const
export type AuthoringBodySystem = typeof AUTHORING_BODY_SYSTEMS[number]["value"]

export const AUTHORING_DISCIPLINES = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
  "Track 5",
  "Track 6",
  "Track 7",
  "Track 8",
  "Track 9",
  "Track 10",
  "Track 11",
] as const
export type AuthoringDiscipline = typeof AUTHORING_DISCIPLINES[number]

export const AUTHORING_PHASES = [
  { value: "preclinical", label: "Phase 1", hint: "Early stage" },
  { value: "clinical", label: "Phase 2", hint: "Practice stage" },
  { value: "residency", label: "Phase 3", hint: "Advanced stage" },
  { value: "ce", label: "Phase 4", hint: "Ongoing stage" },
] as const
export type AuthoringPhase = typeof AUTHORING_PHASES[number]["value"]

// ─────────────────────────────────────────────────────────────────────────────
// Workflow status
// ─────────────────────────────────────────────────────────────────────────────

export type AuthoringStatus = "draft" | "in_review" | "approved" | "published" | "retired"

export const AUTHORING_STATUS_OPTIONS: readonly { value: AuthoringStatus; label: string; description: string; icon: string }[] = [
  {
    value: "draft",
    label: "Draft",
    description: "Visible only to owners. Not eligible for use.",
    icon: "fa-file-pen",
  },
  {
    value: "in_review",
    label: "In review",
    description: "Awaiting peer review.",
    icon: "fa-magnifying-glass",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Reviewer signed off. Ready to publish.",
    icon: "fa-circle-check",
  },
  {
    value: "published",
    label: "Published",
    description: "Live in the library. Available for use.",
    icon: "fa-broadcast-tower",
  },
  {
    value: "retired",
    label: "Retired",
    description: "Removed from active use. Kept for history.",
    icon: "fa-box-archive",
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const AUTHORING_DEFAULT_OPTION_COUNT = 5
export const AUTHORING_MIN_OPTION_COUNT = 2
export const AUTHORING_MAX_OPTION_COUNT = 8

/** Name placeholder — generic primary line for the demo composer. */
export const AUTHORING_STEM_PLACEHOLDER = `Item 13 — sample primary line for a new library entry. Describe the item in one or two sentences so respondents understand the prompt without needing extra context. Use placeholder content that demonstrates the layout without committing to a specific product domain.`

export const AUTHORING_LEAD_IN_PLACEHOLDER =
  "Which option fits best?"

/** Best-practice notes prompt — owner-side, not respondent-facing. */
export const AUTHORING_RATIONALE_PLACEHOLDER =
  "Explain why this option is correct (or why this distractor is plausible). Cite the source or reference where possible."

/**
 * Draft item handle assigned when the composer route loads.
 * Format: `LIB-YYMM-XXXX` (e.g. `LIB-2605-A3F2`). Generate on the server and pass
 * into the composer so SSR and hydration share one value.
 */
export function generateDraftQuestionId(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase().padEnd(4, "0")
  return `LIB-${yy}${mm}-${rand}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Ask Leo — draft assistance
// ─────────────────────────────────────────────────────────────────────────────

/** Hub landing + generic “draft with AI” entry. */
export const LIBRARY_DRAFT_WITH_AI_PROMPT =
  "Help me draft a new library question. Ask what I am assessing, the item format, and difficulty, then propose a stem, answer options (or type-specific fields), rationale, Bloom level, tags, and notes I can paste into the composer."

/** Starter prompts when the new-question composer is open. */
export const NEW_QUESTION_ASK_LEO_SUGGESTIONS = [
  "Draft a single-choice question for this folder with four distractors",
  "Improve my stem and suggest plausible wrong answers",
  "Suggest Bloom level, cognitive level, and tags for this item",
  "Write rationale and references for a clinical scenario question",
] as const

export function buildNewQuestionDraftLeoPrompt(input: {
  draftQuestionId: string
  formatLabel: string
  folderName?: string
  stem?: string
}): string {
  const parts = [
    `I'm in the new-question composer (draft id ${input.draftQuestionId}).`,
    `Question format: ${input.formatLabel}.`,
  ]
  if (input.folderName) parts.push(`Location folder: ${input.folderName}.`)
  const stem = input.stem?.trim()
  if (stem) parts.push(`Stem so far: "${stem}"`)
  else parts.push("The question stem is still empty.")
  parts.push(
    "Propose a complete draft I can paste into the composer: stem, type-specific answers, rationale, Bloom level, cognitive level, tags, and predicted difficulty. Ask one clarifying question if needed.",
  )
  return parts.join(" ")
}

/** Aligns with `useLeoThread` mock reply delay — inline composer draft UX. */
export const LEO_QUESTION_DRAFT_DELAY_MS = 3500

/** Fields Leo can populate inline on the new-question composer (demo mock). */
export type LeoQuestionDraftPatch = {
  leadIn?: string
  options?: {
    id: string
    text: string
    isCorrect: boolean
    rationale: string
  }[]
  rationale?: string
  references?: { id: string; citation: string }[]
  numericValue?: string
  numericTolerance?: string
  numericUnits?: string
  pairs?: { id: string; left: string; right: string }[]
  orderedItems?: { id: string; text: string }[]
  fillBlankAnswers?: { id: string; accepted: string }[]
  difficulty?: "easy" | "medium" | "hard"
  bloom?: string
  cogLevel?: string
  tags?: string[]
}

function leoFolderTag(folderName?: string): string {
  if (!folderName) return "leo-draft"
  const slug = folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug ? `leo-${slug}` : "leo-draft"
}

/** Demo draft payload applied after the thinking animation (no Ask Leo panel). */
export function buildMockLeoQuestionDraft(
  type: AuthoringQuestionType,
  folderName?: string,
): LeoQuestionDraftPatch {
  const tag = leoFolderTag(folderName)
  const baseTags = ["leo-draft", tag]

  switch (type) {
    case "mcq_multiple":
      return {
        leadIn:
          "Which outcomes apply when coordinating a multi-step workflow? Select all that apply.",
        options: [
          { id: "opt-leo-1", text: "Clear ownership for each step", isCorrect: true, rationale: "" },
          { id: "opt-leo-2", text: "Skipping validation to save time", isCorrect: false, rationale: "" },
          { id: "opt-leo-3", text: "Shared status visible to reviewers", isCorrect: true, rationale: "" },
          { id: "opt-leo-4", text: "Hiding audit history from admins", isCorrect: false, rationale: "" },
          { id: "opt-leo-5", text: "Documented handoff criteria", isCorrect: true, rationale: "" },
        ],
        rationale:
          "Strong workflows combine visible status, ownership, and handoff criteria — not shortcuts that bypass validation.",
        difficulty: "medium",
        bloom: "Analyze",
        cogLevel: "analysis",
        tags: baseTags,
      }
    case "true_false":
      return {
        leadIn:
          "A draft library item should remain invisible to respondents until it is published.",
        options: [
          { id: "opt-true", text: "True", isCorrect: true, rationale: "" },
          { id: "opt-false", text: "False", isCorrect: false, rationale: "" },
        ],
        rationale:
          "Draft and in-review states are author-facing only; published items are what respondents see.",
        difficulty: "easy",
        bloom: "Understand",
        cogLevel: "recall",
        tags: baseTags,
      }
    case "short_answer":
      return {
        leadIn: "What is the primary purpose of a question rationale field?",
        rationale:
          "Model answer: explain why the keyed response is correct and note acceptable variants (e.g. \"scoring notes\", \"grading notes\").",
        difficulty: "medium",
        bloom: "Understand",
        cogLevel: "recall",
        tags: baseTags,
      }
    case "numeric":
      return {
        leadIn: "If a process completes 3 of 4 required checkpoints, what fraction is complete?",
        numericValue: "0.75",
        numericTolerance: "0.01",
        numericUnits: "",
        rationale: "Three of four checkpoints ⇒ 3/4 = 0.75 within ±0.01 tolerance.",
        difficulty: "easy",
        bloom: "Apply",
        cogLevel: "application",
        tags: baseTags,
      }
    case "essay":
      return {
        leadIn:
          "Describe how you would validate a new assessment item before publishing it to the library.",
        rationale:
          "Rubric: (1) stem is unambiguous, (2) keyed answer or rubric is complete, (3) Bloom level matches intent, (4) peer review recorded.",
        difficulty: "hard",
        bloom: "Evaluate",
        cogLevel: "analysis",
        tags: baseTags,
      }
    case "fill_blank":
      return {
        leadIn:
          "Authors should add a {{blank}} so reviewers understand why the keyed response is correct.",
        fillBlankAnswers: [{ id: "blk-leo-1", accepted: "rationale" }],
        rationale: "Accepted: rationale (or scoring notes / grading notes).",
        difficulty: "medium",
        bloom: "Remember",
        cogLevel: "recall",
        tags: baseTags,
      }
    case "matching":
      return {
        leadIn: "Match each workflow state to its best description.",
        pairs: [
          { id: "pair-leo-1", left: "Draft", right: "Author-only; not eligible for use" },
          { id: "pair-leo-2", left: "In review", right: "Awaiting peer sign-off" },
          { id: "pair-leo-3", left: "Published", right: "Live for respondents" },
        ],
        rationale: "Each state maps to library visibility and review expectations.",
        difficulty: "medium",
        bloom: "Understand",
        cogLevel: "application",
        tags: baseTags,
      }
    case "ordering":
      return {
        leadIn: "Place the authoring steps in the order a coordinator typically follows.",
        orderedItems: [
          { id: "ord-leo-1", text: "Pick folder and question format" },
          { id: "ord-leo-2", text: "Write stem and keyed response" },
          { id: "ord-leo-3", text: "Add rationale and references" },
          { id: "ord-leo-4", text: "Submit for review" },
        ],
        rationale: "Folder/format first, then content, then metadata, then workflow handoff.",
        difficulty: "medium",
        bloom: "Apply",
        cogLevel: "application",
        tags: baseTags,
      }
    case "hotspot":
      return {
        leadIn:
          "On the reference diagram, select the region that represents the primary action control.",
        rationale:
          "Hotspot items need an image asset in production; this demo stem sets reviewer expectations.",
        difficulty: "medium",
        bloom: "Apply",
        cogLevel: "application",
        tags: baseTags,
      }
    case "mcq_single":
    default:
      return {
        leadIn:
          "Which practice best improves item quality before a question is published?",
        options: [
          { id: "opt-leo-1", text: "Peer review with a clear rationale", isCorrect: true, rationale: "" },
          { id: "opt-leo-2", text: "Publishing without a stem", isCorrect: false, rationale: "" },
          { id: "opt-leo-3", text: "Skipping Bloom alignment", isCorrect: false, rationale: "" },
          { id: "opt-leo-4", text: "One-word stems with no context", isCorrect: false, rationale: "" },
          { id: "opt-leo-5", text: "Hiding references from reviewers", isCorrect: false, rationale: "" },
        ],
        rationale:
          "Peer review plus rationale catches ambiguity early; the other options weaken bank quality.",
        references: [
          {
            id: "ref-leo-1",
            citation: "Internal library authoring guide — review checklist (demo).",
          },
        ],
        difficulty: "medium",
        bloom: "Apply",
        cogLevel: "application",
        tags: baseTags,
      }
  }
}
