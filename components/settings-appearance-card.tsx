"use client"

import * as React from "react"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"
import { FieldGroup } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SelectionTileGrid } from "@/components/ui/selection-tile-grid"
import { useAppTheme, type Brand, type TextSizePreference } from "@/hooks/use-app-theme"
import { useDashboardView, type DashboardView } from "@/contexts/dashboard-view-context"
import { useChartVariant, type ChartVariant } from "@/contexts/chart-variant-context"
import { SettingsFormRow } from "@/components/settings-form-row"
import { BrandColorPicker } from "@/components/brand-color-picker"
import { ExxatProductLogo, ExxatProductWordmarkEditor } from "@/components/exxat-product-logo"
import { useProduct, syncActiveProductThemeFromStore } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { DEFAULT_CUSTOM_PRODUCT_BRAND, type CustomProductBrand, type Product, isCustomProductPlaceholder, isListedCustomProduct } from "@/stores/app-store"
import {
  brandForProduct,
  brandPreviewPanelSurfaces,
  customProductBrandConfig,
  getProductBrand,
  productBrandLabel,
} from "@/lib/product-brand"
import { normalizeBrandAccentColor } from "@/lib/brand-accent-color"
import { brandColorsEquivalent } from "@/lib/brand-color-match"
import { validateCustomProductSuffix, customSuffixCollidesWithBuiltInProduct } from "@/lib/product-routing"
import {
  isProductRefHidden,
  isStartupProductRef,
  productRefKey,
  type ProductRef,
} from "@/lib/product-ref"
import { Tip } from "@/components/ui/tip"
import {
  downloadProductScaffold,
  downloadShippedTenantCatalog,
  isBuilderDevSyncEnvironment,
  tenantRecordFromCustomBrand,
} from "@exxatdesignux/product-framework"
import { useProductAuthoringEnabled } from "@exxatdesignux/ui/components/shell"
import { cn } from "@/lib/utils"

export type SettingsAppearanceMode = "products-only" | "display-only" | "all"

function RadioRow({
  value,
  id,
  label,
  iconClass,
}: {
  value: string
  id: string
  label: string
  iconClass?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={id} className="shrink-0" />
      <RadioGroupLabel htmlFor={id} className="flex min-h-0 flex-1 items-center gap-2 py-0 text-sm font-normal">
        {iconClass ? (
          <i className={cn("fa-light w-4 shrink-0 text-center text-muted-foreground", iconClass)} aria-hidden="true" />
        ) : null}
        {label}
      </RadioGroupLabel>
    </div>
  )
}

/** Illustrative split sidebars when “system” shows light+dark (tokens follow active brand hue). */
const SPLIT_SIDEBAR: Record<Brand, { light: string; dark: string; markLight: string; markDark: string }> = {
  one: {
    light: "oklch(0.935 0.024 286.1)",
    dark: "oklch(0.32 0.085 286.1)",
    markLight: "oklch(0.58 0.18 286.1)",
    markDark: "oklch(0.72 0.18 286.1)",
  },
  prism: {
    light: "oklch(0.96 0.04 342)",
    dark: "oklch(0.34 0.13 342)",
    markLight: "oklch(0.62 0.21 342)",
    markDark: "oklch(0.78 0.18 342)",
  },
}

/** Fills the square preview in Settings appearance tiles (see SelectionTileGraphic below-mode sizing). */
const APPEARANCE_TILE_SVG = "block h-full w-auto max-h-full max-w-full shrink-0 object-contain"

/** Fixed palettes per labeled mode — do not use `var(--background)` etc. (those follow the *current* theme). */
const CHROME_LIGHT = {
  shell: "oklch(1 0 0)",
  shellStroke: "oklch(0.90 0.003 270)",
  headerBar: "oklch(0.96 0.004 270)",
  headerStroke: "oklch(0.92 0.003 270)",
  content: "oklch(0.985 0.003 270)",
  card: "oklch(1 0 0)",
  cardStroke: "oklch(0.91 0.003 270)",
  navRow: "oklch(0.86 0.012 270)",
  pill: "oklch(0.94 0.003 270)",
  windowRed: "#FF5F57",
  windowYellow: "#FEBC2E",
  windowGreen: "#28C840",
} as const

const CHROME_DARK = {
  shell: "oklch(0.13 0.01 270)",
  shellStroke: "oklch(0.32 0.015 270)",
  headerBar: "oklch(0.19 0.013 270)",
  headerStroke: "oklch(0.28 0.013 270)",
  content: "oklch(0.155 0.012 270)",
  card: "oklch(0.20 0.013 270)",
  cardStroke: "oklch(0.32 0.013 270)",
  navRow: "oklch(0.42 0.014 270)",
  pill: "oklch(0.25 0.013 270)",
  windowRed: "#FF5F57",
  windowYellow: "#FEBC2E",
  windowGreen: "#28C840",
} as const

type ChromeTokens = { -readonly [K in keyof typeof CHROME_LIGHT]: string }

/**
 * Reusable mini-chrome — Mac-style traffic lights, sidebar with brand-tinted
 * mark + nav rows, header bar with search pill + avatar, three content cards
 * (KPI tile, mini bar chart, list rows). Coordinates are scoped to a fixed
 * 96×56 viewBox so the System mode can place two side-by-side via `<g transform>`.
 *
 * `strokeBoost` thickens every border for the high-contrast variants without
 * forking the whole illustration.
 */
function ChromeIllustration({
  tokens,
  sidebar,
  sidebarMark,
  strokeBoost = 1,
  contentAccent,
}: {
  tokens: ChromeTokens
  sidebar: string
  sidebarMark: string
  strokeBoost?: number
  contentAccent?: string
}) {
  const sw = (n: number) => n * strokeBoost
  return (
    <g>
      <rect
        x={0.6}
        y={0.6}
        width={94.8}
        height={54.8}
        rx={5}
        fill={tokens.shell}
        stroke={tokens.shellStroke}
        strokeWidth={sw(1)}
      />

      {/* Mac-style traffic lights */}
      <circle cx={5.5} cy={5.5} r={1.2} fill={tokens.windowRed} />
      <circle cx={9} cy={5.5} r={1.2} fill={tokens.windowYellow} />
      <circle cx={12.5} cy={5.5} r={1.2} fill={tokens.windowGreen} />
      <line
        x1={0.6}
        y1={9.5}
        x2={95.4}
        y2={9.5}
        stroke={tokens.shellStroke}
        strokeWidth={sw(0.5)}
      />

      {/* Sidebar */}
      <rect x={2.5} y={11.5} width={20} height={42} rx={2.5} fill={sidebar} />
      {/* Brand-tinted product mark + faux team name */}
      <circle cx={6.5} cy={15.5} r={2.2} fill={sidebarMark} />
      <rect x={10} y={14.3} width={9} height={1.2} rx={0.5} fill={tokens.navRow} opacity={0.6} />
      <rect x={10} y={16.4} width={6.5} height={1} rx={0.5} fill={tokens.navRow} opacity={0.45} />

      {/* Active nav row + 4 inactive rows */}
      <rect x={4.5} y={21.5} width={16} height={2.4} rx={0.8} fill={sidebarMark} opacity={0.85} />
      <rect x={4.5} y={25.5} width={14} height={2.2} rx={0.8} fill={tokens.navRow} opacity={0.7} />
      <rect x={4.5} y={29.2} width={15} height={2.2} rx={0.8} fill={tokens.navRow} opacity={0.55} />
      <rect x={4.5} y={32.9} width={12} height={2.2} rx={0.8} fill={tokens.navRow} opacity={0.5} />
      <rect x={4.5} y={36.6} width={13} height={2.2} rx={0.8} fill={tokens.navRow} opacity={0.45} />

      {/* Header bar: search pill + avatar */}
      <rect
        x={25}
        y={12}
        width={67}
        height={6}
        rx={1.5}
        fill={tokens.headerBar}
        stroke={tokens.headerStroke}
        strokeWidth={sw(0.5)}
      />
      <rect x={27} y={13.7} width={28} height={2.6} rx={1.3} fill={tokens.pill} />
      <circle cx={89.5} cy={15} r={1.4} fill={sidebarMark} opacity={0.85} />

      {/* KPI card */}
      <rect
        x={25}
        y={20}
        width={31.5}
        height={14}
        rx={2}
        fill={tokens.card}
        stroke={tokens.cardStroke}
        strokeWidth={sw(0.5)}
      />
      <rect x={27.5} y={22.5} width={10} height={1.5} rx={0.6} fill={tokens.navRow} opacity={0.5} />
      <rect x={27.5} y={26.5} width={14} height={4} rx={0.8} fill={contentAccent ?? sidebarMark} opacity={0.85} />

      {/* Bar-chart card */}
      <rect
        x={60.5}
        y={20}
        width={31.5}
        height={14}
        rx={2}
        fill={tokens.card}
        stroke={tokens.cardStroke}
        strokeWidth={sw(0.5)}
      />
      <rect x={63} y={22.5} width={10} height={1.5} rx={0.6} fill={tokens.navRow} opacity={0.5} />
      <rect x={63} y={30} width={2.5} height={3} rx={0.4} fill={contentAccent ?? sidebarMark} opacity={0.85} />
      <rect x={67} y={28} width={2.5} height={5} rx={0.4} fill={contentAccent ?? sidebarMark} opacity={0.85} />
      <rect x={71} y={26.5} width={2.5} height={6.5} rx={0.4} fill={contentAccent ?? sidebarMark} opacity={0.85} />
      <rect x={75} y={29} width={2.5} height={4} rx={0.4} fill={contentAccent ?? sidebarMark} opacity={0.85} />
      <rect x={79} y={27} width={2.5} height={6} rx={0.4} fill={contentAccent ?? sidebarMark} opacity={0.85} />

      {/* List card */}
      <rect
        x={25}
        y={37}
        width={67}
        height={14}
        rx={2}
        fill={tokens.card}
        stroke={tokens.cardStroke}
        strokeWidth={sw(0.5)}
      />
      <rect x={27.5} y={39.5} width={12} height={1.5} rx={0.6} fill={tokens.navRow} opacity={0.5} />
      <rect x={27.5} y={43} width={62} height={1.6} rx={0.6} fill={tokens.navRow} opacity={0.32} />
      <rect x={27.5} y={45.8} width={62} height={1.6} rx={0.6} fill={tokens.navRow} opacity={0.32} />
      <rect x={27.5} y={48.6} width={62} height={1.6} rx={0.6} fill={tokens.navRow} opacity={0.32} />
    </g>
  )
}

/** Mini browser chrome: illustrative light / dark / split (brand sidebars from SPLIT_SIDEBAR). */
/**
 * One window, two halves — render the full chrome twice in the same SVG, each
 * clipped to a triangular half by a diagonal that runs from the top-right
 * corner to the bottom-left corner. Light fills the top-left triangle, dark
 * fills the bottom-right triangle. Because both halves use identical geometry
 * inside one viewBox, the result reads as a single window with a diagonal
 * theme split (macOS / iOS "Auto" pattern) rather than two adjacent windows.
 */
function SplitSystemSvg({
  light,
  dark,
}: {
  light: { tokens: ChromeTokens; sidebar: string; sidebarMark: string; strokeBoost?: number; contentAccent?: string }
  dark: { tokens: ChromeTokens; sidebar: string; sidebarMark: string; strokeBoost?: number; contentAccent?: string }
}) {
  // useId keeps clipPath ids unique across tile instances on the same page.
  const baseId = React.useId().replace(/:/g, "")
  const lightId = `chrome-split-light-${baseId}`
  const darkId = `chrome-split-dark-${baseId}`
  return (
    <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={lightId}>
          {/* Top-left triangle — top edge + left edge + diagonal to bottom-left. */}
          <polygon points="0,0 96,0 0,56" />
        </clipPath>
        <clipPath id={darkId}>
          {/* Bottom-right triangle — right edge + bottom edge + diagonal. */}
          <polygon points="96,0 96,56 0,56" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${lightId})`}>
        <ChromeIllustration {...light} />
      </g>
      <g clipPath={`url(#${darkId})`}>
        <ChromeIllustration {...dark} />
      </g>
    </svg>
  )
}

function ThemeModeSvg({ mode, brand }: { mode: "system" | "light" | "dark"; brand: Brand }) {
  const split = SPLIT_SIDEBAR[brand]

  if (mode === "light") {
    return (
      <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <ChromeIllustration tokens={CHROME_LIGHT} sidebar={split.light} sidebarMark={split.markLight} />
      </svg>
    )
  }

  if (mode === "dark") {
    return (
      <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <ChromeIllustration tokens={CHROME_DARK} sidebar={split.dark} sidebarMark={split.markDark} />
      </svg>
    )
  }

  // System: one window with a diagonal light↔dark split inside.
  return (
    <SplitSystemSvg
      light={{ tokens: CHROME_LIGHT, sidebar: split.light, sidebarMark: split.markLight }}
      dark={{ tokens: CHROME_DARK, sidebar: split.dark, sidebarMark: split.markDark }}
    />
  )
}

const HC_STROKE = "oklch(0.18 0.02 270)"

const HC_LIGHT_TOKENS: ChromeTokens = {
  ...CHROME_LIGHT,
  shellStroke: HC_STROKE,
  headerStroke: HC_STROKE,
  cardStroke: HC_STROKE,
}

const HC_WINDOWS_TOKENS: ChromeTokens = {
  ...CHROME_DARK,
  shell: "#000000",
  shellStroke: "#FFFFFF",
  headerBar: "#FFFF00",
  headerStroke: "#FFFF00",
  content: "#000000",
  card: "#000000",
  cardStroke: "#FFFFFF",
  navRow: "#FFFFFF",
  pill: "#000000",
}

/** Illustrative light chrome; stroke weight shows contrast (not tied to active color theme). */
function ContrastPrefSvg({
  pref,
  brand,
}: {
  pref: "system" | "normal" | "high" | "windows"
  brand: Brand
}) {
  const split = SPLIT_SIDEBAR[brand]

  if (pref === "normal") {
    return (
      <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <ChromeIllustration tokens={CHROME_LIGHT} sidebar={split.light} sidebarMark={split.markLight} />
      </svg>
    )
  }

  if (pref === "high") {
    return (
      <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <ChromeIllustration
          tokens={HC_LIGHT_TOKENS}
          sidebar={split.light}
          sidebarMark={split.markLight}
          strokeBoost={1.8}
        />
      </svg>
    )
  }

  if (pref === "windows") {
    return (
      <svg className={APPEARANCE_TILE_SVG} viewBox="0 0 96 56" fill="none" aria-hidden="true">
        <ChromeIllustration
          tokens={HC_WINDOWS_TOKENS}
          sidebar="#000000"
          sidebarMark="#00FFFF"
          contentAccent="#FFFF00"
          strokeBoost={1.8}
        />
      </svg>
    )
  }

  // System: one window with a diagonal Normal↔High split inside.
  return (
    <SplitSystemSvg
      light={{ tokens: CHROME_LIGHT, sidebar: split.light, sidebarMark: split.markLight }}
      dark={{ tokens: HC_LIGHT_TOKENS, sidebar: split.light, sidebarMark: split.markLight, strokeBoost: 1.8 }}
    />
  )
}

const CHART_LABELS: Record<ChartVariant, string> = {
  normal: "Normal",
  tabs: "With tabs",
  selector: "With filters",
  "metrics-tabs": "Tabs + metrics",
  "kpi-chart": "KPI + chart",
}

const VIEW_LABELS: Record<DashboardView, string> = {
  report: "Report",
  simple: "Simple",
  mix: "Mix",
}

/** Settings tile previews — map active product to the built-in split sidebar hue. */
function previewBrandForProduct(product: Product): Brand {
  return product === "exxat-prism" ? "prism" : "one"
}

const THEME_CHOICE_LABEL: Record<"system" | "light" | "dark", string> = {
  system: "System default",
  light: "Light",
  dark: "Dark",
}

const TEXT_SIZE_LABEL: Record<TextSizePreference, string> = {
  compact: "Tiny",
  default: "Default",
  large: "Large",
}

type ProductListOption = {
  value: Product
  label: string
  /**
   * Sub-line shown next to the wordmark for the Exxat One siblings. Both
   * share `suffix: "One"` so without this qualifier the two rows look
   * identical to sighted users — the full label only reaches screen readers.
   * Matches the pattern used by `ProductSwitcher`.
   */
  scope?: "Schools" | "Sites"
  customIndex?: number
}

function productRefFromOption(option: ProductListOption): ProductRef {
  return option.customIndex !== undefined
    ? { product: option.value, customIndex: option.customIndex }
    : { product: option.value }
}

import {
  BUILTIN_SETTINGS_PRODUCTS,
} from "@/lib/product-switcher-catalog"

function labelForProductRef(
  ref: ProductRef,
  customProducts: CustomProductBrand[],
): string {
  if (ref.product === "exxat-custom" && ref.customIndex !== undefined) {
    const brand = customProducts[ref.customIndex]
    return brand
      ? productBrandLabel(customProductBrandConfig(brand))
      : "Custom product"
  }
  return (
    BUILTIN_SETTINGS_PRODUCTS.find(entry => entry.id === ref.product)?.label ??
    ref.product
  )
}

type DeleteProductTarget = {
  product: Product
  customIndex?: number
}

export function SettingsAppearanceCard({
  mode = "display-only",
}: {
  /** `products-only` — workspace/org (Add product). `display-only` — personal display prefs. */
  mode?: SettingsAppearanceMode
}) {
  const showProducts = mode === "products-only" || mode === "all"
  const showDisplay = mode === "display-only" || mode === "all"
  const productAuthoringEnabled = useProductAuthoringEnabled()
  const { theme, setTheme } = useTheme()
  const { contrastPref, setContrast, textSizePref, setTextSize, mounted } = useAppTheme()
  const {
    product: activeProduct,
    activeCustomIndex,
    customProducts,
    addCustomProduct,
    updateCustomProduct,
    removeCustomProduct,
    productBrandColors,
    setProductBrandColor,
    hiddenProducts,
    hideProduct,
    showProduct,
    startupProduct,
    setStartupProduct,
  } = useProduct()
  const switchProduct = useProductSwitch()

  const handleSetDefaultStartup = React.useCallback(
    (rowRef: ProductRef) => {
      setStartupProduct(rowRef)
      switchProduct(rowRef.product, rowRef.customIndex)
    },
    [setStartupProduct, switchProduct],
  )
  const { activeView, setActiveView } = useDashboardView()
  const { chartVariant, setChartVariant } = useChartVariant()
  const productNameId = React.useId()
  const productColorId = React.useId()
  const [deleteProductOpen, setDeleteProductOpen] = React.useState(false)
  const deleteProductTargetRef = React.useRef<DeleteProductTarget | null>(null)
  const [productEditorOpen, setProductEditorOpen] = React.useState(false)
  const [productNameDraft, setProductNameDraft] = React.useState("")
  const [productColorDraft, setProductColorDraft] = React.useState(
    DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor,
  )
  const [publishHint, setPublishHint] = React.useState<string | null>(null)

  const safeTheme = mounted ? ((theme ?? "system") as "system" | "light" | "dark") : "system"
  const safeBrand = mounted ? previewBrandForProduct(activeProduct) : "one"
  const safeContrast = mounted ? contrastPref : "system"
  const safeTextSize = mounted ? textSizePref : "default"
  const addProductPreviewBrand = React.useMemo(
    () => ({
      suffix: productNameDraft.trim() || "Product",
      brandColor: normalizeBrandAccentColor(
        productColorDraft.trim() || DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor,
      ),
    }),
    [productColorDraft, productNameDraft],
  )
  const addProductBlockedReason = React.useMemo(() => {
    const suffix = productNameDraft.trim()
    if (!suffix) return "Enter a product name after Exxat."
    if (isCustomProductPlaceholder({ suffix, brandColor: productColorDraft.trim() || DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor })) {
      return "Pick a name other than Custom, or change the brand color."
    }
    return validateCustomProductSuffix(suffix, customProducts)
  }, [customProducts, productColorDraft, productNameDraft])

  const addProductPanelSurfaces = React.useMemo(() => {
    const dark =
      safeTheme === "dark" ||
      (safeTheme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    return brandPreviewPanelSurfaces(addProductPreviewBrand.brandColor, dark)
  }, [addProductPreviewBrand.brandColor, safeTheme])

  const themeTiles = React.useMemo(
    () =>
      (["system", "light", "dark"] as const).map((m) => ({
        value: m,
        label: THEME_CHOICE_LABEL[m],
        leading: <ThemeModeSvg mode={m} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const contrastTiles = React.useMemo(
    () =>
      (["system", "normal", "high", "windows"] as const).map((p) => ({
        value: p,
        label:
          p === "system"
            ? "System"
            : p === "normal"
              ? "Normal"
              : p === "high"
                ? "High"
                : "Windows",
        leading: <ContrastPrefSvg pref={p} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const textSizeTiles = React.useMemo(
    () =>
      (["compact", "default", "large"] as const).map((v) => ({
        value: v,
        label: TEXT_SIZE_LABEL[v],
        leading: (
          <span
            className={cn(
              "font-semibold leading-none tracking-tight text-foreground",
              v === "compact" && "text-sm",
              v === "default" && "text-lg",
              v === "large" && "text-2xl",
            )}
            aria-hidden
          >
            Aa
          </span>
        ),
      })),
    [],
  )
  // Exxat ships **four apps** in the product switcher: Prism, One — Schools,
  // One — Sites, and Custom (Prism IA with tenant-configured branding). Both
  // Exxat One variants share the indigo accent + pink wordmark; the
  // brand-color picker here recolours each independently so a workspace can
  // theme one without affecting the other. The Custom slot only appears in
  // this list once the tenant has configured a suffix + brand color via the
  // "Add product" affordance below. See
  // `apps/web/docs/multi-product-routing-pattern.md`.
  const productOptions = React.useMemo((): ProductListOption[] => {
    const builtIns: ProductListOption[] = BUILTIN_SETTINGS_PRODUCTS.map(entry => ({
      value: entry.id,
      label: entry.label,
      scope: entry.scope,
    }))
    const customs: ProductListOption[] = customProducts.flatMap((cp, customIndex) =>
      isListedCustomProduct(cp) && !customSuffixCollidesWithBuiltInProduct(cp.suffix)
        ? [{ value: "exxat-custom" as const, label: `Exxat ${cp.suffix}`, customIndex }]
        : [],
    )
    return [...builtIns, ...customs].filter(
      option => !isProductRefHidden(productRefFromOption(option), hiddenProducts),
    )
  }, [customProducts, hiddenProducts])

  return (
    <section
      id={showProducts ? "organization" : "appearance"}
      className="scroll-mt-20"
    >
      <header className="mb-8 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {showProducts && !showDisplay
            ? "Products & branding"
            : "Appearance & display"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {showProducts && !showDisplay
            ? productAuthoringEnabled
              ? "Workspace-wide — shared across every product in this browser. Add products, set default startup, and tune panel tints."
              : "Products shipped on this deploy are listed below. Builders author and rebrand them in dev, then commit and redeploy."
            : "Saved in this browser."}
        </p>
      </header>
      <div>
        {!mounted && showDisplay ? (
          <p className="text-sm text-muted-foreground">Loading theme…</p>
        ) : (
          <FieldGroup className="gap-8">
            {showProducts ? (
            <SettingsFormRow
              label="Products"
              description={
                productAuthoringEnabled
                  ? "Builder-only. End users see new products only after you intentionally ship the generated tenant-products.json and redeploy this app."
                  : "Products available on this deploy. Switch to Builder mode to add, rebrand, or hide products."
              }
            >
              <div
                className="overflow-hidden rounded-xl border border-border bg-card"
                role="group"
                aria-label="Product brand colors"
              >
                {productOptions.map(option => {
                  const customBrand =
                    option.customIndex !== undefined
                      ? customProducts[option.customIndex]
                      : null
                  const config = brandForProduct(
                    option.value,
                    customBrand,
                    productBrandColors,
                  )
                  const defaultConfig =
                    option.value === "exxat-custom"
                      ? customProductBrandConfig(customBrand)
                      : getProductBrand(option.value)
                  const pickerId = `settings-product-color-${option.value}${
                    option.customIndex !== undefined ? `-${option.customIndex}` : ""
                  }`
                  const canDelete = option.customIndex !== undefined
                  const isCustom = option.customIndex !== undefined
                  const isActive =
                    activeProduct === option.value &&
                    (option.customIndex === undefined ||
                      activeCustomIndex === option.customIndex)
                  const rowRef = productRefFromOption(option)
                  const isDefault = isStartupProductRef(rowRef, startupProduct)
                  const usedBy: Record<string, string> = {}
                  for (const other of productOptions) {
                    if (
                      other.value === option.value &&
                      other.customIndex === option.customIndex
                    ) {
                      continue
                    }
                    const otherCustomBrand =
                      other.customIndex !== undefined
                        ? customProducts[other.customIndex]
                        : null
                    const otherConfig = brandForProduct(
                      other.value,
                      otherCustomBrand,
                      productBrandColors,
                    )
                    const otherActive =
                      activeProduct === other.value &&
                      (other.customIndex === undefined ||
                        activeCustomIndex === other.customIndex)
                    const label = otherActive ? `${other.label} (active)` : other.label
                    usedBy[otherConfig.brandColor] = label
                  }
                  const handleColorChange = (next: string) => {
                    const normalized = normalizeBrandAccentColor(next)
                    if (isCustom && option.customIndex !== undefined && customBrand) {
                      updateCustomProduct(option.customIndex, {
                        suffix: customBrand.suffix.trim() || DEFAULT_CUSTOM_PRODUCT_BRAND.suffix,
                        brandColor: normalized,
                      })
                      setProductBrandColor("exxat-custom", null)
                    } else if (defaultConfig && brandColorsEquivalent(normalized, defaultConfig.brandColor)) {
                      setProductBrandColor(option.value, null)
                    } else {
                      setProductBrandColor(option.value, normalized)
                    }
                    if (isActive) {
                      requestAnimationFrame(() => syncActiveProductThemeFromStore())
                    }
                  }
                  return (
                    <div
                      key={
                        option.customIndex !== undefined
                          ? `${option.value}-${option.customIndex}`
                          : option.value
                      }
                      className="grid gap-3 border-b border-border p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="flex min-w-0 flex-col gap-2">
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="sr-only">{option.label}</span>
                          <ExxatProductLogo
                            product={option.value}
                            variant="mutedSuffix"
                            previewCustomBrand={isCustom ? customBrand ?? undefined : undefined}
                            className="w-auto max-w-full"
                          />
                          {option.scope && (
                            <span
                              className="text-xs font-medium text-muted-foreground"
                              aria-hidden="true"
                            >
                              — {option.scope}
                            </span>
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isActive ? (
                            <Tip
                              label="Currently active product — chrome reflects this color"
                              side="top"
                            >
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground"
                                aria-label="Active product"
                              >
                                <i
                                  className="fa-solid fa-circle text-[6px] text-emerald-500"
                                  aria-hidden="true"
                                />
                                Active
                              </span>
                            </Tip>
                          ) : null}
                          {isDefault ? (
                            <Tip
                              label="Opens at app home (/) on cold start; switching default also moves you there now"
                              side="top"
                            >
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground"
                                aria-label="Default startup product"
                              >
                                <i className="fa-solid fa-house text-xs" aria-hidden="true" />
                                Default
                              </span>
                            </Tip>
                          ) : productAuthoringEnabled ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 shrink-0 px-2 text-[11px] text-muted-foreground"
                              onClick={() => handleSetDefaultStartup(rowRef)}
                            >
                              Set as default
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2">
                        {productAuthoringEnabled ? (
                          <>
                            <label htmlFor={pickerId} className="sr-only">
                              Brand color for {option.label}
                            </label>
                            <BrandColorPicker
                              id={pickerId}
                              variant="swatch"
                              value={config.brandColor}
                              defaultValue={defaultConfig?.brandColor}
                              usedBy={usedBy}
                              onChange={handleColorChange}
                            />
                          </>
                        ) : (
                          <span
                            role="img"
                            aria-label={`${option.label} brand color`}
                            className="inline-flex size-5 shrink-0 rounded-full border border-border"
                            style={{ background: config.brandColor }}
                          />
                        )}
                      {/* Per-row overflow: delete (custom only) or hide (any
                          non-active built-in). Active products can't be hidden
                          — the user has to switch first, which prevents the
                          picker from becoming unreachable. */}
                      {productAuthoringEnabled && canDelete ? (
                        <Tip label={`Remove ${option.label}`} side="top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0 text-muted-foreground"
                            aria-label={`Remove ${option.label}`}
                            onClick={() => {
                              deleteProductTargetRef.current = {
                                product: option.value,
                                customIndex: option.customIndex,
                              }
                              setDeleteProductOpen(true)
                            }}
                          >
                            <i className="fa-light fa-trash text-sm" aria-hidden="true" />
                          </Button>
                        </Tip>
                      ) : productAuthoringEnabled ? (
                        <Tip label={`Hide ${option.label} from switcher`} side="top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0 text-muted-foreground"
                            aria-label={`Hide ${option.label} from switcher`}
                            onClick={() => hideProduct(rowRef)}
                          >
                            <i className="fa-light fa-eye-slash text-sm" aria-hidden="true" />
                          </Button>
                        </Tip>
                      ) : null}
                      </div>
                    </div>
                  )
                })}
                {productAuthoringEnabled ? (
                <div>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition",
                      "hover:bg-interactive-hover/20",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    aria-expanded={productEditorOpen}
                    onClick={() => {
                      setProductEditorOpen(open => {
                        const next = !open
                        if (next) {
                          setProductNameDraft("")
                          setProductColorDraft(DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor)
                        }
                        return next
                      })
                    }}
                  >
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">Add product</span>
                        <span className="block text-xs text-muted-foreground">
                          Create a product name and brand color.
                        </span>
                      </span>
                      <i
                        className={cn(
                          "fa-light fa-chevron-down text-xs text-muted-foreground transition-transform",
                          productEditorOpen && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {productEditorOpen ? (
                      <div
                        className="border-t p-4 transition-[background-color,border-color] duration-200"
                        style={addProductPanelSurfaces}
                      >
                        <div className="flex flex-col gap-4">
                          <label htmlFor={productNameId} className="sr-only">
                            Product name suffix
                          </label>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="min-w-0">
                              <ExxatProductWordmarkEditor
                                suffixId={productNameId}
                                previewCustomBrand={addProductPreviewBrand}
                                suffixValue={productNameDraft}
                                onSuffixChange={setProductNameDraft}
                                suffixPlaceholder="Assessment"
                                className="w-auto max-w-[min(100%,18rem)]"
                              />
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 ps-0.5">
                            <div className="w-44 shrink-0">
                              <label htmlFor={productColorId} className="sr-only">
                                Brand color
                              </label>
                              <BrandColorPicker
                                id={productColorId}
                                value={productColorDraft}
                                onChange={setProductColorDraft}
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              disabled={Boolean(addProductBlockedReason)}
                              onClick={() => {
                                const suffix = productNameDraft.trim()
                                const brandColor = normalizeBrandAccentColor(
                                  productColorDraft.trim() ||
                                    DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor,
                                )
                                if (!suffix || addProductBlockedReason) return
                                const nextIndex = addCustomProduct({ suffix, brandColor })
                                switchProduct("exxat-custom", nextIndex)
                                if (productAuthoringEnabled) {
                                  // In dev with the builder dev-sync Vite plugin
                                  // active, the catalog is already being written
                                  // to `public/tenant-products.json` on disk by
                                  // the middleware (POST → /__exxat/builder-sync)
                                  // every time the tenant store changes. Firing
                                  // the browser-side `download*` helpers in that
                                  // mode just produces redundant "Save As"
                                  // dialogs for the same file (plus the four
                                  // scaffold files), which is what users were
                                  // hitting after adding a custom product.
                                  // Skip the downloads when dev-sync is live;
                                  // they remain wired for production builds
                                  // (no Vite middleware → no other persistence
                                  // path).
                                  if (isBuilderDevSyncEnvironment()) {
                                    setPublishHint(
                                      "Saved to ignored public/tenant-products.json on the dev server — force-add it only when you intend to ship this product.",
                                    )
                                  } else {
                                    downloadShippedTenantCatalog()
                                    downloadProductScaffold(
                                      tenantRecordFromCustomBrand(suffix, brandColor),
                                    )
                                    setPublishHint(
                                      "Downloaded public/tenant-products.json and scaffold files — force-add the catalog only when you intend to ship it, then pnpm build and deploy.",
                                    )
                                  }
                                }
                                setProductEditorOpen(false)
                                setProductNameDraft("")
                                setProductColorDraft(DEFAULT_CUSTOM_PRODUCT_BRAND.brandColor)
                              }}
                            >
                              Add product
                            </Button>
                          </div>
                          {addProductBlockedReason ? (
                            <p className="text-xs text-muted-foreground">{addProductBlockedReason}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Type the suffix after Exxat — wordmark stays Exxat pink; the
                              panel tint follows your brand color. After Add, review the generated{" "}
                              <span className="font-mono">public/tenant-products.json</span> and
                              force-add it only for a deploy that should ship this product.
                            </p>
                          )}
                          {publishHint ? (
                            <p className="text-xs text-foreground" role="status">
                              {publishHint}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                </div>
                ) : null}
              </div>
              {productAuthoringEnabled && hiddenProducts.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Hidden:</span>
                    {hiddenProducts.map(ref => (
                      <Button
                        key={productRefKey(ref)}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => showProduct(ref)}
                      >
                        <i className="fa-light fa-eye mr-1 text-xs" aria-hidden="true" />
                        Show {labelForProductRef(ref, customProducts)}
                      </Button>
                    ))}
                </div>
              ) : null}
            </SettingsFormRow>
            ) : null}

            {showDisplay ? (
            <>
            <SettingsFormRow label="Theme" description="Light, dark, or match your OS.">
              <SelectionTileGrid<"system" | "light" | "dark">
                className="w-full"
                labelPlacement="below"
                options={themeTiles}
                columns={4}
                value={safeTheme}
                onValueChange={(v) => setTheme(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Contrast"
              description="High uses the built-in Fluent-style palette. Windows loads colors from the JSON file (edit and refresh)."
            >
              <SelectionTileGrid<"system" | "normal" | "high" | "windows">
                className="w-full"
                labelPlacement="below"
                options={contrastTiles}
                columns={4}
                value={safeContrast}
                onValueChange={(v) => setContrast(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Text size"
              description="Scales UI text from the root (like iOS/Android accessibility size). Tiny still enforces an 11px floor for labels."
            >
              <SelectionTileGrid<TextSizePreference>
                className="w-full"
                labelPlacement="below"
                options={textSizeTiles}
                columns={4}
                value={safeTextSize}
                onValueChange={(v) => setTextSize(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow label="Dashboard layout" description="Default dashboard tab.">
              <RadioGroup
                value={activeView}
                onValueChange={(v) => setActiveView(v as DashboardView)}
                className="flex flex-col gap-3"
                aria-label="Dashboard view"
                itemVariant="outline"
                itemMotion="glow"
              >
                <RadioRow value="report" id="dash-report" label={VIEW_LABELS.report} iconClass="fa-chart-mixed" />
                <RadioRow value="simple" id="dash-simple" label={VIEW_LABELS.simple} iconClass="fa-grid-2" />
                <RadioRow value="mix" id="dash-mix" label={VIEW_LABELS.mix} iconClass="fa-layer-group" />
              </RadioGroup>
            </SettingsFormRow>

            <SettingsFormRow label="Chart style" htmlFor="settings-chart-style">
              <Select
                value={chartVariant}
                onValueChange={(v) => setChartVariant(v as ChartVariant)}
              >
                <SelectTrigger id="settings-chart-style" className="w-full">
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHART_LABELS) as ChartVariant[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CHART_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsFormRow>
            </>
            ) : null}
          </FieldGroup>
        )}
      </div>

      {/* Destructive confirm for removing the Custom slot — irreversible
          locally (re-adding builds a fresh entry with the default suffix +
          colour). Routed through a dialog per the no-toast rule. */}
      <Dialog open={deleteProductOpen} onOpenChange={setDeleteProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove custom product?</DialogTitle>
            <DialogDescription>
              The slot will disappear from the switcher. You can re-add it
              later from this page; brand colour and name will reset to
              defaults.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteProductOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const target = deleteProductTargetRef.current
                if (target?.product === "exxat-custom" && target.customIndex !== undefined) {
                  removeCustomProduct(target.customIndex)
                  if (
                    activeProduct === "exxat-custom" &&
                    activeCustomIndex === target.customIndex
                  ) {
                    switchProduct("exxat-prism")
                  }
                }
                setDeleteProductOpen(false)
                deleteProductTargetRef.current = null
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
