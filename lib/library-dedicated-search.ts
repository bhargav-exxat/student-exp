import { patchLibraryUrlSearchParams } from "@/lib/library-nav"

/** Rotating example queries for dedicated search composers on list/find surfaces. */
export const LIBRARY_DEDICATED_SEARCH_PLACEHOLDERS = [
  "items tagged with Tag 1 and Manual Therapy",
  "everything Owner A edited this month",
  "PT 520 items tagged Gait & Posture",
  "find LIB-2026-001 and anything like it",
  "drafts from the most recent reference set",
  "Type 1 items I still need for the demo block",
] as const

export function patchLibraryDedicatedSearchParams(
  current: URLSearchParams,
  submittedText: string,
): URLSearchParams {
  const t = submittedText.trim()
  return patchLibraryUrlSearchParams(current, { q: t || null })
}
