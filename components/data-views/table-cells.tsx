"use client"

/**
 * Reusable `DataTable` / `HubTable` cell primitives — extracted from
 * `columns-showcase.tsx` so every hub composes its grid from the same set of
 * named, accessible, copy-paste-free renderers.
 *
 * **Why this module exists.** Without a shared home, each hub would re-derive
 * progress bars, currency formatting, rating stars, attachment chips, relative
 * times, etc. — drifting in spacing, color, and a11y treatment. These cells
 * pair color + glyph (WCAG 1.4.1), keep tabular numbers right-aligned, and
 * expose a focusable `Tip` for any glyph-only signal.
 *
 * **Composition only.** Every renderer is a pure composition of existing
 * primitives (`@/components/ui/*`, `@/components/list-hub-status-badge`,
 * `Intl` formatters, Font Awesome icon classes). No new design tokens, no new
 * package surface — drop these into any `ColumnDef<TRow>['cell']`.
 *
 * **Live catalog:** `apps/web/components/columns-showcase.tsx` (hosted at
 * `/columns`) renders every export below as its own column so designers,
 * engineers, and AI agents can see the cell in situ before picking it.
 *
 * **Skill reference:** `.cursor/skills/exxat-token-economy/SKILL.md` §3 names
 * each export below in its "primitive aliases" table so the AI imports
 * directly instead of re-implementing.
 */

import * as React from "react"
import { AvatarGroup, AvatarGroupCount, AvatarInitials } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { cn } from "@/lib/utils"

/* ────────────────────────────────────────────────────────────────────────── *
 * Shared helpers
 * ────────────────────────────────────────────────────────────────────────── */

const EMPTY_DASH = (
  <span className="text-sm text-muted-foreground" aria-hidden="true">
    —
  </span>
)

/** Truthy-only dash with an accessible label so screen-reader users get a hint
 *  for "no value" cells across every hub. */
function EmptyCell({ label = "No value" }: { label?: string }) {
  return (
    <span className="text-sm text-muted-foreground" aria-label={label}>
      —
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Numeric / monetary
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Right-aligned plain numeric cell. Use for counts where the grid benefits
 * from column-aligned digits (attempts, downloads, file size N).
 */
export function NumericCell({
  value,
  fractionDigits = 0,
  className,
}: {
  value: number | null | undefined
  fractionDigits?: number
  className?: string
}) {
  if (value == null || Number.isNaN(value)) return <EmptyCell />
  return (
    <span className={cn("block text-right text-sm tabular-nums text-foreground", className)}>
      {Number(value).toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}
    </span>
  )
}

/**
 * Currency cell — right-aligned, `tabular-nums`. `Intl.NumberFormat` honors
 * locale + currency; defaults to USD because the product is US-first.
 */
export function CurrencyCell({
  value,
  currency = "USD",
  locale = "en-US",
  maximumFractionDigits = 2,
}: {
  value: number | null | undefined
  currency?: string
  locale?: string
  maximumFractionDigits?: number
}) {
  if (value == null || Number.isNaN(value)) return <EmptyCell label="No amount" />
  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  })
  return (
    <span className="block text-right text-sm tabular-nums text-foreground">
      {fmt.format(value)}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Progress + signal
 * ────────────────────────────────────────────────────────────────────────── */

export type ProgressTone = "auto" | "success" | "warning" | "danger" | "info"

/**
 * Progress bar — track + filled fill + numeric label. Auto-tones in thirds:
 * <34% destructive, <67% warning, ≥67% success. Pass an explicit `tone` to
 * override (e.g. "info" for non-judgmental quantity bars).
 */
export function ProgressCell({
  value,
  max = 100,
  tone = "auto",
  label,
  className,
}: {
  value: number | null | undefined
  max?: number
  tone?: ProgressTone
  /** Right-side label. Defaults to `${pct}%`. Pass `false` to hide. */
  label?: React.ReactNode | false
  className?: string
}) {
  if (value == null || Number.isNaN(value)) return <EmptyCell label="No progress" />
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  const autoTone =
    pct < 34 ? "bg-destructive" :
    pct < 67 ? "bg-amber-500"   :
               "bg-emerald-500"
  const toneClass =
    tone === "success" ? "bg-emerald-500" :
    tone === "warning" ? "bg-amber-500"   :
    tone === "danger"  ? "bg-destructive" :
    tone === "info"    ? "bg-primary"     :
                         autoTone
  const labelNode =
    label === false ? null :
    label ?? <span className="text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
  return (
    <div className={cn("flex min-w-[140px] max-w-[180px] flex-col gap-1.5", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Progress ${pct} percent`}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", toneClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {labelNode}
    </div>
  )
}

export type SignalTone = "success" | "warning" | "danger" | "info" | "neutral"

/**
 * Three-bar signal indicator — same metaphor as Wi-Fi / cellular bars. Use
 * for ordinal scales (low/medium/high; easy/medium/hard). Color is *paired*
 * with bar count so the cell still communicates on monochrome + forced-colors.
 */
export function SignalBarsCell({
  level,
  max = 3,
  tone = "info",
  label,
}: {
  /** 1-indexed level. */
  level: number
  /** Total number of bars. Default 3. */
  max?: number
  tone?: SignalTone
  /** Accessible name; also used as the `Tip` content. */
  label: string
}) {
  const lvl = Math.max(0, Math.min(max, Math.round(level)))
  const toneClass =
    tone === "success" ? "bg-emerald-500" :
    tone === "warning" ? "bg-amber-500"   :
    tone === "danger"  ? "bg-destructive" :
    tone === "info"    ? "bg-primary"     :
                         "bg-foreground"
  return (
    <Tip side="top" label={label}>
      <span
        className="inline-flex items-end gap-0.5 cursor-default"
        role="img"
        aria-label={label}
        tabIndex={0}
      >
        {Array.from({ length: max }, (_, i) => {
          const bar = i + 1
          const filled = bar <= lvl
          // Stair-step the heights so the metaphor reads visually.
          const heightClass =
            bar === 1 ? "h-2" :
            bar === 2 ? "h-3" :
            bar === 3 ? "h-4" :
                        "h-5"
          return (
            <span
              key={bar}
              className={cn("w-1 rounded-sm", filled ? toneClass : "bg-muted", heightClass)}
              aria-hidden="true"
            />
          )
        })}
      </span>
    </Tip>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * People
 * ────────────────────────────────────────────────────────────────────────── */

export interface PersonStub {
  name: string
  initials: string
}

/**
 * Face rail — list of people with a `+N more` overflow chip. Each face gets a
 * `Tip` of the person's name; the overflow chip's tip lists the hidden names.
 * Uses non-overlapping avatars (gap, not negative margin) per Exxat DS rule.
 */
export function PeopleAvatarRailCell({
  people,
  visibleMax = 3,
  size = "sm",
  emptyLabel = "No people",
}: {
  people: PersonStub[] | undefined
  /** How many faces to show before `+N`. Default 3. */
  visibleMax?: number
  size?: "sm" | "md"
  emptyLabel?: string
}) {
  if (!people?.length) return <EmptyCell label={emptyLabel} />
  const visible = people.slice(0, visibleMax)
  const overflow = people.length - visible.length
  const sizeClass = size === "md" ? "size-7 text-xs" : "size-6 text-xs"
  return (
    <AvatarGroup data-size={size} className="gap-1">
      {visible.map((p) => (
        <Tip key={`${p.name}-${p.initials}`} side="top" label={p.name}>
          <AvatarInitials
            initials={p.initials}
            className={sizeClass}
            fallbackClassName="text-xs"
          />
        </Tip>
      ))}
      {overflow > 0 && (
        <Tip side="top" label={people.slice(visibleMax).map((p) => p.name).join(", ")}>
          <AvatarGroupCount
            tabIndex={0}
            aria-label={`${overflow} more${overflow === 1 ? "" : "s"}`}
            className={sizeClass}
          >
            +{overflow}
          </AvatarGroupCount>
        </Tip>
      )}
    </AvatarGroup>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Pills + chips
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Outlined pill with a leading FA icon — the "Type" pattern. Use for
 * single-select categorical fields where color isn't carrying meaning
 * (otherwise reach for `ListHubStatusBadge`).
 */
export function PillCell({
  label,
  icon,
  iconClassName,
  className,
}: {
  label: React.ReactNode
  /** FA glyph name without the family prefix, e.g. `"fa-list-check"`. */
  icon?: string
  iconClassName?: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 border-border bg-background px-2 text-xs font-medium",
        className,
      )}
    >
      {icon ? (
        <i
          className={cn("fa-light text-[11px] text-muted-foreground", icon, iconClassName)}
          aria-hidden="true"
        />
      ) : null}
      <span className="text-foreground">{label}</span>
    </Badge>
  )
}

/**
 * Tag list with `+N` overflow. Use for free-form keyword tags (`#tag`). For
 * categorical pills, see `PillCell`; for status, see `ListHubStatusBadge`.
 */
export function TagListCell({
  tags,
  visibleMax = 2,
  formatLabel = (t) => `#${t}`,
}: {
  tags: string[] | undefined
  visibleMax?: number
  formatLabel?: (tag: string) => string
}) {
  if (!tags?.length) return <EmptyCell label="No tags" />
  const visible = tags.slice(0, visibleMax)
  const overflow = tags.length - visible.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <Badge
          key={t}
          variant="secondary"
          className="h-5 px-1.5 text-[11px] font-medium leading-none"
        >
          {formatLabel(t)}
        </Badge>
      ))}
      {overflow > 0 && (
        <Tip side="top" label={tags.slice(visibleMax).map(formatLabel).join(", ")}>
          <span
            className="inline-flex h-5 cursor-default items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-medium leading-none text-muted-foreground"
            tabIndex={0}
            aria-label={`${overflow} more tag${overflow === 1 ? "" : "s"}`}
          >
            +{overflow}
          </span>
        </Tip>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Rating
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Star rating — N of `max` FA stars + numeric value. Color (amber) + glyph
 * change (solid vs. light) pair so the cell still reads on monochrome /
 * forced-colors modes (WCAG 1.4.1).
 */
export function RatingCell({
  value,
  max = 5,
  showValue = true,
}: {
  value: number | null | undefined
  max?: number
  showValue?: boolean
}) {
  if (value == null || Number.isNaN(value)) return <EmptyCell label="No rating" />
  const n = Math.max(0, Math.min(max, Math.round(value)))
  const label = `Rated ${n} of ${max}`
  return (
    <Tip side="top" label={label}>
      <span
        role="img"
        aria-label={label}
        tabIndex={0}
        className="inline-flex items-center gap-1 rounded-md cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="inline-flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => {
            const filled = i < n
            return (
              <i
                key={i}
                className={cn(
                  filled ? "fa-solid text-amber-500" : "fa-light text-muted-foreground/50",
                  "fa-star text-[11px]",
                )}
              />
            )
          })}
        </span>
        {showValue ? (
          <span className="text-xs tabular-nums text-muted-foreground">{n}.0</span>
        ) : null}
      </span>
    </Tip>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Booleans
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Inline toggle — `ToggleSwitch` for a boolean lifecycle field (Published,
 * Active, Enabled). The callback receives the *next* checked state; the cell
 * stops row click propagation so toggling never opens the row.
 *
 * `ToggleSwitch` does not currently support a `disabled` state — if you need
 * to lock a row's toggle, render a static badge (`PillCell` with the current
 * state) instead.
 */
export function BooleanToggleCell({
  checked,
  onChange,
  labelOn = "On — click to turn off",
  labelOff = "Off — click to turn on",
}: {
  checked: boolean
  onChange: (next: boolean) => void
  labelOn?: string
  labelOff?: string
}) {
  return (
    <Tip side="top" label={checked ? labelOn : labelOff}>
      <span
        className="inline-flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <ToggleSwitch
          checked={checked}
          onChange={() => onChange(!checked)}
        />
      </span>
    </Tip>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Attachments / links / time
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Attachment indicator — paperclip + count chip; muted dash when zero. A
 * focusable `Tip` exposes the count for screen-reader users; the chip is
 * non-interactive — wire `onClick` from the column def if you need a popover.
 */
export function AttachmentCountCell({
  count,
}: {
  count: number | null | undefined
}) {
  if (!count) return <EmptyCell label="No files" />
  const labelText = `${count} attachment${count === 1 ? "" : "s"}`
  return (
    <Tip side="top" label={labelText}>
      <span
        className="inline-flex h-6 cursor-default items-center gap-1 rounded-md border border-border bg-background px-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="img"
        aria-label={labelText}
        tabIndex={0}
      >
        <i className="fa-light fa-paperclip text-[11px] text-muted-foreground" aria-hidden="true" />
        <span className="tabular-nums">{count}</span>
      </span>
    </Tip>
  )
}

/**
 * External link — truncated host label + `fa-arrow-up-right-from-square` mark.
 * Opens in a new tab with `noopener`; full URL surfaces in the `Tip`. The link
 * stops row click propagation so it never collides with the row's `onClick`.
 */
export function ExternalLinkCell({
  url,
  label,
  className,
}: {
  url: string | null | undefined
  /** Override the host-only label (e.g. "View source"). */
  label?: React.ReactNode
  className?: string
}) {
  if (!url) return <EmptyCell label="No link" />
  let host = url
  try {
    host = new URL(url).hostname.replace(/^www\./, "")
  } catch {
    /* keep the raw url */
  }
  return (
    <Tip side="top" label={url}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex max-w-[180px] items-center gap-1 truncate rounded text-sm text-foreground transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <span className="truncate">{label ?? host}</span>
        <i className="fa-light fa-arrow-up-right-from-square text-[11px] text-muted-foreground" aria-hidden="true" />
      </a>
    </Tip>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Time
 * ────────────────────────────────────────────────────────────────────────── */

const RELATIVE_FMT = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })
const ABS_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatRelativeAndAbsolute(
  iso: string,
  now: number = Date.now(),
): { relative: string; absolute: string } | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const diffSec = Math.round((d.getTime() - now) / 1000)
  const abs = Math.abs(diffSec)
  let unit: Intl.RelativeTimeFormatUnit
  let value: number
  if      (abs < 60)         { unit = "second"; value = diffSec }
  else if (abs < 3600)       { unit = "minute"; value = Math.round(diffSec / 60) }
  else if (abs < 86400)      { unit = "hour";   value = Math.round(diffSec / 3600) }
  else if (abs < 86400 * 7)  { unit = "day";    value = Math.round(diffSec / 86400) }
  else if (abs < 86400 * 30) { unit = "week";   value = Math.round(diffSec / (86400 * 7)) }
  else if (abs < 86400 * 365){ unit = "month";  value = Math.round(diffSec / (86400 * 30)) }
  else                       { unit = "year";   value = Math.round(diffSec / (86400 * 365)) }
  return { relative: RELATIVE_FMT.format(value, unit), absolute: ABS_FMT.format(d) }
}

/**
 * Relative time — "3 hours ago" / "2 days ago" with a `Tip` exposing the
 * absolute timestamp on hover/focus. The visible label is the relative form
 * so scanning readers see recency at a glance.
 */
export function RelativeTimeCell({
  iso,
  now,
}: {
  iso: string | null | undefined
  /** Override "now" for deterministic snapshots. */
  now?: number
}) {
  if (!iso) return <EmptyCell label="No date" />
  const fmt = formatRelativeAndAbsolute(iso, now)
  if (!fmt) return <EmptyCell label="Invalid date" />
  return (
    <Tip side="top" label={fmt.absolute}>
      <span
        className="inline-block text-sm text-foreground/90 whitespace-nowrap rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
      >
        {fmt.relative}
      </span>
    </Tip>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Row actions ⋯
 * ────────────────────────────────────────────────────────────────────────── */

export interface RowActionDef<TRow> {
  label: string
  /** FA glyph name without the family prefix, e.g. `"fa-pen-to-square"`. */
  icon: string
  onSelect: (row: TRow) => void
  /** Render as the destructive variant — separator + red label. */
  variant?: "destructive"
  /** Optional menu-item keyboard shortcut hint (e.g. `"⌘E"`). */
  shortcut?: string
  /** Disable the item without hiding it. */
  disabled?: boolean
}

/**
 * Row overflow `⋯` menu — generic across hubs. Pass the row and an array of
 * `{ label, icon, onSelect, variant?, shortcut? }`; destructive items
 * automatically gain a separator above. The trigger keeps an `aria-label` so
 * the button is named for screen readers.
 */
export function RowActionsCell<TRow>({
  row,
  actions,
  triggerLabel = "More options",
  align = "end",
}: {
  row: TRow
  actions: RowActionDef<TRow>[]
  /** Both the `Tip` content and the `aria-label` fallback. */
  triggerLabel?: string
  align?: "start" | "center" | "end"
}) {
  return (
    <DropdownMenu>
      <Tip side="top" label={triggerLabel}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={triggerLabel}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align={align}>
        {actions.map((a, i) => {
          const prev = actions[i - 1]
          const needsSeparator =
            a.variant === "destructive" && prev && prev.variant !== "destructive"
          return (
            <React.Fragment key={a.label}>
              {needsSeparator ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onSelect={() => a.onSelect(row)}
                disabled={a.disabled}
                shortcut={a.shortcut}
                className={a.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
              >
                <i className={`fa-light ${a.icon}`} aria-hidden="true" />
                {a.label}
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Exports — see `columns-showcase.tsx` for the live catalog.
 * ────────────────────────────────────────────────────────────────────────── */

export { EMPTY_DASH }
