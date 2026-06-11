# Modern SaaS patterns — the canon Exxat DS works against

> **Audience:** humans + AI agents.
> **Companion to:** [`exxat-senior-ux/SKILL.md`](../../../.cursor/skills/exxat-senior-ux/SKILL.md),
> [`exxat-ux-principles.mdc`](../../../.cursor/rules/exxat-ux-principles.mdc),
> [`jobs/`](./jobs/).

A senior designer recognizes the work. This doc names the patterns the best
products converged on in 2024–2026, so the agent can pattern-match instead
of inventing. **Cite by name + code** when you reference one in a design brief
(e.g. `Linear issue detail (M1, M4, M7)`).

## Canon products — cite by product, not by URL

| Product | What to learn from it |
|---------|-----------------------|
| **Linear** | Issue detail, command palette spine, density, keyboard-first, presence, "less chrome" |
| **Notion** | Inline editing, property panels, page-as-database, blocks, slash-commands |
| **Stripe Dashboard** | Record home, status chips, activity log, money-grade precision |
| **Figma** | Multiplayer, presence, side panel inspector, infinite-canvas chrome discipline |
| **Vercel** | Type-first hierarchy, dark-first, minimal chrome, log streams |
| **Height** | View tabs (table/board/timeline), custom fields, view parity |
| **Plain / Pylon** | Support detail = identity + timeline + actions; conversation-as-document |
| **Cron / Amie** | Keyboard-only flows, dense calendar, command surface |
| **Raycast** | Command palette as full app, extension surface, deep keyboard |
| **Arc Browser** | Control-stripped, content-first, sidebar as the only chrome |

## The 12 patterns that make products feel modern

### M1. Content-first chrome
The data is the star. Sidebars collapse to icons. Headers stay 48–56px. Page
surfaces are generous. No purple gradient on the top bar.

- **In DS:** `SiteHeader` ~h-12; `PrimaryPageTemplate` body has generous
  `max-w-[1440px]`; sidebar collapsible (`SidebarTrigger`).

### M2. Command palette as the spine
`⌘K` opens search + navigation + AI + recent. It is the primary navigation
for power users. The sidebar exists for orientation, not speed.

- **In DS:** `CommandMenu` (⌘K) + Ask Leo split (⌘⌥K).
  Rule: `exxat-command-menu.mdc`.

### M3. Side-panel detail over modal dialog
For non-destructive context-keeping actions (properties, export, invite,
preview, single-step compose), use a slide-in sheet — never a centered modal.

- **In DS:** `Sheet` (no Vaul).
  Rule: `exxat-drawer-vs-dialog.mdc`. Pattern:
  `apps/web/docs/drawer-vs-dialog-pattern.md`.

### M4. Status as a first-class citizen
Colored dots, chips, counts visible everywhere data appears. Status isn't
hidden in a detail page; it appears on rows, cards, headers, navigation.

- **In DS:** `ListHubStatusBadge` + `lib/list-status-badges.ts`. Available per
  row, board card, detail header, breadcrumb count slot.

### M5. Inline editing where data is read
Click the value, edit it. No bounce to forms for single-field changes.

- **In DS:** Inline-edit primitive emerging; until then, use a `Sheet` for
  multi-field, popover or contenteditable for single-field. Principle: P15.

### M6. Optimistic UI + undo
Low-risk actions (favorite, archive, status flip) feel instant; reconcile on
error. Undo via banner or in-place affordance — **never** toast
(`exxat-no-toast.mdc`).

- **In DS:** Optimistic state in `useTableState` selection ops; undo via
  `LocalBanner` with action.

### M7. Activity timeline on every record
Who did what when. The audit log is also a navigation device.

- **In DS:** `ActivityTimeline` primitive emerging. Compose from
  `lib/mock/activity` shape until then.

### M8. Empty states with one CTA + one sentence
Illustration optional. One sentence of context. One primary action. Never a
wall of help text or a tutorial inline.

- **In DS:** `EmptyState` primitive; voice from `docs/voice-and-tone.md`.

### M9. Skeleton, not spinner
Loading shapes content. Spinners only for indeterminate < 200ms.

- **In DS:** `Skeleton` primitive; suspense boundaries shape the body.

### M10. Type-first hierarchy
Weight, size, color do the heavy lifting before borders, boxes, or tints.
Ornament is rare and intentional.

- **In DS:** Token scale; body in `Inter`; display in `Ivy Presto` (only on
  `PageHeader` H1 by default).

### M11. Real-time presence + collaboration as default
If the product is shared, show who else is here — face rails, cursors,
status. Inviting others is one click from the page.

- **In DS:** `PageHeader variant="collaboration"` face rail +
  `InviteCollaboratorsDrawer`.
  Rule: `exxat-collaboration-access.mdc`.

### M12. AI as opt-in sidecar
Ask Leo style — never the primary path, never auto-runs on a record, always
discoverable, always cancellable. Deterministic path still exists.

- **In DS:** `AskLeoSidebar` + `⌘⌥K` toggle; never a "magic" button on a
  destructive surface.

---

## The anti-modern signals (what NOT to do)

| Signal | Why it's dated |
|--------|----------------|
| Toasts everywhere | Modern products use inline + banner + undo. Toasts get missed. |
| Full-width tab bars stretched edge-to-edge | 2010s pattern. Modern uses `w-fit` segmented controls. |
| Centered modals for everything | Sheets and routes carry more without breaking flow. |
| Color-coded sidebar sections | Modern is monochrome chrome + status color on data. |
| Modal wizards with progress bar | If it has > 3 steps, give it a route. |
| Spinners on initial load | Skeleton the content shape instead. |
| Hover-only affordances | Touch + keyboard need parity. |
| Icons without text labels in primary nav | Recognition fails for new users. |
| "Beautiful" gradients on chrome | Data should be beautiful; chrome should disappear. |
| Aggressive empty-state illustrations | One sentence + one action beats illustration + 5 tips. |
| Edit-takes-you-to-a-form for single fields | Inline edit (M5). |
| "Back to <parent>" button alongside breadcrumb | P1 — choose one. |
| Auto-running AI on record open | M12 — opt-in only. |

---

## Density layers (Linear / Vercel model)

| Layer | When |
|-------|------|
| **Cozy** (default) | Most surfaces; balances scan + breathing room |
| **Compact** | Power users on daily workflow; tables, command results |
| **Comfortable** | Accessibility (low-vision, motor); marketing-adjacent |

Provide a user-level setting where audiences differ; default to **cozy**.
Don't fork stacks per density.

---

## How to use this doc in a design brief

```
Reference (modern): Linear issue detail (M1, M4, M7),
                    Stripe customer record (M4, M11)
```

Cite the **patterns (Mx)** the agent applied, not just the product. Forces
clear thinking and lets reviewers verify intent.

## See also

- [`../../../.cursor/skills/exxat-senior-ux/SKILL.md`](../../../.cursor/skills/exxat-senior-ux/SKILL.md) — persona
- [`../../../.cursor/rules/exxat-ux-discovery-protocol.mdc`](../../../.cursor/rules/exxat-ux-discovery-protocol.mdc) — brief gate
- [`../../../.cursor/rules/exxat-ux-principles.mdc`](../../../.cursor/rules/exxat-ux-principles.mdc) — principles + breaks
- [`./jobs/`](./jobs/) — canonical reference per job type
- [`./component-selection-guide.md`](./component-selection-guide.md) — picking the composition
- [`./blueprints/`](./blueprints/) — framework-agnostic surface specs
- [`./voice-and-tone.md`](./voice-and-tone.md) — copy rules
