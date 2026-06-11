"use client"

/**
 * Exxat product logo — SVG (mark + "Exxat" letters) + HTML text (product suffix).
 *
 * Why the hybrid:
 *  - The mark and the "Exxat" prefix are **static** and shared across every
 *    Exxat product. Tracing them once as SVG paths means pixel-perfect
 *    rendering, no font-loading flicker, and perfect baseline alignment
 *    between the circular mark and the "Exxat" caps (they live in the same
 *    `viewBox`).
 *  - The **suffix** (One / Prism / Pulse / …) is the only variable part, so it
 *    renders as HTML text in **IvyPresto Text SemiBold** per the official
 *    Figma brand spec (`weight 600`, `letter-spacing -3 %`). Adding a new
 *    product is still a one-liner in `lib/product-brand.ts` — no new path
 *    tracing required.
 *
 * The earlier "all-HTML wordmark" approach worked but couldn't fully match the
 * SVG's letter spacing / weight (Inter ≠ the original traced glyphs) and made
 * the mark-to-Exxat alignment depend on browser font-metrics. The hybrid
 * removes both classes of issue.
 *
 * **Reference paths:** the mark + "Exxat" path data is the same `d=…` source
 * used by the historical `ExxatOneLogo` (the pre-text-route baseline). Only
 * the gradient colours are pulled from the brand registry so new brands
 * recolour the mark.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProductMark } from "@/components/product-wordmark"
import { brandForProduct, type ProductBrandConfig } from "@/lib/product-brand"
import type { Product } from "@/contexts/product-context"
import { useAppStore, type CustomProductBrand, getActiveCustomProductBrand } from "@/stores/app-store"
import { customProductBrandConfig } from "@/lib/product-brand"

export type ExxatProductLogoVariant = "default" | "mutedSuffix" | "sidebar"

export interface ExxatProductLogoProps {
  product: Product
  className?: string
  /** Reserved for switcher chrome; suffix stays Exxat pink in all modes. */
  variant?: ExxatProductLogoVariant
  /** Live preview or a specific custom slot — bypasses the active custom index. */
  previewCustomBrand?: CustomProductBrand | null
}

/**
 * The shared viewBox covers x=0..147 (mark), the original 49-unit baseline gap
 * (x=147..196), and x=196..514 (the "Exxat" letters). The full y=0..164 height
 * preserves the breathing room around the circle exactly as the brand asset
 * defines it — DO NOT crop or the mark stops being a round disc.
 */
const EXXAT_LOGO_VIEWBOX = "0 0 514 164"

/** Defer `<defs>` until after mount so SSR/CSR ids match — see `ProductMark`. */
function useBrowserPaintReady() {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    setReady(true)
  }, [])
  return ready
}

/**
 * Per-instance gradient id so multiple logos on one page don't collide. Strip
 * colons because Radix-style `useId()` values can contain them and SVG `id`
 * cannot.
 */
function useExxatBaseGradientId(brandId: string) {
  const raw = React.useId().replace(/:/g, "")
  return `exxat-base-${brandId.replace(/[^a-z0-9-]/gi, "")}-${raw}`
}

/**
 * Mark + "Exxat" letters as a single SVG. The "Exxat" letter paths are
 * authored at y=35..128 (cap top / baseline) inside the 164-unit viewBox, so
 * the cap mid-line sits ≈ 81.5 — naturally centred with the circular mark
 * whose centre is at ≈ 81.5 too. This shared centring is the whole reason for
 * baking both into the same SVG.
 *
 * **`omitMark`** crops the viewBox to the "Exxat" letter range only
 * (`196 0 318 164`) and skips the mark paths + gradient defs. Used by the
 * sidebar `"sidebar"` variant where a standalone `ProductMark` already
 * carries the round identity — rendering the full SVG alongside would paint
 * two marks (the round `[E]` then the SVG's own embedded mark).
 */
function ExxatLogoBase({
  config,
  className,
  style,
  omitMark = false,
}: {
  config: ProductBrandConfig
  className?: string
  style?: React.CSSProperties
  omitMark?: boolean
}) {
  const ready = useBrowserPaintReady()
  const gradId = useExxatBaseGradientId(config.id)
  const [from, to] = config.markGradient ?? [config.brandColor, config.brandColor]
  const shadow = config.markShadow ?? config.brandColor

  // Letters-only crop keeps the original y range (0..164) so the cap height
  // scales identically to the full SVG (cap stays at ~92/164 of the rendered
  // height). Only the x range narrows to the "Exxat" glyph bounds (196..514).
  const viewBox = omitMark ? "196 0 318 164" : EXXAT_LOGO_VIEWBOX
  const aspectClass = omitMark ? "aspect-[318/164]" : "aspect-[514/164]"

  const sharedProps = {
    viewBox,
    preserveAspectRatio: "xMinYMid meet" as const,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "data-product-logo-base": true,
    "data-product-id": config.id,
    "data-omit-mark": omitMark ? true : undefined,
    "aria-hidden": true,
    suppressHydrationWarning: true,
    className: cn("block shrink-0", aspectClass, className),
    style,
  } as const

  if (!ready) {
    return <svg {...sharedProps} />
  }

  return (
    <svg {...sharedProps}>
      {!omitMark && (
        <>
          {/* ── Mark: outer circle, inner shadow plate, cut-out "E" strokes ── */}
          <path
            d="M73.49 155.24C114.08 155.24 146.99 122.33 146.99 81.74C146.99 41.15 114.08 8.25 73.49 8.25C32.9 8.25 0 41.15 0 81.74C0 122.33 32.9 155.24 73.49 155.24Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M0.59 90.99C4.6 122.92 29.09 148.47 60.5 154.09L102.46 116.36V102.3H86.83L102.46 88.25V74.2H86.83L102.46 60.14V46.09H50.56L0.59 90.99Z"
            fill={shadow}
          />
          <path d="M102.47 116.36H50.56L58.68 102.3H102.47V116.36Z" fill="white" />
          <path d="M102.47 60.13H58.68L50.56 46.08H102.47V60.13Z" fill="white" />
          <path d="M102.47 88.24H66.79L70.85 81.21L66.79 74.18H102.47V88.24Z" fill="white" />
          <path d="M39.22 74.18H66.8L58.68 60.13H39.22V74.18Z" fill="white" />
          <path d="M39.22 102.3H58.68L66.8 88.24H39.22V102.3Z" fill="white" />
        </>
      )}

      {/* ── "Exxat" letters — neutral slate on light, soft cool grey on dark ──
          Filled via CSS class so dark-mode + `mutedSuffix` flips can override. */}
      <g data-exxat-prefix>
        <path
          d="M196 35.76L235.63 35.81C239.71 35.81 250.8 36.09 254.42 35.65L254.41 50.88C240.77 50.8 227.13 50.8 213.49 50.88L213.5 74.35C224.55 74.34 238.41 74.73 249.19 74.27L249.2 89.72C245.21 89.42 239.53 89.58 235.43 89.59L213.5 89.63L213.48 113L256.08 112.93L256.07 128.1C251.92 127.62 239.13 127.9 234.38 127.93C221.69 128 208.64 127.75 196 127.94V35.76Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M311.84 57.11C314.84 57.1 327.11 56.86 329.38 57.21L329.61 57.85C329.33 60.38 324.21 67.34 322.51 69.92C317.65 77.19 312.85 84.49 308.1 91.83C309.12 93.85 311.98 98.15 313.27 100.2L323.96 117.11C325.9 120.18 329.18 124.46 329.55 127.99C323.66 127.75 316.57 127.94 310.59 127.95C307.78 122.8 304.08 117.69 301.1 112.6C299.2 109.35 296.93 105.77 294.71 102.75C293.77 104.89 290.7 109.57 289.36 111.72C285.99 117.17 282.58 122.58 279.12 127.96C276.6 127.91 261.82 128.24 260.67 127.62C260.25 126.01 261.8 123.53 262.7 122.21C269.33 112.52 275.11 101.26 281.98 91.83C281.56 91.33 281.15 90.8 280.77 90.26C279.99 89.13 279.24 87.93 278.49 86.76C272.55 77.6 266.26 68.63 260.48 59.37C260.19 58.91 260.44 57.65 260.54 57.11C266.33 57.05 272.13 57.07 277.92 57.16C283.45 64.94 289.73 74.44 294.84 82.5C296.78 80.01 299.25 76.07 301.02 73.39L311.84 57.11Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M331.8 57.07C337.59 57.12 343.35 57.01 349.16 57.17C351.07 59.34 353.39 63.17 355.06 65.63C358.85 71.21 362.43 77.01 366.36 82.49C370.85 75.07 378.27 64.14 383.33 57.1C385.63 57.09 399.69 56.84 400.87 57.31C401.39 58.6 399.76 61.11 399.01 62.17C392.22 71.73 386.21 82.47 379.27 91.86C383.35 97.67 387.27 104.53 391.17 110.53C393.16 113.61 400.63 124.78 400.95 127.56C399.88 128.24 384.1 127.95 382 127.95C377.12 119.68 371.36 110.9 366.22 102.72C364.99 105.11 362.37 109.02 360.85 111.44C357.4 116.92 353.99 122.43 350.62 127.97C348.24 127.9 332.9 128.28 332.17 127.57C332.12 126.75 332.07 125.83 332.45 125.1C334.5 121.17 337.29 117.06 339.66 113.31L353.19 91.8C352.42 90.71 351.63 89.5 350.9 88.36C344.71 78.72 337.87 69.39 332.08 59.51C331.71 58.88 331.75 57.78 331.8 57.07Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M430.76 55.73C443.6 55.26 459.71 58.4 463.18 73.14C464.17 77.36 463.88 82.7 463.88 87.04L463.85 105.91C463.86 112.15 463.05 112.65 469.33 113.21C469.06 117.66 469.23 123.63 469.24 128.19C461.17 128.15 448.96 129.82 446.76 119.67C444.47 122.42 443.57 123.61 440.36 125.6C433.88 129.64 423.42 129.93 416.18 128.17C410.38 126.76 405.62 123.52 402.51 118.29C400.53 114.23 400.12 109.48 400.65 105.07C402.51 89.56 418.76 87.6 431.17 85.93C435.52 85.24 440.83 84.65 444.47 82.01C447.55 79.77 447.17 76.53 444.97 73.79C440.68 68.46 429.52 68.1 424.36 72.21C421.36 74.59 420.83 77.87 420.5 81.44C414.44 81.38 408.37 81.38 402.31 81.45C402.5 79.52 402.65 77.4 403.03 75.51C405.77 61.78 418.1 56.41 430.76 55.73ZM420.85 112.9C428.03 116.95 440.99 113.87 444.94 106.31C445.85 104.56 447.93 97.68 446.7 95.97L446.34 95.91C442.71 97.49 435.91 98.87 431.8 99.34C425.34 100.07 411.45 104.69 420.85 112.9Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
        <path
          d="M479.84 35.85C485.68 35.89 491.52 35.89 497.37 35.85C497.15 42.48 497.33 50.27 497.32 56.98L514.28 56.95L514.29 72.1C508.64 72.05 502.99 72.04 497.34 72.05L497.31 93.56C497.31 97.07 496.58 108.12 499.41 110.47C502.23 112.82 510.46 112.62 514.29 112.14L514.28 123.53L514.29 127.44C511.12 127.9 507.91 128.15 504.7 128.19C479.71 128.49 479.89 117.27 479.92 96.95C479.95 88.66 479.94 80.38 479.88 72.09C476.43 72.03 471.88 71.93 468.52 72.19C468.29 67.71 468.49 61.55 468.52 56.99C469.39 57 470.26 57 471.13 56.98C482.42 56.74 480.09 43.78 479.84 35.85Z"
          className="fill-[var(--exxat-color-wordmark-ink-light)] dark:fill-[var(--exxat-color-wordmark-ink-dark)]"
        />
      </g>

      {!omitMark && (
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
      )}
    </svg>
  )
}

/**
 * Mark + wordmark composed inline. Sizing is height-driven via `className`
 * (e.g. `h-9`) — the SVG base scales with the parent height, and the suffix
 * text scales with the parent `text-base` (via `text-[1.8em]`) so its
 * cap-height matches the SVG "Exxat" cap.
 *
 * **Geometry at h-9 (36 px) parent:**
 *  - SVG `0 0 514 164` → renders 113 × 36 px, scale 0.2195
 *  - Mark height: 147 × 0.2195 ≈ 32 px (matches school Avatar slot)
 *  - "Exxat" cap height: 92 × 0.2195 ≈ 20 px (sits centred on mark midline)
 *  - "Exxat" baseline: y=128 in viewBox → ≈ 28.1 px from SVG top
 *
 * **Suffix sizing:** `text-[1.8em]` of 16 px base → 28.8 px font, cap ≈ 20 px
 * (matches "Exxat" cap). `translate-y-[0.05em]` (~1.4 px down) corrects the
 * residual cap-midpoint offset between HTML text metrics and the SVG baseline
 * authored at y=128.
 *
 * **Variants:**
 *  - `"default"` / `"mutedSuffix"` — full inline lock-up (`ExxatLogoBase` +
 *    suffix). Used by the marketing wordmark surfaces (Settings → Appearance
 *    rows, dropdown rows, dashboards).
 *  - `"sidebar"` — adaptive lock-up cascade for the sidebar product switcher.
 *    The mark is always rendered (round `ProductMark`); the wordmark cascades
 *    A → B1 → B2 based on whether the inline string fits the trigger width
 *    (see {@link SidebarLockup}).
 */
export function ExxatProductLogo({
  product,
  className,
  variant = "default",
  previewCustomBrand,
}: ExxatProductLogoProps) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)
  const suffixColor = config.wordmarkColor ?? config.brandColor

  if (variant === "sidebar") {
    return <SidebarLockup config={config} suffixColor={suffixColor} className={className} />
  }

  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-id={config.id}
      className={cn(
        "inline-flex items-end overflow-visible text-base leading-none",
        className,
      )}
    >
      <ExxatLogoBase config={config} style={{ height: 28, width: "auto" }} />

      {/* HTML suffix — IvyPresto Text SemiBold per Figma brand spec. */}
      <span
        data-product-wordmark-suffix
        className="ms-[0.18em] text-[1.55em] font-semibold tracking-[-0.03em] -translate-y-[3px]"
        style={{
          fontFamily: "var(--font-heading), 'ivypresto-text', Georgia, serif",
          color: suffixColor,
        }}
      >
        {config.suffix}
      </span>
    </span>
  )
}

/* ── Sidebar lock-up cascade ───────────────────────────────────────────────── */

/**
 * Adaptive product lock-up for the sidebar product switcher trigger and its
 * dropdown rows. Three deterministic states, picked purely from the suffix
 * string — no `ResizeObserver`, no font-load timing, no measurement spans.
 *
 * The cascade was originally width-driven, but the measurement path latched
 * the wrong lockup whenever IvyPresto swapped in (Adobe Fonts via Kit fires
 * `document.fonts.ready` after first paint). A deterministic rule keyed on
 * `suffix.length` + word count is stable across SSR, hydration, and font
 * load, and matches the small number of legal suffix shapes the brand
 * config produces (built-in suffixes are short single words; custom
 * suffixes are clamped to 24 chars in `customProductBrandConfig`).
 *
 * - **A — Full wordmark** `[E]  Exxat <Suffix>` — short suffixes that read
 *   well next to "Exxat". Mark = standalone round `ProductMark`; the
 *   wordmark area renders `ExxatLogoBase` in **letters-only** mode
 *   (`omitMark` — viewBox cropped to the "Exxat" glyph range) + suffix
 *   inline. Without `omitMark` the embedded SVG mark would paint a second
 *   round `[E]` next to `ProductMark`.
 * - **B1 — Compact one-liner** `[E]  <Suffix>` — long single-word suffixes
 *   (`Assessment`, `Analytics`). "Exxat" is dropped so the suffix can stand
 *   alone in IvyPresto SemiBold at the same visual size as A's suffix.
 * - **B2 — Stacked two-liner** `[E]  Word1` / `Word2` — exactly two-word
 *   suffixes where the combined length warrants wrapping
 *   (`Exam Management`, `Field Practice`). Each word sits on its own line at
 *   the same IvyPresto SemiBold size as B1; the parent's `items-center`
 *   keeps the round `[E]` aligned to the vertical midpoint of the stack.
 *
 * Three-plus-word suffixes are unsupported by product policy — they fall
 * through to B1 and rely on the trigger's overflow rules to clip if needed.
 */
function SidebarLockup({
  config,
  suffixColor,
  className,
}: {
  config: ProductBrandConfig
  suffixColor: string
  className?: string
}) {
  const suffix = config.suffix
  const words = suffix.trim().split(/\s+/)
  // Two-word + long enough to merit wrapping → stacked B2. Two-word but
  // short ("New one") still fits A comfortably and reads better unwrapped.
  const lockup: "A" | "B1" | "B2" =
    words.length === 2 && suffix.length > 10
      ? "B2"
      : suffix.length > 8
        ? "B1"
        : "A"

  const suffixFontFamily =
    "var(--font-heading), 'ivypresto-text', Georgia, serif"
  const suffixTypeClasses =
    "text-[1.55em] font-semibold tracking-[-0.03em] leading-none"

  return (
    <span
      aria-hidden="true"
      data-product-logo
      data-product-logo-variant="sidebar"
      data-product-id={config.id}
      data-lockup={lockup}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 text-base leading-none",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <ProductMark config={config} className="size-6" />
      </span>

      <span className="flex min-w-0 flex-1 items-center">
        {lockup === "A" && (
          <span className="inline-flex items-end overflow-visible whitespace-nowrap leading-none">
            <ExxatLogoBase
              config={config}
              omitMark
              style={{ height: 28, width: "auto" }}
            />
            <span
              data-product-wordmark-suffix
              className={cn("ms-[0.18em] -translate-y-[3px]", suffixTypeClasses)}
              style={{ fontFamily: suffixFontFamily, color: suffixColor }}
            >
              {suffix}
            </span>
          </span>
        )}
        {lockup === "B1" && (
          <span
            data-product-wordmark-suffix
            className={cn("whitespace-nowrap", suffixTypeClasses)}
            style={{ fontFamily: suffixFontFamily, color: suffixColor }}
          >
            {suffix}
          </span>
        )}
        {lockup === "B2" && (
          // Variant 1 (under evaluation): top word smaller, bottom word
          // at the same headline size as A / B1. Hierarchy reads
          // "qualifier → noun" — e.g. "Exam → MANAGEMENT".
          <span
            data-product-wordmark-suffix
            className="flex flex-col whitespace-nowrap leading-[1.05] font-semibold tracking-[-0.03em]"
            style={{ fontFamily: suffixFontFamily, color: suffixColor }}
          >
            <span className="text-base">{words[0]}</span>
            <span className="text-[1.55em]">{words[1]}</span>
          </span>
        )}
      </span>
    </span>
  )
}

export interface ExxatProductMarkProps {
  product: Product
  className?: string
  cutoutColor?: string
}

/**
 * Circular mark only — collapsed sidebar (matches Avatar 32×32). Reuses the
 * generic `ProductMark` because the mark's geometry is identical across all
 * Exxat products; only colours change per brand.
 */
export function ExxatProductMark({ product, className, cutoutColor, previewCustomBrand }: ExxatProductMarkProps & { previewCustomBrand?: CustomProductBrand | null }) {
  const activeCustomProductBrand = useAppStore(s => getActiveCustomProductBrand(s))
  const productBrandColors = useAppStore(s => s.productBrandColors)
  const effectiveCustomBrand = previewCustomBrand ?? activeCustomProductBrand
  const config = brandForProduct(product, effectiveCustomBrand, productBrandColors)
  return <ProductMark config={config} className={className} cutoutColor={cutoutColor} />
}

export interface ExxatProductWordmarkEditorProps {
  previewCustomBrand: CustomProductBrand
  suffixValue: string
  onSuffixChange: (value: string) => void
  suffixPlaceholder?: string
  suffixId?: string
  className?: string
}

/**
 * Product-switcher wordmark with an inline suffix field — E + Exxat SVG plus
 * IvyPresto suffix input at the same size as {@link ExxatProductLogo}.
 */
export function ExxatProductWordmarkEditor({
  previewCustomBrand,
  suffixValue,
  onSuffixChange,
  suffixPlaceholder = "Product",
  suffixId,
  className,
}: ExxatProductWordmarkEditorProps) {
  const suffixRef = React.useRef<HTMLSpanElement>(null)
  const suffix = suffixValue.trim() || suffixPlaceholder
  const config = customProductBrandConfig({
    ...previewCustomBrand,
    suffix,
  })
  const suffixColor = config.wordmarkColor ?? config.brandColor

  React.useLayoutEffect(() => {
    const node = suffixRef.current
    if (!node) return
    const next = suffixValue
    if (node.textContent !== next) {
      node.textContent = next
    }
  }, [suffixValue])

  return (
    <span
      aria-hidden="true"
      data-product-wordmark-editor
      className={cn(
        "inline-flex items-end overflow-visible text-base leading-none",
        className,
      )}
    >
      {/* Settings → Appearance editor preview is the unbounded marketing
          wordmark surface — always render the full `ExxatLogoBase`. The
          sidebar lock-up cascade (variant `"sidebar"`) handles overflow at
          the chrome level instead. */}
      <ExxatLogoBase config={config} className="shrink-0" style={{ height: 28, width: "auto" }} />
      
      <span
        id={suffixId}
        ref={suffixRef}
        role="textbox"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        aria-label="Product name suffix"
        data-product-wordmark-suffix
        data-placeholder={suffixPlaceholder}
        onInput={() => {
          const raw = suffixRef.current?.textContent ?? ""
          const next = raw.slice(0, 24)
          if (raw.length > 24 && suffixRef.current) {
            suffixRef.current.textContent = next
          }
          onSuffixChange(next)
        }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault()
          }
        }}
        className={cn(
          "ms-[0.18em] min-w-[5ch] max-w-[min(100%,14rem)] border-0 bg-transparent p-0",
          "text-[1.55em] font-semibold leading-none tracking-[-0.03em] -translate-y-[3px]",
          "outline-none empty:before:text-current/45 empty:before:content-[attr(data-placeholder)]",
          "focus-visible:outline-none focus-visible:ring-0",
        )}
        style={{
          fontFamily: "var(--font-heading), 'ivypresto-text', Georgia, serif",
          color: suffixColor,
        }}
      />
    </span>
  )
}
