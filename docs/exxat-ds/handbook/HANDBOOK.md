# Exxat DS — Handbook

> **Start here.** One page. Read in 10 minutes. Links out to everything else.
>
> **Audience:** designers, engineers, contributors, AI agents — anyone shipping UI in the Exxat product.
>
> **Working with an AI assistant?** Read [`.cursor/skills/exxat-token-economy/SKILL.md`](../../../.cursor/skills/exxat-token-economy/SKILL.md) **first** (or `.claude/skills/exxat-token-economy/SKILL.md` for Claude Code). It's a one-page pre-flight that cuts token usage by ~50%: a task → minimum-file-set table, the five-question rule check, and tiny scaffolds that mean the assistant never has to re-read this handbook for the common case.

---

## 1. Five principles

Every screen, primitive, and pattern in this design system serves one or more of these. When in doubt, the principle wins over the convenience.

1. **Clarity over decoration.** Users see one product, one shell, one rhythm. Surprise (mystery icons, hidden states, novel layouts) is a tax on attention.
2. **Progressive disclosure.** Beginners see what they need. Power users reach what they want. Default to the simpler surface; expose density on opt-in (Properties drawer, view tabs, secondary panel).
3. **Same-shaped tools.** A hub looks like a hub. A drawer looks like a drawer. A KPI looks like a KPI. Pick the canonical primitive (§5 reference pages) before composing your own.
4. **Accessibility is non-negotiable.** WCAG 2.1 AA is the **floor**, not the goal. Keyboard, screen-reader, contrast, touch-target, format hints — all enforced by rules, lints, and a checklist.
5. **The data drives the chrome.** KPIs, status, trend polarity, descriptions — they come from the dataset (or the product) and are honest. No spin arrows, no decorative placeholders.

---

## 2. How to build a hub in 6 steps

This is the **happy path** for the most common task: "I have an entity (placements, sites, columns, tokens, …); ship a hub for it." Follow these in order and the page lands at "best UX/UI", not "random design".

| Step | What to do | Where it lives | Rule |
|---|---|---|---|
| 1 | Add typed mock rows in `lib/mock/<entity>.ts`. Aim for ~12 realistic records. | `apps/web/lib/mock/` | `.cursor/rules/exxat-centralized-list-dataset.mdc` |
| 2 | Write **one** KPI helper `lib/mock/<entity>-kpi.ts` returning `MetricItem[]` (≤ 4 tiles). | same | `exxat-kpi-max-four.mdc`, `exxat-kpi-trends.mdc` |
| 3 | Build the column defs (`ColumnDef[]`). Set `filter:` per column to get filter chips automatically. | `apps/web/components/<entity>-table.tsx` | `exxat-data-tables.mdc` |
| 4 | Mount **`HubTable`** (NOT raw `<DataTable>`) inside `ListPageTemplate.renderContent`. `HubTable` wires `useTableState`, toolbar (search + filter chips + sort), and the **Properties drawer** in one place. | `apps/web/components/<entity>-table.tsx` | `exxat-data-tables.mdc` |
| 5 | Compose the page client with `PrimaryPageTemplate` → `ListPageTemplate` (KPIs in `metrics`, view tabs in `defaultTabs`, the `HubTable` in `renderContent`). | `apps/web/components/<entity>-client.tsx` | `exxat-list-page-connected-views.mdc` |
| 6 | Add to nav (`lib/mock/navigation.tsx`). If the hub needs scoped sub-navigation (e.g. categories), declare `secondaryPanel: "<id>"` and register the panel. | `apps/web/lib/mock/navigation.tsx`, `apps/web/components/sidebar/secondary-panel.tsx` | `exxat-primary-nav-secondary-panel.mdc` |

**Reference pages to copy:** `apps/web/components/library-table.tsx` + `library-client.tsx` (seven-view hub), `columns-showcase.tsx` (`LibraryTable` + custom columns), `tokens-themes-client.tsx` + `tokens-hub-auxiliary-views.tsx`. See **`hub-supported-views-pattern.md`** (vendored under `docs/exxat-ds/patterns/`).

> **Stop signs.** If you find yourself building a parallel table stack, a second metrics strip, a custom filter row, or pasting raw `<DataTable>` into `renderContent` — **stop and re-read** `.cursor/rules/exxat-reuse-before-custom.mdc`.

---

## 3. Where everything lives

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRINCIPLES + HANDBOOK   →  docs/HANDBOOK.md (this file)             │
│                                                                     │
│ FOUNDATIONS                                                         │
│   tokens                →  docs/token-taxonomy.md                   │
│   icons (Font Awesome)  →  .cursor/rules/exxat-fontawesome-icons    │
│   typography            →  docs/token-taxonomy.md (font-* tokens)   │
│   spacing / radius      →  docs/token-taxonomy.md (--exxat-*)       │
│   color & themes        →  apps/web/components/tokens-themes-*      │
│   voice & tone          →  docs/voice-and-tone.md                   │
│   glossary              →  docs/glossary.md                         │
│   reference pages       →  docs/reference-implementations.md        │
│                                                                     │
│ DECIDING (selection guides)                                         │
│   which component?      →  docs/component-selection-guide.md        │
│   page vs drawer vs     →  docs/drawer-vs-dialog-pattern.md         │
│     dialog vs route        + .cursor/rules/exxat-{drawer-vs-dialog, │
│                              page-vs-drawer}.mdc                    │
│   card vs row vs list   →  docs/card-vs-rows-pattern.md             │
│                                                                     │
│ BLUEPRINTS  (framework-agnostic specs — one per pattern)            │
│                         →  docs/blueprints/                         │
│                            page-header · data-table ·               │
│                            list-page-template · board-card ·        │
│                            key-metrics                              │
│                                                                     │
│ PATTERNS  (long-form narrative — the "why" + the "how")             │
│                         →  docs/*.md (data-views-pattern,           │
│                            kpi-trend-pattern, drawer-vs-dialog-     │
│                            pattern, dedicated-search,               │
│                            command-menu, …)                         │
│                                                                     │
│ RULES  (binding MUST / MUST NOT — for AI agents + reviewers)        │
│                         →  .cursor/rules/*.mdc                      │
│                                                                     │
│ SKILLS  (workflows + checklists — for AI agents doing a task)       │
│                         →  .cursor/skills/  +  .claude/skills/      │
│                                                                     │
│ MIGRATIONS  (deprecation history, every breaking change)            │
│                         →  docs/migrations/                         │
│                                                                     │
│ AGENT HANDBOOK  (authoritative §-numbered manual)                   │
│                         →  apps/web/AGENTS.md                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Quick "which file should I open?" cheat-sheet

| You want to… | Open this |
|---|---|
| Pick the right component for a job | [`docs/component-selection-guide.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/component-selection-guide.md) |
| Know what "hub" / "view tab" / "KPI band" mean | [`docs/glossary.md`](./glossary.md) |
| Write empty-state / error / button copy | [`docs/voice-and-tone.md`](./voice-and-tone.md) |
| Find the canonical reference page to copy | [`docs/reference-implementations.md`](./reference-implementations.md) |
| Know the spec for a pattern | [`docs/blueprints/`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/blueprints/) |
| Understand the "why" of a pattern | [`docs/<pattern>-pattern.md`](.) |
| Know the binding MUST / MUST NOT | [`.cursor/rules/`](../../../.cursor/rules/) |
| Run a recurring agent workflow | [`.cursor/skills/`](../../../.cursor/skills/) or [`.claude/skills/`](../../../.claude/skills/) |
| Token name & semantics | [`docs/token-taxonomy.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/token-taxonomy.md) |
| Full authoritative handbook | [`apps/web/AGENTS.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/AGENTS.md) |

---

## 4. Rule precedence (when sources conflict)

If two docs say different things, **the higher row wins**:

1. **`.cursor/rules/*.mdc`** — these are MUST / MUST NOT; they bind the AI agent and the reviewer.
2. **`apps/web/AGENTS.md`** — authoritative §-numbered handbook. The rules above are summaries of this.
3. **`docs/blueprints/*.md`** — framework-agnostic specs for a single pattern.
4. **`docs/*-pattern.md`** — long-form narrative for a pattern.
5. **Reference page in code** (`apps/web/components/<reference>.tsx`) — the working implementation.
6. **This handbook** — orientation only. If it conflicts with rules or AGENTS, the rules/AGENTS win.

> **Found a conflict?** Open a PR that updates the *binding* layer (rule or AGENTS section) first, then propagate down. Don't fork the truth.

---

## 5. The canonical primitives (memorize these)

These are the ones you'll use on >90% of screens. If a screen needs something else, it almost certainly already exists — search `components/` before building.

| Need | Primitive | Lives in |
|---|---|---|
| Page chrome (breadcrumbs, site header, max-width content rail) | `PrimaryPageTemplate` | `apps/web/components/templates/primary-page-template.tsx` |
| Hub frame (header + metrics + view tabs + content) | `ListPageTemplate` | `packages/ui` |
| **Hub view body** (table + search + filters + Properties drawer + bulk-actions) | **`HubTable`** | `packages/ui` (re-exported from `@/components/data-views`) |
| Page header (title + subtitle + actions + collaborators rail) | `PageHeader` | `apps/web/components/page-header.tsx` |
| KPI strip / band | `KeyMetrics` (`variant="flat"` on hubs) | `packages/ui` |
| Status chip + icon | `ListHubStatusBadge` + `lib/list-status-badges.ts` | `apps/web/components/` |
| Board / kanban card | `ListPageBoardCard` + primitives | `packages/ui` |
| Side overlay | `Sheet` / `Drawer` (NOT toast — `exxat-no-toast.mdc`) | `packages/ui` |
| Persistent banner | `LocalBanner` / `SystemBanner` | `packages/ui` |
| Inline status / format hint | `FormDescription`, inline `<small>` | `packages/ui` |
| Tooltip | `Tip` / `Tooltip` | `packages/ui` |
| Keyboard shortcut hint | `Kbd` (`variant="bare"` inside buttons) | `packages/ui` |
| Global search | `CommandMenu` (⌘K) | `apps/web/components/command-menu.tsx` |
| AI assistant chrome | Ask Leo side panel (⌘⌥K) | `apps/web/components/` |

For a fuller decision tree see [`docs/component-selection-guide.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/docs/component-selection-guide.md).

---

## 6. The shortest accessibility checklist

Run this on every PR. If you can't tick every box, the change isn't ready. (Full list: `.cursor/skills/exxat-accessibility/SKILL.md` and [`AGENTS.md` §8](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/AGENTS.md).)

- [ ] **Keyboard.** Every interactive thing reachable via Tab + activatable via Enter / Space. Focus ring visible (≥ 3:1).
- [ ] **Touch target ≥ 24×24 CSS px** (or 24 px spacing) per WCAG 2.5.8.
- [ ] **Icons that mean something** have a text alt — either adjacent label (Case A, `aria-hidden`), or `role="img" + aria-label + Tooltip` (Case B), or `aria-label + Tooltip` on the button (Case C). No silent icons.
- [ ] **Contrast.** Text ≥ 4.5:1; UI components ≥ 3:1. Don't encode state with color alone — pair with icon or label.
- [ ] **Format hints are persistent**, never placeholder-only. Use `FormDescription`.
- [ ] **Dialogs / drawers / sheets** have a `Title` (use `sr-only` if visually hidden).
- [ ] **Tabs** use `role="tablist"` correctly (no mixed children); composite switchers use `role="toolbar"` instead.
- [ ] **No toast.** Use banners, inline status, or dialogs (`exxat-no-toast.mdc`).
- [ ] **HC modes.** Forced-colors and `data-contrast="high"` covered for any fill-only state (progress, gauge, pill).

---

## 7. The "you're done" definition

A hub or screen is **done** when:

1. It uses `PrimaryPageTemplate` + `ListPageTemplate` (or another canonical template).
2. The data surface is `HubTable` (or, for non-hubs, the right primitive from §5).
3. KPIs use `KeyMetrics` with `delta` for counts, `description` for prose, ≤ 4 tiles, polarity set correctly.
4. The §6 accessibility checklist is green.
5. Copy passes [`docs/voice-and-tone.md`](./voice-and-tone.md).
6. No new shared primitives were added without `.cursor/rules/exxat-reuse-before-custom.mdc` approval.
7. The §13 PR-review checklist in [`AGENTS.md`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/AGENTS.md#section-13) is green.

---

## 8. Where to ask for help

- **Code-level questions** — open the file referenced in a rule's "See also" section.
- **Pattern-level questions** — open the matching `docs/*-pattern.md`.
- **"Is this the right approach?"** — read [`.cursor/rules/exxat-reuse-before-custom.mdc`](../../../.cursor/rules/exxat-reuse-before-custom.mdc). If still unsure, ask before building.
- **AGENTS.md is too long** — that's why this handbook exists. Bring the §-number you're stuck on; we'll split it out.

---

*This file is intentionally short. If you want to add something, ask whether it belongs in a rule, a pattern, a blueprint, or the glossary instead.*
