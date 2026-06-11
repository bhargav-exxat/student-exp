"use client"

/**
 * Tokens secondary navigation — the body of the `tokens` panel.
 *
 * Same shape as `LibrarySecondaryNav` but simpler — flat list of
 * categories. URL scope: `?category=color|gradient|radius|…` (default = `all`).
 *
 * Compact mode (icon rail) and expanded mode share the same active-state
 * logic. Clicking the active row while already on the same href reopens the
 * panel (in case it was collapsed) — matching the Library "All
 * questions" reopen behavior.
 */

import * as React from "react"
import { Link } from "@/lib/router-compat"
import { usePathname, useSearchParams } from "@/lib/router-compat"

import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import { useSecondaryPanel } from "@/components/sidebar"
import {
  CATEGORY_TABS,
  CATEGORY_COUNTS,
  TOKENS_INDEX,
  type TokenCategory,
} from "@/components/tokens-themes-section"

/**
 * URL value for "show everything". Centralized so consumers (panel + client +
 * page header subtitle) all agree on the canonical default.
 */
export const TOKENS_ALL_CATEGORY = "all" as const

export type TokensCategoryParam = "all" | TokenCategory

/** Read the active category from a `URLSearchParams`. Falls back to `"all"`. */
export function readTokensCategory(params: URLSearchParams | null): TokensCategoryParam {
  const raw = (params?.get("category") ?? "").toLowerCase()
  if (raw === TOKENS_ALL_CATEGORY) return TOKENS_ALL_CATEGORY
  const match = CATEGORY_TABS.find((c) => c.id === raw)
  return match ? (match.id as TokenCategory) : TOKENS_ALL_CATEGORY
}

interface CategoryEntry {
  id: TokensCategoryParam
  label: string
  icon: string
  count: number
}

const CATEGORY_ENTRIES: CategoryEntry[] = [
  {
    id: TOKENS_ALL_CATEGORY,
    label: "All tokens",
    icon: "fa-grid-2",
    count: TOKENS_INDEX.tokenCount,
  },
  ...CATEGORY_TABS.filter((c) => CATEGORY_COUNTS[c.id] > 0).map((c) => ({
    id: c.id as TokensCategoryParam,
    label: c.label,
    icon: c.icon,
    count: CATEGORY_COUNTS[c.id],
  })),
]

/** Build `?category=…` URL preserving the current pathname (tokens hub). */
function tokensCategoryHref(pathname: string, id: TokensCategoryParam): string {
  if (id === TOKENS_ALL_CATEGORY) return pathname
  return `${pathname}?category=${encodeURIComponent(id)}`
}

function CategoryRow({
  entry,
  active,
  onActiveClick,
}: {
  entry: CategoryEntry
  active: boolean
  onActiveClick: () => void
}) {
  const pathname = usePathname()
  const href = tokensCategoryHref(pathname, entry.id)
  return (
    <li className="min-w-0">
      <Link
        href={href}
        scroll={false}
        onClick={() => { if (active) onActiveClick() }}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        )}
      >
        <span className="size-4 shrink-0 text-center text-[13px] leading-none" aria-hidden="true">
          <i className={cn(active ? "fa-solid" : "fa-light", entry.icon)} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
        <span
          className={cn(
            "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
            active ? "bg-foreground/10 text-sidebar-accent-foreground" : "bg-muted/60 text-muted-foreground",
          )}
        >
          {entry.count}
        </span>
      </Link>
    </li>
  )
}

function IconCategoryRow({
  entry,
  active,
  onActiveClick,
}: {
  entry: CategoryEntry
  active: boolean
  onActiveClick: () => void
}) {
  const pathname = usePathname()
  const href = tokensCategoryHref(pathname, entry.id)
  return (
    <li className="flex w-full justify-center" role="none">
      <Tip label={`${entry.label} (${entry.count})`} side="right">
        <Link
          href={href}
          scroll={false}
          onClick={() => { if (active) onActiveClick() }}
          aria-current={active ? "page" : undefined}
          aria-label={entry.label}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <span className="text-center text-[15px] leading-none" aria-hidden="true">
            <i className={cn(active ? "fa-solid" : "fa-light", entry.icon)} aria-hidden="true" />
          </span>
        </Link>
      </Tip>
    </li>
  )
}

export function TokensSecondaryNav() {
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const { openPanel, secondaryPanelCompact } = useSecondaryPanel()

  const active = React.useMemo(
    () => readTokensCategory(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )

  const onActiveClick = React.useCallback(() => openPanel("tokens"), [openPanel])

  if (secondaryPanelCompact) {
    return (
      <ul className="flex flex-col gap-1 px-1 py-3" role="list">
        {CATEGORY_ENTRIES.map((entry) => (
          <IconCategoryRow
            key={entry.id}
            entry={entry}
            active={entry.id === active}
            onActiveClick={onActiveClick}
          />
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-0.5 px-3 pb-4" role="list">
      {CATEGORY_ENTRIES.map((entry) => (
        <CategoryRow
          key={entry.id}
          entry={entry}
          active={entry.id === active}
          onActiveClick={onActiveClick}
        />
      ))}
    </ul>
  )
}
