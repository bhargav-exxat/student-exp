/**
 * Derived labels for the library inspector (mock — replace with API fields).
 */

import type { LibraryLevel, LibraryItem, LibraryItemType } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { collectFolderDescendantIds } from "@/lib/mock/library-folders"

export const QUESTION_TYPE_ABBREV: Record<LibraryItemType, string> = {
  multiple_choice: "Choice",
  true_false: "Toggle",
  short_answer: "Short text",
}

export function deriveQuestionItemCode(q: LibraryItem): string {
  const raw = q.itemCode?.trim()
  if (raw) return raw
  return q.questionId
}

const LEGACY_TIER_TO_BLOOM: Record<string, string> = {
  "Tier 1": "Remember",
  "Tier 2": "Understand",
  "Tier 3": "Apply",
  "Tier 4": "Analyze",
  "Tier 5": "Evaluate",
  "Tier 6": "Create",
}

export function normalizeBloomLevel(label: string): string {
  const trimmed = label.trim()
  return LEGACY_TIER_TO_BLOOM[trimmed] ?? trimmed
}

export function deriveBloomLevel(q: LibraryItem): string {
  if (q.bloomLevel && String(q.bloomLevel).trim()) {
    return normalizeBloomLevel(String(q.bloomLevel))
  }
  switch (q.difficulty) {
    case "easy":
      return "Remember"
    case "medium":
      return "Understand"
    case "hard":
      return "Apply"
    default:
      return "Understand"
  }
}

/** Relative “last edited” clause when `lastEditedSummary` is absent. */
export function deriveLastEditedLine(q: LibraryItem): string {
  if (q.lastEditedSummary?.trim()) return q.lastEditedSummary.trim()
  const editor = q.lastEditedBy ?? q.author
  const d = new Date(q.updatedAt)
  if (Number.isNaN(d.getTime())) return `Updated · ${editor}`
  const ms = Date.now() - d.getTime()
  const days = Math.floor(ms / (86400 * 1000))
  if (days < 1) return `Today · ${editor}`
  if (days < 14) return `${days} days ago · ${editor}`
  const months = Math.floor(days / 30)
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} ago · ${editor}`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? "" : "s"} ago · ${editor}`
}

export function deriveTags(q: LibraryItem): string[] {
  if (q.tags && q.tags.length > 0) return q.tags
  return [q.topic].filter(Boolean)
}

/** Bloom row order for folder aggregate charts. */
export const BLOOM_LEVEL_ORDER = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
] as const

export function questionsInFolderSubtree(
  folders: LibraryFolder[],
  questions: LibraryItem[],
  folderId: string,
): LibraryItem[] {
  const scope = collectFolderDescendantIds(folders, folderId)
  return questions.filter(q => scope.has(q.folderId))
}

export interface FolderQuestionAggregate {
  totalQuestions: number
  difficulty: Record<LibraryLevel, number>
  /** Counts keyed by Bloom label (includes derived levels). */
  bloom: Record<string, number>
  avgPbi: number | null
  scoredCount: number
}

export function aggregateFolderQuestions(rows: LibraryItem[]): FolderQuestionAggregate {
  const difficulty: Record<LibraryLevel, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  }
  const bloom: Record<string, number> = {}
  for (const label of BLOOM_LEVEL_ORDER) bloom[label] = 0
  const pbis: number[] = []
  for (const q of rows) {
    difficulty[q.difficulty]++
    const bl = deriveBloomLevel(q)
    bloom[bl] = (bloom[bl] ?? 0) + 1
    if (typeof q.pbi === "number" && !Number.isNaN(q.pbi)) pbis.push(q.pbi)
  }
  const scoredCount = pbis.length
  const avgPbi = scoredCount ? pbis.reduce((a, n) => a + n, 0) / scoredCount : null
  return {
    totalQuestions: rows.length,
    difficulty,
    bloom,
    avgPbi,
    scoredCount,
  }
}
