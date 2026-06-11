# Design → Engineering Handoff

This template is the **single artifact** the agent produces at the end of any
design task that creates or rebuilds a surface (page, hub, detail view,
wizard, drawer, sheet). It is the contract between the designer who shaped
the work in the brief and the engineer who ships it.

The agent fills this in as part of the `exxat-ux-discovery-protocol` flow.
The engineer reads it once, runs `exxat-ui audit <file>` against the
generated files, and is done.

---

## 1. Job-to-be-done

> Single sentence. The decision or action this surface enables for the user.
> Copy from the design brief — do not invent.

(example) *Coordinator identifies and acts on at-risk students before placement.*

## 2. Audience & frequency

> Persona (admin / coordinator / faculty / student / preceptor) + how often
> they hit this surface (daily / weekly / occasional).

(example) *Program coordinator, daily, keyboard-first.*

## 3. Pattern + IA

> The DS pattern this surface uses + the information architecture shape.
> Should match the brief.

- **Surface kind**: route | sheet | dialog | inline (one of the four)
- **Layout**: page-header + ?? (single column / split / data-table grid / …)
- **Navigation**: breadcrumb? back affordance? anchor sub-nav?
- **Header tier**: identity, status, KPI, ⋯ overflow, primary CTA

## 4. Reference implementations

> One **repo** reference + two **modern SaaS** analogues (cite by product
> name + Mx codes from `docs/exxat-ds/modern-saas-patterns.md`).

- **Repo**: `apps/web/components/<file>.tsx`
- **Modern**: `<Product 1>` (Mx, Mx); `<Product 2>` (Mx, Mx)

## 5. Components used (DS inventory)

> Every DS primitive consumed. The agent fills this in by inspecting its
> own diff. No new bespoke widgets unless approved in the brief.

| Primitive | From | Why |
|-----------|------|-----|
| `PageHeader` | `@exxatdesignux/ui/page-header` | Identity + actions row |
| `HubTable` | `@/components/data-views` | Rows + filters + properties |
| … | … | … |

## 6. Tokens consumed

> Every CSS custom property the agent referenced. No hex literals — see
> `exxat-token-discipline`.

- Colors: `--exxat-color-bg-app`, `--exxat-color-text-primary`, …
- Spacing: `--exxat-spacing-*`
- Radii: `--exxat-radius-*`
- Shadow / elevation: `--exxat-shadow-*`

## 7. Icons used

> Font Awesome Pro classes. Add to the subset audit (`fa:subset-audit`)
> if any are new to the kit.

- `fa-light fa-graduation-cap` — student identity
- `fa-light fa-shield-check` — compliance status
- …

## 8. Accessibility floor

> Filled by the agent automatically (the universal a11y rule is on). Engineer
> verifies by running axe / Deque on the deployed surface.

- [x] One H1 per page; record name in `PageHeader.title` only
- [x] Single primary CTA; everything else is outline / ghost / link
- [x] `Tablist` semantics correct (no buttons inside `role=tablist`)
- [x] All interactive targets ≥ 24 × 24 CSS px
- [x] Contrast ≥ 4.5 : 1 for text, ≥ 3 : 1 for UI / focus
- [x] Every icon has either `aria-hidden` (decorative) or `aria-label` + tooltip (informational)
- [x] Format hints rendered as `FormDescription`, not placeholder
- [x] Every primary action has an `Enter` shortcut + visible Kbd hint
- [x] Every cancel action accepts `Esc`

## 9. Data shape

> What rows / records / fields this surface reads from. Engineer wires the
> real API; the agent uses `lib/mock/<entity>.ts` for the demo dataset.

- **Mock**: `apps/web/lib/mock/<entity>.ts`
- **API contract** (when known): `<endpoint>` returns `<RowShape>`
- **State container**: `useTableState({ data, columns })`

## 10. Empty / loading / error

> Every list, detail, and action ships all three states. Filled in by the
> agent; engineer verifies the copy.

- **Loading**: skeleton (`<HubTableSkeleton />` or matched shape)
- **Empty**: copy + primary CTA to start the flow
- **Error**: copy + retry affordance + Ask Leo entry point

## 11. Keyboard map

> Every shortcut bound on this surface. The agent must declare these so the
> engineer can write a Playwright test against them.

| Action | Shortcut |
|--------|----------|
| Open Add view | `1..9` |
| Submit primary form | `Enter` |
| Cancel | `Esc` |
| Search | `⌘K` / `Ctrl+K` |
| Ask Leo | `⌘⌥K` / `Ctrl+Alt+K` |
| New record | `⌘⌥N` |

## 12. Deviations from principles

> Any P9–P20 principle the design intentionally breaks, and the one-sentence
> reason. P1–P8 cannot be deviated from. If this section has rows, the
> engineer must include them in the PR description.

| Principle | Reason |
|-----------|--------|
| P14 (density) | Mixed audience — added density toggle, default cozy |

## 13. Out of scope

> What this surface deliberately does **not** do. Helps the engineer decide
> what tickets *not* to file.

(example)
- Inline editing of student name (v2)
- Bulk message (lives on the list hub, not on the detail)

## 14. Open questions

> Things the brief could not answer. Engineer pings the designer or product.

- (example) Should the compliance badge link out to the source document or open in a side panel?

## 15. Stack note

The reference app and `create-exxat-app` scaffold both ship **Vite + react-router-dom**.
Routes live under `src/views/`; navigation helpers are in `@/lib/router-compat`.
No framework port step is required when merging designer work into production.

---

## How the engineer uses this file

1. Read sections 1–3 to understand intent.
2. Skim sections 4–7 to confirm the agent reused DS primitives + tokens (no surprises).
3. Run `npx --package=@exxatdesignux/ui exxat-ui audit <generated-file>.tsx` to validate the floor automatically.
4. Wire real data per section 9.
5. Verify section 10 states render with real API data (not just mocks).
6. Add section 11 shortcuts to the route's e2e test.
7. Surface section 12 deviations + section 14 open questions in the PR description.

If any section is missing or hand-wavy, the handoff is incomplete. Push it
back to the designer / agent before merging.
