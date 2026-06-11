"use client"

/**
 * Tokens & themes — visualizer primitives + token index.
 *
 * This module exports the building blocks consumed by `tokens-themes-client.tsx`
 * (which wires them into `PrimaryPageTemplate` + `ListPageTemplate`). It does
 * NOT render the page shell.
 *
 * Each category gets a representation that matches the token's nature:
 *
 *   | Tab          | Renders tokens as…                                            |
 *   |--------------|---------------------------------------------------------------|
 *   | Colors       | 56-px swatch (`background: var(--name)`)                      |
 *   | Gradients    | 96×40 fill swatch (paint-based, value usually multi-line)     |
 *   | Radius       | 64×64 muted box with `border-radius: var(--name)`             |
 *   | Size         | bar with `height: var(--name)` (scaled visually)              |
 *   | Shadow       | floating mini-card with `box-shadow: var(--name)`             |
 *   | Typography   | "Aa Sample" in `font-family: var(--name)`                     |
 *   | Motion       | a dot that translates on hover using `transition: var(--name)`|
 *   | Aliases      | `name → var(--target)` row (resolves the indirection)         |
 *   | Other        | raw text value                                                |
 *
 * All tiles share click-to-copy on the `var(--name)` reference. The token
 * index is the single source of truth: `packages/ui/tokens/hooks-index.json`.
 */

import * as React from "react"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"
import tokensIndex from "@exxatdesignux/ui/tokens/hooks-index.json"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tip } from "@/components/ui/tip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

/* ── Token index types ────────────────────────────────────────────────── */

export type TokenCategory =
  | "color"
  | "gradient"
  | "radius"
  | "size"
  | "shadow"
  | "typography"
  | "transition"
  | "alias"
  | "other"

export type TokenRecord = {
  namespace: string
  category: TokenCategory | string
  values: Record<string, string>
  tailwindUtilities?: string[]
  deprecated?: boolean
  deprecatedMessage?: string | null
}

type TokensIndex = {
  version: string
  tokenCount: number
  namespaces: string[]
  themeKeys: string[]
  tokens: Record<string, TokenRecord>
}

export const TOKENS_INDEX = tokensIndex as unknown as TokensIndex

/** First available theme value — used for the "raw value" text under each tile. */
export function primaryValueText(t: TokenRecord): string {
  return t.values.light ?? Object.values(t.values)[0] ?? ""
}

/* ── Category tab catalogue ────────────────────────────────────────────── */

export interface CategoryTabDef {
  id: TokenCategory
  label: string
  icon: string
  matches: (cat: string) => boolean
}

/**
 * URL value for "show everything". Centralised here so consumers (sidebar
 * drill-in, header subtitle, client query reader) all agree on the default.
 *
 * Lives next to `CATEGORY_TABS` because reading the active category from a
 * `URLSearchParams` (`readTokensCategory`) needs to validate against the same
 * tab list. Before the `SidebarDrillIn` rewrite these helpers lived in
 * `tokens-secondary-nav.tsx`; that file is gone.
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

export const CATEGORY_TABS: CategoryTabDef[] = [
  { id: "color",      label: "Colors",     icon: "fa-palette",                matches: (c) => c === "color" },
  { id: "gradient",   label: "Gradients",  icon: "fa-circle-half-stroke",     matches: (c) => c === "gradient" },
  { id: "radius",     label: "Radius",     icon: "fa-rectangle-vertical",     matches: (c) => c === "radius" },
  { id: "size",       label: "Size",       icon: "fa-ruler-horizontal",       matches: (c) => c === "size" },
  { id: "shadow",     label: "Shadow",     icon: "fa-clone",                  matches: (c) => c === "shadow" },
  { id: "typography", label: "Typography", icon: "fa-text-size",              matches: (c) => c === "typography" },
  { id: "transition", label: "Motion",     icon: "fa-wave-sine",              matches: (c) => c === "transition" },
  { id: "alias",      label: "Aliases",    icon: "fa-link",                   matches: (c) => c === "alias" },
  { id: "other",      label: "Other",      icon: "fa-hashtag",                matches: (c) => c === "other" },
]

/** Pre-compute counts per category — same shape `getTabCount(filterId)` expects. */
export const CATEGORY_COUNTS: Record<TokenCategory, number> = CATEGORY_TABS.reduce(
  (acc, tab) => { acc[tab.id] = 0; return acc },
  {} as Record<TokenCategory, number>,
)
export const DEPRECATED_COUNT = (() => {
  let n = 0
  for (const t of Object.values(TOKENS_INDEX.tokens)) {
    if (t.deprecated) n += 1
    for (const tab of CATEGORY_TABS) {
      if (tab.matches(t.category)) {
        CATEGORY_COUNTS[tab.id] += 1
        break
      }
    }
  }
  return n
})()

/* ── Theme switcher ────────────────────────────────────────────────────── */

export function TokensThemeSwitcher({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const value = mounted ? theme : "system"
  return (
    <RadioGroup
      value={value}
      onValueChange={setTheme}
      className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-card p-1", className)}
      aria-label="Theme preview"
    >
      {(["light", "dark", "system"] as const).map((t) => (
        <label
          key={t}
          htmlFor={`theme-${t}`}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
            "hover:bg-foreground/[0.04]",
            value === t && "bg-foreground/[0.06] text-foreground",
          )}
        >
          <RadioGroupItem value={t} id={`theme-${t}`} className="sr-only" />
          <i
            className={cn(
              "fa-light text-xs",
              t === "light" && "fa-sun",
              t === "dark" && "fa-moon",
              t === "system" && "fa-desktop",
            )}
            aria-hidden="true"
          />
          <span className="capitalize">{t}</span>
        </label>
      ))}
    </RadioGroup>
  )
}

/* ── Clipboard hook ────────────────────────────────────────────────────── */

export function useTokenClipboard() {
  const [copied, setCopied] = React.useState<string | null>(null)
  const copy = React.useCallback((text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1200)
    }).catch(() => {})
  }, [])
  return { copied, copy }
}

/* ── Tile shell ────────────────────────────────────────────────────────── */

interface TokenTileProps {
  name: string
  record: TokenRecord
  onCopy: (text: string) => void
  preview: React.ReactNode
  valueText?: string
  density?: "tight" | "wide"
}

function TokenTile({ name, record, onCopy, preview, valueText, density = "wide" }: TokenTileProps) {
  const cssRef = `var(${name})`
  const raw = valueText ?? primaryValueText(record)
  return (
    <div
      className={cn(
        "group flex items-stretch gap-3 rounded-md border border-border bg-card p-3 transition-colors",
        "hover:border-brand/40 hover:bg-interactive-hover-soft",
      )}
    >
      <div className={cn("shrink-0", density === "tight" ? "w-14" : "w-20")}>{preview}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <code className="font-mono text-xs text-foreground truncate tabular-nums">{name}</code>
          {record.deprecated && (
            <Badge variant="destructive" className="text-xs h-4 px-1.5 shrink-0">
              deprecated
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-sm bg-muted/60 px-1.5 py-0.5">{record.namespace}</span>
        </div>
        <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={raw}>
          {raw || "—"}
        </div>
      </div>
      <Tip side="left" label={`Copy ${cssRef}`}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 self-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onCopy(cssRef)}
          aria-label={`Copy ${cssRef}`}
        >
          <i className="fa-light fa-copy text-sm" aria-hidden="true" />
        </Button>
      </Tip>
    </div>
  )
}

/* ── Category-specific previews ───────────────────────────────────────── */

function ColorPreview({ name }: { name: string }) {
  return (
    <div
      className="size-14 rounded-md border border-border"
      style={{ backgroundColor: `var(${name})` }}
      aria-hidden="true"
    />
  )
}
function GradientPreview({ name }: { name: string }) {
  return (
    <div
      className="h-14 w-20 rounded-md border border-border"
      style={{ background: `var(${name})` }}
      aria-hidden="true"
    />
  )
}
function RadiusPreview({ name }: { name: string }) {
  return (
    <div
      className="size-14 border border-border bg-muted/50"
      style={{ borderRadius: `var(${name})` }}
      aria-hidden="true"
    />
  )
}
function SizePreview({ name, record }: { name: string; record: TokenRecord }) {
  const raw = primaryValueText(record)
  return (
    <div className="flex h-14 w-20 items-center justify-center" aria-hidden="true">
      <div
        className="w-full bg-brand rounded-sm"
        style={{ height: `min(56px, var(${name}))` }}
        title={raw}
      />
    </div>
  )
}
function ShadowPreview({ name }: { name: string }) {
  return (
    <div
      className="m-1 size-12 rounded-md bg-card"
      style={{ boxShadow: `var(${name})` }}
      aria-hidden="true"
    />
  )
}
function TypographyPreview({ name }: { name: string }) {
  return (
    <div
      className="flex h-14 w-20 items-center justify-center rounded-md border border-border bg-muted/30"
      style={{ fontFamily: `var(${name})` }}
      aria-hidden="true"
    >
      <span className="text-2xl text-foreground">Aa</span>
    </div>
  )
}
function MotionPreview({ name }: { name: string }) {
  return (
    <div className="relative h-14 w-20 overflow-hidden rounded-md border border-border bg-muted/30" aria-hidden="true">
      <div
        className="absolute left-2 top-1/2 size-3 -translate-y-1/2 rounded-full bg-brand group-hover:translate-x-12"
        style={{ transition: `var(${name})` }}
      />
    </div>
  )
}
function AliasPreview({ record }: { record: TokenRecord }) {
  const v = primaryValueText(record)
  const targetMatch = v.match(/var\((--[a-z0-9-]+)\)/i)
  const target = targetMatch?.[1]
  return (
    <div className="flex h-14 w-20 flex-col items-center justify-center rounded-md border border-border bg-muted/30 text-center" aria-hidden="true">
      <i className="fa-light fa-link text-base text-muted-foreground" />
      {target && (
        <code className="mt-0.5 truncate max-w-full px-1 font-mono text-xs text-muted-foreground">{target}</code>
      )}
    </div>
  )
}
function OtherPreview() {
  return (
    <div className="flex h-14 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground" aria-hidden="true">
      <i className="fa-light fa-hashtag text-base" />
    </div>
  )
}

/**
 * Pick the right visualizer for a token. Used both by the legacy `TokensCategoryGrid`
 * and by the DataTable Preview cell in `tokens-themes-client.tsx`.
 */
export function categoryPreview(name: string, record: TokenRecord): React.ReactNode {
  switch (record.category) {
    case "color":      return <ColorPreview name={name} />
    case "gradient":   return <GradientPreview name={name} />
    case "radius":     return <RadiusPreview name={name} />
    case "size":       return <SizePreview name={name} record={record} />
    case "shadow":     return <ShadowPreview name={name} />
    case "typography": return <TypographyPreview name={name} />
    case "transition": return <MotionPreview name={name} />
    case "alias":      return <AliasPreview record={record} />
    default:           return <OtherPreview />
  }
}

/* ── Category grid (the page body for one view tab) ───────────────────── */

export interface TokensCategoryGridProps {
  query: string
  showDeprecated: boolean
  category: CategoryTabDef
  onCopy: (text: string) => void
}

export function TokensCategoryGrid({ query, showDeprecated, category, onCopy }: TokensCategoryGridProps) {
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const out: Array<[string, TokenRecord]> = []
    for (const [name, record] of Object.entries(TOKENS_INDEX.tokens)) {
      if (!category.matches(record.category)) continue
      if (!showDeprecated && record.deprecated) continue
      if (q && !(name.toLowerCase().includes(q) || record.namespace.toLowerCase().includes(q))) continue
      out.push([name, record])
    }
    return out.sort(([a], [b]) => a.localeCompare(b))
  }, [query, showDeprecated, category])

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        No {category.label.toLowerCase()} tokens match your filter.
      </div>
    )
  }

  /** Colors are dense (100+ tokens) → 3-column on wide. Other categories 1–2 col. */
  const isDense = category.id === "color"
  return (
    <div
      className={cn(
        "grid gap-2",
        isDense
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2",
      )}
    >
      {filtered.map(([name, record]) => (
        <TokenTile
          key={name}
          name={name}
          record={record}
          onCopy={onCopy}
          density={isDense ? "tight" : "wide"}
          preview={categoryPreview(name, record)}
        />
      ))}
    </div>
  )
}
