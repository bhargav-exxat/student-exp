"use client"

/**
 * ProductWordmark + ProductMark — render any product brand as a logo.
 *
 * - `ProductWordmark` renders `${prefix} ${suffix}` as HTML text:
 *   • `prefix` (e.g. "Exxat") in `font-sans` extra-bold (Inter 800), neutral.
 *   • `suffix` (e.g. "One" / "Prism" / "Pulse") in **Ivy Presto Italic**
 *     (`var(--font-heading)`, Adobe Fonts kit `wuk5wqn` preloaded in
 *     `app/layout.tsx`) tinted with `brandColor`.
 *
 *   We render real font glyphs rather than baked-in SVG paths so a new product
 *   only needs `{ prefix, suffix, brandColor }` — no path-tracing required.
 *
 * - `ProductMark` renders the same "E"-style circular mark used by Exxat,
 *   recolored with the brand's gradient / fill. The SVG geometry stays
 *   constant so existing layouts keep working.
 *
 * `variant="mutedSuffix"` (sidebar / switcher): prefix recedes in dark mode;
 * suffix always uses `wordmarkColor` (Exxat pink) for brand recognition.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ProductBrandConfig } from "@/lib/product-brand"

export type ProductWordmarkVariant = "default" | "mutedSuffix"

export interface ProductWordmarkProps {
  config: ProductBrandConfig
  variant?: ProductWordmarkVariant
  className?: string
}

/* ── Wordmark ──────────────────────────────────────────────────────────────── */

/**
 * Inline product wordmark. Sizing is height-driven — the parent sets the
 * height (e.g. `className="h-7"`) and the text scales via `text-[...]`
 * derived from `--wordmark-size` (set inline from the rendered font-size).
 *
 * Use `aria-hidden` because the wordmark is decorative — pair it with an
 * `aria-label` on the trigger/link (see {@link productBrandLabel}).
 */
export function ProductWordmark({
  config,
  variant: _variant = "default",
  className,
}: ProductWordmarkProps) {
  const prefix = config.prefix ?? "Exxat"
  const { suffix, brandColor, wordmarkColor } = config
  const suffixColor = wordmarkColor ?? brandColor

  return (
    <span
      aria-hidden="true"
      data-product-wordmark
      data-product-id={config.id}
      className={cn(
        // Inline-flex so it sits on a text baseline; whitespace-nowrap so the
        // suffix never wraps under the prefix at narrow widths.
        "inline-flex items-baseline whitespace-nowrap leading-none select-none",
        // Sized **relative to the inherited font-size** so the wordmark always
        // dominates whatever surface hosts it. The parent (`ProductLogo` /
        // `ExxatProductLogo`) pins `text-base` (16 px) → this resolves to
        // ~28 px wordmark text (~20 px cap), matching the cap-to-render-height
        // ratio in the standalone Exxat brand assets (~0.72; image dims 446×124
        // with ~89 px caps). Slight (~1 px) overflow against a 28 px parent
        // height is acceptable — sidebar / switcher slots use `overflow-visible`.
        "text-[1.78em] tracking-tight",
        // Vertically centre the **cap mid-line** on the parent's mid-line.
        // Without this nudge the cap sits ~9 % of font-size above span centre
        // because Inter / Ivy Presto baseline metrics put glyphs in the upper
        // portion of the line box. 0.09 em moves the cap centre down by that
        // exact offset so it shares an axis with the mark centre.
        "translate-y-[0.09em]",
        className,
      )}
    >
      <span
        className={cn(
          "font-sans font-extrabold",
          // Neutral wordmark prefix: deep slate on light, soft cool grey on dark.
          // Tokenized — see `--exxat-color-wordmark-ink-*` in packages/ui/src/globals.css.
          "text-[var(--exxat-color-wordmark-ink-light)] dark:text-[var(--exxat-color-wordmark-ink-dark)]",
        )}
      >
        {prefix}
      </span>
      <span
        data-product-wordmark-suffix
        className={cn(
          // Per the official Exxat brand spec (Figma):
          //   font-family: IvyPresto Text
          //   weight:      SemiBold (600)  — NOT Bold / ExtraBold
          //   tracking:   -3%              — overrides parent `tracking-tight`
          //   line-height: auto            — inherited (parent sets `leading-none`)
          // IvyPresto's Bodoni-lineage SemiBold already has the thick verticals
          // that read as a logo; pushing to 700/800 makes the letterforms
          // visually heavier than the brand asset.
          "ms-[0.18em] font-semibold tracking-[-0.03em]",
        )}
        style={{
          // Ivy Presto Text from Adobe Fonts. Upright (NOT italic) — matches
          // the official Exxat wordmark. Fallback chain ends in `serif` so
          // FOUT still renders a serif that reads as a logo rather than Inter.
          fontFamily: "var(--font-heading), 'ivypresto-text', Georgia, serif",
          // `wordmarkColor` (Exxat pink) in light and dark — never muted to grey.
          color: suffixColor,
        }}
      >
        {suffix}
      </span>
    </span>
  )
}

/* ── Circular mark ─────────────────────────────────────────────────────────── */

export interface ProductMarkProps {
  config: ProductBrandConfig
  className?: string
  cutoutColor?: string
}

/**
 * Generate a stable id suffix for SVG gradient defs so multiple marks on the
 * same page never collide. Strip colons because IDs in HTML/SVG can't legally
 * include them (Radix uses `:`-style IDs by default).
 */
function useMarkGradientId(brandId: string) {
  const raw = React.useId().replace(/:/g, "")
  return `pmk-${brandId.replace(/[^a-z0-9-]/gi, "")}-${raw}`
}

/**
 * Defer SVG `<defs>` (gradient refs) until after mount so server HTML matches
 * the first client paint. `useId()` returns different suffixes in SSR vs CSR
 * trees that conditionally mount the sidebar.
 */
function useBrowserPaintReady() {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    setReady(true)
  }, [])
  return ready
}

/**
 * Recoloured Exxat "E" mark. Same geometry as the canonical brand mark, so
 * existing pixel-aligned layouts (sidebar header, dropdown rows) don't shift.
 *
 * Fills:
 *  - Outer circle: `markGradient` if provided, else flat `brandColor`.
 *  - Inner shadow plate: `markShadow` (defaults to `brandColor`).
 *  - Cut-out "E" strokes: always white in product chrome (sidebar / switcher).
 */
export function ProductMark({ config, className, cutoutColor = "white" }: ProductMarkProps) {
  const ready = useBrowserPaintReady()
  const gradId = useMarkGradientId(config.id)
  const [from, to] = config.markGradient ?? [config.brandColor, config.brandColor]
  const shadow = config.markShadow ?? config.brandColor

  // No size default. Callers MUST set explicit dimensions (`size-7`, `h-full
  // w-auto`, etc.). A `size-*` default here loses to a downstream `h-full /
  // w-auto` only when `tailwind-merge` correctly identifies `size-7` as a
  // `w-7 + h-7` shorthand — fragile across versions and causes the mark to
  // render at the default size instead of the parent's height (see
  // `ExxatProductLogo` h-full mark → 32 px in h-8 parent). Aspect-square stays
  // so the mark renders as a circle when only one of width/height is set.
  const sharedClass = cn(
    "box-border block aspect-square shrink-0 flex-none object-contain",
    className,
  )

  if (!ready) {
    return (
      <svg
        viewBox="0 8.25 147 147"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        data-product-mark
        data-product-logo-mark
        data-product-id={config.id}
        className={sharedClass}
        aria-hidden="true"
        suppressHydrationWarning
      />
    )
  }

  return (
    <svg
      viewBox="0 8.25 147 147"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-product-mark
      data-product-logo-mark
      data-product-id={config.id}
      className={sharedClass}
      aria-hidden="true"
      suppressHydrationWarning
    >
      <path
        d="M73.4939 155.238C114.084 155.238 146.988 122.334 146.988 81.7439C146.988 41.1544 114.084 8.25 73.4939 8.25C32.9044 8.25 0 41.1544 0 81.7439C0 122.334 32.9044 155.238 73.4939 155.238Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M0.594727 90.9915C4.59951 122.921 29.0894 148.466 60.4966 154.085L102.462 116.355V102.302H86.8312L102.462 88.2489V74.1957H86.8312L102.462 60.1425V46.0894H50.5575L0.594727 90.9915Z"
        fill={shadow}
      />
      <path d="M102.474 116.355H50.5576L58.6764 102.302H102.474V116.355Z" fill={cutoutColor} />
      <path d="M102.474 60.1303H58.6764L50.5576 46.0771H102.474V60.1303Z" fill={cutoutColor} />
      <path d="M102.474 88.2368H66.7949L70.8483 81.2102L66.7949 74.1836H102.474V88.2368Z" fill={cutoutColor} />
      <path d="M39.2227 74.1835H66.795L58.6762 60.1304H39.2227V74.1835Z" fill={cutoutColor} />
      <path d="M39.2227 102.302H58.6762L66.795 88.2368H39.2227V102.302Z" fill={cutoutColor} />
      <defs>
        <linearGradient
          id={gradId}
          x1="28.3733"
          y1="134.255"
          x2="117.195"
          y2="30.9074"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Mark + wordmark combo ─────────────────────────────────────────────────── */

export interface ProductLogoProps {
  config: ProductBrandConfig
  variant?: ProductWordmarkVariant
  /** Render only the mark (omit the wordmark). */
  markOnly?: boolean
  /** Render only the wordmark (omit the mark). */
  wordmarkOnly?: boolean
  className?: string
  /** Class applied to the inner mark — useful for sizing it independently. */
  markClassName?: string
  /** Class applied to the inner wordmark. */
  wordmarkClassName?: string
}

/**
 * Mark + wordmark composed inline. Pass `markOnly` for collapsed sidebar /
 * favicon-like contexts, or `wordmarkOnly` if you've already rendered the
 * mark separately (e.g. switcher dropdown rows).
 */
export function ProductLogo({
  config,
  variant = "default",
  markOnly = false,
  wordmarkOnly = false,
  className,
  markClassName,
  wordmarkClassName,
}: ProductLogoProps) {
  if (markOnly) {
    return <ProductMark config={config} className={cn(className, markClassName)} />
  }
  if (wordmarkOnly) {
    return <ProductWordmark config={config} variant={variant} className={cn(className, wordmarkClassName)} />
  }
  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-id={config.id}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <ProductMark config={config} className={cn("size-7", markClassName)} />
      <ProductWordmark config={config} variant={variant} className={wordmarkClassName} />
    </span>
  )
}
