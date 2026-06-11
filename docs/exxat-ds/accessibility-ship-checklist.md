# Accessibility ship checklist

Every new or materially changed surface **MUST pass this checklist** before merge. Target: **WCAG 2.1 Level AA** (2.2 where noted). Pair with **`AGENTS.md` §8**, **`.cursor/rules/exxat-accessibility.mdc`**, and **`.cursor/skills/exxat-accessibility/SKILL.md`**.

## Before you ship (all surfaces)

- [ ] **One H1 per route** — page title in `<main>` only; side panels use **`h2`**, not a second `<h1>`.
- [ ] **Skip link** — shell exposes “Skip to main content”.
- [ ] **Overlay titles** — every `Dialog` / `Sheet` has a **`Title`** (visible or `sr-only`).
- [ ] **Typography** — no visible copy below **11px** (`text-xs` minimum).
- [ ] **Touch targets** — icon-only controls **≥ 24×24 CSS px**.
- [ ] **Icons (Case A/B/C)** — see **`AGENTS.md` §8.6**.
- [ ] **Format hints** — persistent **`FormDescription`**, not placeholder-only.
- [ ] **Keyboard** — focus visible; shortcuts per **`exxat-kbd-shortcuts.mdc`**.
- [ ] **Tab semantics** — view switchers use **`role="toolbar"`**, not misused `tablist`.
- [ ] **Font Awesome only** — no Lucide; run **`fa:subset-audit`** when adding glyphs.

## Theme modes

Verify in **light**, **dark**, **HC light**, and **HC dark** when changing chrome, forms, sidebar, or tokens.

- [ ] Contrast on the surface the control sits on (sidebar, card, sheet).
- [ ] HC / forced-colors — state not color-only; use **`hc:`** + **`forced-colors:`** variants.

## Automated pass

- [ ] **axe** on `<main>` — zero WCAG 2.x AA violations (light + dark minimum).

---

*Vendored from `@exxatdesignux/ui` consumer-extras. Workspace copy: `apps/web/docs/accessibility-ship-checklist.md`.*
