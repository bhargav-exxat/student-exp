# Shell surface elevation (sidebar · secondary panel · page)

> **Tokens:** `app/globals.css` — `--sidebar`, `--secondary-panel-bg`, `--background`, `--brand-tint*`.  
> **Shell:** `components/templates/nested-secondary-panel-shell.tsx` — `bg-[var(--secondary-panel-bg)]`.  
> **Cursor:** `.cursor/rules/exxat-primary-nav-secondary-panel.mdc` · `.cursor/skills/exxat-primary-nav-secondary-panel/SKILL.md`

## Stack (back → front)

| Level | Surface | Token / class | Notes |
|-------|---------|---------------|--------|
| **0** | Primary icon rail + app chrome | `--sidebar` (= `--brand-tint` on light product themes) | Darkest brand wash in the shell |
| **1** | Nested secondary panel (Library, etc.) | `--secondary-panel-bg` | **Lighter** than level 0; **same product hue** |
| **2** | Main page / inset content | `--background` | Lightest (white canvas light; dark charcoal dark) |

**MUST** derive secondary panel fill from **`--brand-tint` / `--brand-tint-light`**, not a fixed rose or neutral grey. When the user selects **Exxat One**, both levels use **indigo hue ~286**; **Prism** uses **rose ~342**; **`theme-custom`** follows `--custom-product-brand-color` via `ProductProvider`.

## OKLCH formulas (light)

```css
--sidebar: var(--brand-tint);
--secondary-panel-bg: color-mix(in oklch, var(--background) 40%, var(--brand-tint-light) 60%);
```

## OKLCH formulas (dark)

```css
--secondary-panel-bg: color-mix(in oklch, var(--card) 32%, var(--brand-tint) 68%);
```

Per-product **dark** theme blocks (`.theme-one.dark`, `.theme-prism.dark`, …) set **`--brand-tint-light`** where needed so mixes stay on-hue.

## Implementation

- **`NestedSecondaryPanelShell`** — `bg-[var(--secondary-panel-bg)]`, `ring-sidebar-border` (not generic `ring-border` alone).
- **Do not** set secondary panel to `bg-sidebar` (same as level 0 — loses elevation).
- **Do not** use `color-mix(… var(--sidebar) …)` without brand tokens if it drifts from active product theme.

## Product theme classes

- **`theme-one`** / **`theme-prism`** / **`theme-assessment`** — built-in OKLCH brand scales in `globals.css`.
- **`theme-custom`** — when user picks an accent in Settings; driven by `--custom-product-brand-color`.
- **`ProductProvider`** — applies `theme-one` vs `theme-prism` vs `theme-custom`; accent override only when it **differs** from the product default (see `accentOverrideActive` in `contexts/product-context.tsx`).

## Logo vs chrome

- **Chrome** (sidebar, secondary panel, KPI glow) follows **`--brand-tint` / `--brand-color`** per product.
- **Logo art** (mark + suffix) stays **Exxat pink** via `wordmarkColor` / `markGradient` in `lib/product-brand.ts` — recolouring a product in Settings changes **theme accent**, not corporate logo pink.

## See also

- **`docs/kpi-flat-band-pattern.md`** — flat KPI strip uses brand glow only, no surface
- **`apps/web/AGENTS.md` §4.6** — secondary panel wiring
