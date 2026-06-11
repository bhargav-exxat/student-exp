/**
 * Shared status chip tints + dashboard task-priority chips.
 *
 * **Rendering primitive:** `ListHubStatusBadge` (`components/list-hub-status-badge.tsx`)
 * for any status chip on a list hub. Map your domain statuses onto
 * `LIST_HUB_STATUS_TINT_*` below before introducing new colors.
 *
 * **Reference consumers:** `columns-showcase.tsx` (catalog),
 * `library-board-view.tsx` (board card status row), `task-priority-badge.tsx`
 * (dashboard task chips).
 *
 * **Icon-on-tinted-disc** (insights / activity rows): `TintedIconDisc` + `--icon-disc-*`
 * in `app/globals.css`.
 *
 * Labels stay **sentence / title case** (e.g. "Due soon", "Under review"). Do **not**
 * add `uppercase`.
 */

// ─── Semantic variants (reuse for every entity) ─────────────────────────────
//
// Light washes (same visual weight as before) + darker ink via `--chip-*` for WCAG 1.4.3.
// Backgrounds stay subtle; contrast is carried by label + icon color, not heavier fills.

export const LIST_HUB_STATUS_TINT_SUCCESS =
  "bg-emerald-500/15 text-[var(--chip-2)] border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200"

export const LIST_HUB_STATUS_TINT_WARNING =
  "bg-amber-500/15 text-[var(--chip-4)] border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-100"

export const LIST_HUB_STATUS_TINT_NEUTRAL =
  "bg-slate-500/10 text-[var(--chip-3)] border-border dark:bg-slate-500/10 dark:text-slate-300"

export const LIST_HUB_STATUS_TINT_DANGER =
  "bg-destructive/15 text-[var(--chip-destructive)] border-destructive/20 dark:bg-destructive/15 dark:text-red-200"

/** In-progress / review — distinct from warning when both appear together (e.g. "Under review"). */
export const LIST_HUB_STATUS_TINT_INFO =
  "bg-sky-500/15 text-[var(--chip-1)] border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-100"

// ─── Dashboard task priority ────────────────────────────────────────────────

export type TaskPriorityLevel = "high" | "medium" | "low"

export const TASK_PRIORITY_LABEL: Record<TaskPriorityLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export const TASK_PRIORITY_BADGE_CLASS: Record<TaskPriorityLevel, string> = {
  high: LIST_HUB_STATUS_TINT_DANGER,
  medium: LIST_HUB_STATUS_TINT_WARNING,
  low: LIST_HUB_STATUS_TINT_NEUTRAL,
}

export function normalizeTaskPriority(priority: string): TaskPriorityLevel | null {
  const k = priority.toLowerCase()
  if (k === "high" || k === "medium" || k === "low") return k
  return null
}
