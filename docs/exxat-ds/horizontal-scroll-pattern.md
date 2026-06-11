# Exxat DS — Horizontal scroll controls

**Audience:** humans + AI agents. **Binding rule:** `.cursor/rules/exxat-horizontal-scroll.mdc` (synced by `exxat-ui sync-extras`).

When a row of tabs, breadcrumbs, or chips overflows its container, Exxat DS uses a **shared scroll control** — not ad-hoc chevrons on each side of the bar.

---

## Primitives

| Export | Package path | App re-export |
|---|---|---|
| `HorizontalScrollControls` | `@exxatdesignux/ui/components/ui/horizontal-scroll-controls` | `@/components/ui/horizontal-scroll-controls` |
| `HorizontalScrollRegion` | `@exxatdesignux/ui/components/ui/horizontal-scroll-region` | `@/components/ui/horizontal-scroll-region` |
| `useHorizontalScrollAffordances` | same as controls | same |
| `useHorizontalScrollAlignEnd` | same as controls | same |
| `horizontalScrollViewportClassName` | same as controls | same |

**Source (monorepo):** `packages/ui/src/components/ui/horizontal-scroll-controls.tsx`, `horizontal-scroll-region.tsx`.

---

## Mental model

```
┌─────────────────────────────────────────────────────────────┐
│  [ scrollable viewport — tabs / crumbs / chips ]  [ ← | → ] │  group-end (default)
└─────────────────────────────────────────────────────────────┘
```

- **Grouped control (default):** one segmented `[← | →]` button after the viewport (`controlsLayout="group-end"`).
- **Split (legacy):** prev before content, next after — only when product explicitly needs flanking chevrons.
- **Overflow detection:** `ResizeObserver` + scroll listener; controls render **only when** content overflows.

---

## `HorizontalScrollRegion` (preferred)

```tsx
<HorizontalScrollRegion
  ariaLabel="Views"
  controlsLayout="group-end"
  alignEnd={false}
>
  {children}
</HorizontalScrollRegion>
```

| Prop | Default | Use |
|---|---|---|
| `ariaLabel` | `"Scroll"` | Prefix for prev/next `aria-label`s |
| `controlsLayout` | `"group-end"` | `"split"` \| `"group-end"` \| `"group-start"` |
| `alignEnd` | `false` | Pin scroll to trailing edge (SiteHeader breadcrumbs) |

---

## Where it ships

| Surface | Reference |
|---|---|
| Hub view tabs | `ListPageTemplate` in `@exxatdesignux/ui/components/templates/list-page` |
| Record section tabs | `TabsListScrollRegion` in `@exxatdesignux/ui/components/ui/tabs` |
| SiteHeader breadcrumbs | `PageBreadcrumbTrail` (`variant="header"`) |

---

## MUST NOT

- Hand-build paired chevrons per surface when the shared primitives fit.
- Use split flanking chevrons unless explicitly required.

---

*Vendored from `@exxatdesignux/ui` consumer-extras. Workspace copy: `apps/web/docs/horizontal-scroll-pattern.md`.*
