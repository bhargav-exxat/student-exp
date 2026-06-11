"use client"

/**
 * BrandColorPicker — single-anchor palette popover.
 *
 * Why "one anchor per family" instead of 16 shades:
 *   The product theme system derives **all** chrome tints (sidebar bg, accent,
 *   secondary, muted, hover, ring, etc.) from a single `--custom-product-brand-color`
 *   variable using OKLCH `from var(…)` formulas. Letting users pick a specific
 *   shade (Pink 500 vs Pink 700) was misleading because the renderer
 *   re-tints everything anyway. One anchor per family is what actually maps
 *   to product reality: "this product is the blue one", not "this product is
 *   Blue 750".
 *
 * Layout:
 *   - Header: preview chip + family label + hex + optional Reset link.
 *   - Body: 10 anchor tiles (one per palette family), 5 across, 2 rows.
 *     Each tile carries a small "used by X" pip overlay when another product
 *     already claims that anchor — see `usedBy`.
 *   - Footer: hue sidebar — custom picks change **hue only** (fixed L/C) so
 *     theme tints and Settings panel washes stay predictable.
 *
 * `usedBy` is a `{ [anchorHex]: productLabel }` map. Callers compute it from
 * the active brand registry / overrides so users can see at a glance that
 * picking Pink would clash with another product. The pip uses the same color
 * as the anchor on a contrasting background, with a tooltip naming the
 * product.
 */

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  EXXAT_PALETTE_BY_FAMILY,
  type ExxatPaletteFamilyId,
  type ExxatPaletteSwatch,
} from "@/lib/exxat-palette"
import { cn } from "@/lib/utils"
import { brandColorsEquivalent } from "@/lib/brand-color-match"
import {
  brandAccentOklchFromHue,
  BRAND_HUE_GRADIENT,
  isPaletteAnchorColor,
  normalizeBrandAccentColor,
  parseOklchHue,
} from "@/lib/brand-accent-color"

/** Anchor shade — `500` is the canonical "true" tone for each palette family. */
const ANCHOR_SHADE = "500"

/**
 * Palette families that are **brand-color candidates** for the picker.
 *
 * Excludes `sapphireGrayBlack` and `neutral` because both are gray-scale
 * families (chroma ≈ 0.005–0.04) intended for UI text / borders, not for
 * product identity. When the theme chrome formula
 * (`oklch(from var(--custom-product-brand-color) 0.965 0.018 h)`) is fed a
 * near-gray colour, the resulting tint is visually indistinguishable from
 * white — which is what the user was hitting with "Sapphire doesn't apply
 * like the rest of the colours". The Custom hex input still accepts any CSS
 * colour, so off-palette greys remain reachable.
 */
const BRAND_FAMILY_IDS: ReadonlyArray<ExxatPaletteFamilyId> = [
  "exxatPink",
  "exxatBlue",
  "exxatIndigo",
  "purple",
  "teal",
  "green",
  "orange",
  "red",
]

/**
 * Resolved anchor list — one swatch per **brand** palette family at
 * `ANCHOR_SHADE`. Kept as a module constant so multiple picker instances share
 * the same array identity (cheap referential equality for downstream memo).
 */
export const BRAND_PICKER_ANCHORS: ReadonlyArray<ExxatPaletteSwatch> =
  EXXAT_PALETTE_BY_FAMILY.filter(family => BRAND_FAMILY_IDS.includes(family.id)).flatMap(
    family => family.swatches.filter(swatch => swatch.shade === ANCHOR_SHADE),
  )

/** Find the anchor whose stored value matches `value` (hex or OKLCH). */
function findAnchor(value: string | null | undefined): ExxatPaletteSwatch | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (!v) return undefined
  return BRAND_PICKER_ANCHORS.find(
    s => s.hex.toLowerCase() === v || s.oklch.toLowerCase() === v,
  )
}

function BrandHueSlider({
  id,
  hue,
  onHueChange,
}: {
  id: string
  hue: number
  onHueChange: (hue: number) => void
}) {
  return (
    <div className="relative flex h-6 w-full items-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-3 rounded-full border border-border"
        style={{ background: BRAND_HUE_GRADIENT }}
      />
      <input
        id={id}
        type="range"
        min={0}
        max={360}
        step={1}
        value={hue}
        onChange={event => onHueChange(Number(event.target.value))}
        aria-valuetext={`${hue} degrees`}
        aria-label="Brand color hue"
        className={cn(
          "brand-hue-range relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent",
          "[&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-5",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background",
          "[&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-sm",
          "[&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background",
          "[&::-moz-range-thumb]:bg-foreground",
        )}
        style={{
          // Thumb fill follows the picked hue on supporting browsers.
          accentColor: brandAccentOklchFromHue(hue),
        }}
      />
    </div>
  )
}

export interface BrandColorPickerProps {
  /** Current brand color (any CSS color — palette OKLCH, hex, or free text). */
  value: string
  /** Fired when the user selects a palette swatch or commits a custom value. */
  onChange: (value: string) => void
  /**
   * Optional registry / theme default. When provided and different from
   * `value`, the popover surfaces a "Reset" link in the header that calls
   * `onChange(defaultValue)`.
   */
  defaultValue?: string
  /**
   * Anchors already claimed by other products. Key by lower-case hex **or**
   * lower-case OKLCH string (both forms checked). The matching tile shows a
   * small pip + tooltip naming the product.
   */
  usedBy?: Readonly<Record<string, string>>
  /** Trigger id — wire to a `<label htmlFor>` so the field stays accessible. */
  id?: string
  className?: string
  /** `swatch` — icon-only colour circle (label stays in `aria-label`). */
  variant?: "default" | "swatch"
}

export function BrandColorPicker({
  value,
  onChange,
  defaultValue,
  usedBy,
  id,
  className,
  variant = "default",
}: BrandColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const matchedAnchor = React.useMemo(() => findAnchor(value), [value])
  const normalizedValue = React.useMemo(() => normalizeBrandAccentColor(value), [value])
  const hueValue = React.useMemo(() => {
    if (matchedAnchor?.oklchValues?.h != null) {
      return Math.round(matchedAnchor.oklchValues.h)
    }
    return Math.round(parseOklchHue(normalizedValue) ?? 280)
  }, [matchedAnchor, normalizedValue])

  const triggerLabel =
    matchedAnchor?.familyLabel ??
    (value?.trim() ? `Custom · ${hueValue}°` : "Choose color")
  const previewColor = normalizedValue.trim() || "transparent"
  const showReset = Boolean(
    defaultValue && value?.trim() && !brandColorsEquivalent(value, defaultValue),
  )

  const handleSelectSwatch = (swatch: ExxatPaletteSwatch) => {
    onChange(swatch.oklch)
    setOpen(false)
  }

  const handleHueChange = (hue: number) => {
    onChange(brandAccentOklchFromHue(hue))
  }

  /** Match `swatch` against the `usedBy` map (case-insensitive, hex or OKLCH). */
  const claimedBy = React.useCallback(
    (swatch: ExxatPaletteSwatch): string | undefined => {
      if (!usedBy) return undefined
      const hex = swatch.hex.toLowerCase()
      const oklch = swatch.oklch.toLowerCase()
      for (const [key, label] of Object.entries(usedBy)) {
        const k = key.toLowerCase()
        if (k === hex || k === oklch) return label
      }
      return undefined
    },
    [usedBy],
  )

  const triggerAriaLabel = `Brand color: ${triggerLabel}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "swatch" ? (
          <Button
            id={id}
            type="button"
            variant="outline"
            size="icon"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={triggerAriaLabel}
            className={cn("size-9 shrink-0", className)}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-5 rounded-full border border-border"
              style={{ background: previewColor }}
            />
          </Button>
        ) : (
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={triggerAriaLabel}
            className={cn("h-9 w-full justify-start gap-2 px-2.5 font-normal", className)}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-5 shrink-0 rounded-full border border-border"
              style={{ background: previewColor }}
            />
            <span className="min-w-0 flex-1 truncate text-left text-sm">{triggerLabel}</span>
            <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        // 5 tiles × ~3.25rem + paddings ≈ 18rem. Clamp on tiny viewports.
        className="w-[min(20rem,calc(100vw-1.5rem))] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex size-5 shrink-0 rounded-full border border-border"
              style={{ background: previewColor }}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {matchedAnchor?.familyLabel ?? "Custom hue"}
              </p>
              <p className="truncate font-mono text-[11px] uppercase text-muted-foreground">
                {matchedAnchor?.hex ?? (isPaletteAnchorColor(value) ? value.trim() : `${hueValue}°`)}
              </p>
            </div>
          </div>
          {showReset ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => {
                if (defaultValue) onChange(defaultValue)
              }}
            >
              Reset
            </Button>
          ) : null}
        </div>

        {/* Body — one anchor per brand family, 4 across (8 → symmetric 4×2). */}
        <div
          className="grid grid-cols-4 gap-1.5 p-3"
          role="listbox"
          aria-label="Brand color palette"
        >
          {BRAND_PICKER_ANCHORS.map(swatch => {
            const selected =
              matchedAnchor?.family === swatch.family && matchedAnchor.shade === swatch.shade
            const claim = claimedBy(swatch)
            const tipBody = (
              <span className="flex flex-col">
                <span>{swatch.familyLabel}</span>
                <span className="text-[11px] text-muted-foreground">{swatch.hex}</span>
                {claim ? (
                  <span className="mt-0.5 text-[11px] text-foreground">
                    Used by {claim}
                  </span>
                ) : null}
              </span>
            )
            return (
              <Tip key={`${swatch.family}-${swatch.shade}`} label={tipBody}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={
                    claim
                      ? `${swatch.familyLabel} (${swatch.hex}) — used by ${claim}`
                      : `${swatch.familyLabel} (${swatch.hex})`
                  }
                  onClick={() => handleSelectSwatch(swatch)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 rounded-md p-1.5",
                    "transition-transform hover:scale-[1.03]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                    selected && "bg-accent/40",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative inline-flex size-8 shrink-0 rounded-full border border-black/10",
                      selected &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                    )}
                    style={{ background: swatch.hex }}
                  >
                    {selected ? (
                      <i
                        className="fa-solid fa-check absolute inset-0 m-auto text-[10px] text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                        aria-hidden="true"
                      />
                    ) : null}
                    {claim ? (
                      // Pip indicates this anchor is already claimed by
                      // another product. Sits at the top-right of the
                      // swatch, contrasting ring for legibility on any
                      // background.
                      <span
                        aria-hidden="true"
                        className="absolute -right-0.5 -top-0.5 inline-flex size-3 items-center justify-center rounded-full bg-background ring-1 ring-border"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: swatch.hex }}
                        />
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "max-w-full truncate text-[11px] leading-none text-muted-foreground",
                      selected && "text-foreground",
                    )}
                  >
                    {swatch.familyLabel}
                  </span>
                </button>
              </Tip>
            )
          })}
        </div>

        {/* Footer — single hue slider on a full-spectrum track */}
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`${id ?? "brand-color"}-hue`}
              className="text-[11px] font-medium text-muted-foreground"
            >
              Custom hue
            </label>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{hueValue}°</span>
          </div>
          <BrandHueSlider
            id={`${id ?? "brand-color"}-hue`}
            hue={hueValue}
            onHueChange={handleHueChange}
          />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Saturation and lightness stay fixed — only hue changes, so panel tints and product
            chrome stay consistent.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
