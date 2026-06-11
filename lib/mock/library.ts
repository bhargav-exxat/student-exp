/**
 * Mock library items — replace with API in production.
 */

export type LibraryItemType = "multiple_choice" | "true_false" | "short_answer"
export type LibraryLevel = "easy" | "medium" | "hard"

/** Revised Bloom's taxonomy level (inspector / analytics). */
export type LibraryBloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create"

/** @deprecated Use `LibraryBloomLevel` — legacy tier strings still accepted on rows. */
export type LibraryTierLevel = LibraryBloomLevel

export interface LibraryItem extends Record<string, unknown> {
  id: string
  /** Stable human-facing identifier (catalog, search, citations). */
  questionId: string
  /** Short preview / stem */
  stem: string
  topic: string
  type: LibraryItemType
  difficulty: LibraryLevel
  author: string
  /** Work email for the primary author (demo; optional when API omits). */
  authorEmail?: string
  updatedAt: string
  /** Folder tree id (`lib/mock/library-folders.ts`). */
  folderId: string
  /** Multiple choice options (only for type: "multiple_choice") */
  options?: {
    text: string
    isCorrect?: boolean
  }[]
  /** Stable bank code for lists / inspector (e.g. PH-ANA-001). */
  itemCode?: string
  bloomLevel?: LibraryBloomLevel | string
  /** Topic-style tags for inspector (# displayed in UI). */
  tags?: string[]
  /** ISO-ish created date (inspector “Creator & history”). */
  createdAt?: string
  /** Display name for “Created by” when different from `author`. */
  createdBy?: string
  /** Last editor display name (inspector copy). */
  lastEditedBy?: string
  /** Precomposed “Last edited” line; overrides derived copy when set. */
  lastEditedSummary?: string
  /** Revision label e.g. v4 */
  version?: string
  examUsageCount?: number
  /** Point-biserial index (psychometrics preview). */
  pbi?: number
  /** Mean percent correct when used in assessments. */
  avgScoreCorrectPct?: number
  /** Where / when the item was last used on an exam. */
  lastUsedLabel?: string
  /** Starred outside the Favorites folder (list landing demo). */
  isStarred?: boolean
}

/** New mock rows — assign a unique `questionId` when creating client-side. */
export function newLibraryQuestionId(): string {
  return `LIB-NEW-${Date.now().toString(36).toUpperCase()}`
}

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: "q1",
    questionId: "LIB-2026-001",
    stem: "Item 01 — sample primary entry for the demo dataset.",
    topic: "Gait & Posture Analysis",
    type: "multiple_choice",
    difficulty: "medium",
    author: "Owner A",
    authorEmail: "owner.a@demo.exxat.io",
    updatedAt: "2026-03-28",
    folderId: "fld-favorites",
    itemCode: "LIB-2026-001",
    bloomLevel: "Understand",
    tags: ["Tag 1", "Tag 2", "Tag 3"],
    createdAt: "2024-11-02",
    createdBy: "Owner B",
    lastEditedBy: "Owner C",
    lastEditedSummary: "14 months ago · Owner C",
    version: "v4",
    examUsageCount: 22,
    pbi: 0.48,
    avgScoreCorrectPct: 88,
    lastUsedLabel: "Reference set · 14 months ago",
    options: [
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ],
  },
  {
    id: "q2",
    questionId: "LIB-2026-002",
    stem: "Item 02 — sample entry with a single inline action.",
    topic: "Manual Therapy Techniques",
    type: "true_false",
    difficulty: "easy",
    author: "Owner B",
    authorEmail: "owner.b@demo.exxat.io",
    updatedAt: "2026-03-27",
    folderId: "fld-skills-lab",
    isStarred: true,
    pbi: 0.55,
  },
  {
    id: "q3",
    questionId: "LIB-2026-003",
    stem: "Item 03 — short prompt entry for the catalog demo.",
    topic: "Neuroanatomy",
    type: "short_answer",
    difficulty: "hard",
    author: "Owner C",
    authorEmail: "owner.c@demo.exxat.io",
    updatedAt: "2026-03-26",
    folderId: "fld-neuro-anat",
    isStarred: true,
    pbi: 0.14,
  },
  {
    id: "q4",
    questionId: "LIB-2026-004",
    stem: "Item 04 — multi-option entry showing the picker pattern.",
    topic: "HIPAA & Confidentiality",
    type: "multiple_choice",
    difficulty: "medium",
    author: "Owner D",
    authorEmail: "owner.d@demo.exxat.io",
    updatedAt: "2026-03-25",
    folderId: "fld-hipaa",
    isStarred: true,
    pbi: 0.19,
    options: [
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ],
  },
  {
    id: "q5",
    questionId: "LIB-2026-005",
    stem: "Item 05 — short-answer entry pinned to the Favorites folder.",
    topic: "Gait & Posture Analysis",
    type: "short_answer",
    difficulty: "easy",
    author: "Owner A",
    authorEmail: "owner.a@demo.exxat.io",
    updatedAt: "2026-03-24",
    folderId: "fld-favorites",
  },
  {
    id: "q6",
    questionId: "LIB-2026-006",
    stem: "Item 06 — choice-list entry for the catalog demo.",
    topic: "Neuroanatomy",
    type: "multiple_choice",
    difficulty: "medium",
    author: "Owner E",
    authorEmail: "owner.e@demo.exxat.io",
    updatedAt: "2026-03-23",
    folderId: "fld-patient-eval",
    options: [
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ],
  },
  {
    id: "q7",
    questionId: "LIB-2026-007",
    stem: "Item 07 — boolean entry to show toggle-style answers.",
    topic: "Manual Therapy Techniques",
    type: "true_false",
    difficulty: "easy",
    author: "Owner B",
    authorEmail: "owner.b@demo.exxat.io",
    updatedAt: "2026-03-22",
    folderId: "fld-msk-manual",
  },
  {
    id: "q8",
    questionId: "LIB-2026-008",
    stem: "Item 08 — multi-option entry filed under Exercise Physiology.",
    topic: "Exercise Physiology",
    type: "multiple_choice",
    difficulty: "hard",
    author: "Owner C",
    authorEmail: "owner.c@demo.exxat.io",
    updatedAt: "2026-03-21",
    folderId: "fld-exercise-phys",
  },
  {
    id: "q9",
    questionId: "LIB-2026-009",
    stem: "Item 09 — quick true / false entry for the demo set.",
    topic: "HIPAA & Confidentiality",
    type: "true_false",
    difficulty: "medium",
    author: "Owner D",
    authorEmail: "owner.d@demo.exxat.io",
    updatedAt: "2026-03-20",
    folderId: "fld-hipaa",
  },
  {
    id: "q10",
    questionId: "LIB-2026-010",
    stem: "Item 10 — short-answer entry from Owner A.",
    topic: "Gait & Posture Analysis",
    type: "short_answer",
    difficulty: "hard",
    author: "Owner A",
    authorEmail: "owner.a@demo.exxat.io",
    updatedAt: "2026-03-19",
    folderId: "fld-skills-lab",
  },
  {
    id: "q11",
    questionId: "LIB-2026-011",
    stem: "Item 11 — true / false entry showing chip alignment.",
    topic: "Case Studies",
    type: "true_false",
    difficulty: "easy",
    author: "Owner E",
    authorEmail: "owner.e@demo.exxat.io",
    updatedAt: "2026-03-18",
    folderId: "fld-case-studies",
  },
  {
    id: "q12",
    questionId: "LIB-2026-012",
    stem: "Item 12 — short-answer entry for the catalog demo.",
    topic: "Neuroanatomy",
    type: "short_answer",
    difficulty: "medium",
    author: "Owner B",
    authorEmail: "owner.b@demo.exxat.io",
    updatedAt: "2026-03-17",
    folderId: "fld-neuro-anat",
  },
]
