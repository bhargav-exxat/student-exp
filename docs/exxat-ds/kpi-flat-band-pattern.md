# KPI flat band (`KeyMetrics` `variant="flat"`)

> **Component:** `components/key-metrics.tsx` — **`flatMetricsHairlineClass`**, **`flatBandStyle`**.  
> **Tokens:** `app/globals.css` — `--key-metrics-flat-*`.  
> **Cursor:** `.cursor/rules/exxat-kpi-flat-band.mdc` · `.cursor/skills/exxat-kpi-flat-band/SKILL.md`  
> **Related:** `docs/kpi-strip-max-four-pattern.md`, `docs/kpi-trend-pattern.md`

## Intent

List hubs and the main dashboard mix view use **`KeyMetrics variant="flat"`** as a **metrics strip without a surface**: users see KPI copy and deltas on the **page canvas**, with a **brand-colored glow** under the band only. This is **not** a card, tinted panel, or `gap-px` grid fill.

## MUST

1. **No band surface** — The `<section>` background is **only** `var(--key-metrics-flat-band-radial)`. **Do not** stack `--key-metrics-flat-band-linear`, opaque gradients, or `box-shadow` fills that read as a grey/lavender box.
2. **Transparent cells** — `metricsCellSurfaceClassName` is **`bg-transparent`** for `variant="flat"`. **Do not** use `bg-background`, `bg-card`, or `gap-px` + `bg-border` / `bg-foreground/*` on the grid (that paints tile surfaces).
3. **Hairlines = borders only** — Use **`flatMetricsHairlineClass(itemCount, metricsHalfWidthLayout)`** in `key-metrics.tsx`:
   - **2 tiles:** `border-r` on the first cell only.
   - **4 tiles, wide strip (default):** `border-r` on cells 1–3 (verticals between all columns); **no** horizontal rule.
   - **4 tiles, narrow `@container` (&lt; 30rem, 2×2 grid):** odd-column `border-r` + `border-b` on the top row only (via `@[max-width:29.99rem]` overrides).
4. **Divider color (OKLCH)** — `--key-metrics-flat-divider: color-mix(in oklch, var(--sidebar-border) 55%, transparent)`; apply on children with `[&>*]:border-[color:var(--key-metrics-flat-divider)]`. Dividers follow **active product** hue (`--sidebar-border`), not neutral grey alone.
5. **Glow (OKLCH)** — Radial stops use `color-mix(in oklch, var(--brand-color) …%, transparent)` so **Exxat One / Prism / Assessment / `theme-custom`** each tint correctly. **Do not** hardcode rose/indigo literals on theme blocks unless documenting a one-off.
6. **List page usage** — Prefer **`showHeader={false}`**, **`metricsSingleRow`** when four KPIs share one row; pass **`insight`** only when the insight rail is product-required (same row uses `lg:grid-cols-[3fr_2fr]`).
7. **Cap at four tiles** — See **`docs/kpi-strip-max-four-pattern.md`**.

## MUST NOT

- Add **`--key-metrics-flat-band-linear`** back into `flatBandStyle` or hub inline styles (e.g. library hub hero).
- Use **`variant="card"`** on **`ListPageTemplate`** metrics when the design calls for a **flat strip** on the page background.
- Duplicate KPI numbers in ad-hoc **`Card`** grids on the same hub.
- Set **`variant="mutedSuffix"`** on product wordmarks to grey out the **suffix** in dark mode — suffix stays **Exxat pink** (`wordmarkColor`); see **`lib/product-brand.ts`**.

## Tokens (`app/globals.css`)

| Token | Role |
|--------|------|
| `--key-metrics-flat-band-radial` | Bottom brand glow (only layer on flat `<section>`) |
| `--key-metrics-flat-band-shadow` | **`none`** for flat band (no faux surface lift) |
| `--key-metrics-flat-cell-bg` | **`transparent`** |
| `--key-metrics-flat-divider` | OKLCH hairline between cells |

Dark mode (`.dark`): same rules — transparent cells, radial glow only, no linear fill to `--background`.

## Reference implementations

- `components/library-client.tsx` — `KeyMetrics variant="flat" metricsSingleRow`
- `components/dashboard-tabs.tsx` — mix view flat band + insight
- `components/placements-client.tsx`, `team-client.tsx`, `compliance-client.tsx` — list hub metrics slot

## Insight rail (flat + side-by-side)

When **`insight`** is shown beside KPIs, the insight **`Card`** may keep its own surface; the **KPI grid** stays transparent. **Do not** add `lg:border-l` on the insight column for flat band — the insight card ring is the separator (`key-metrics.tsx`).

## See also

- **`docs/kpi-strip-max-four-pattern.md`**
- **`docs/kpi-trend-pattern.md`**
- **`docs/shell-surface-elevation-pattern.md`** — sidebar / secondary panel / page stack
