# Exxat DS — Voice and tone

> The single biggest driver of "this feels like one product" — or "this feels random" — is **copy**. Empty states, errors, buttons, banners, validation, labels. This doc is the binding reference for all of it.
>
> **Audience:** designers writing copy, engineers shipping strings, AI agents drafting UI text. Reviewed in PR alongside `.cursor/rules/exxat-accessibility.mdc`.

---

## 1. Voice (the constant)

Exxat copy is **clear, direct, and respectful**. We talk to grown professionals (faculty, admins) and to students. We never:

- talk down (no "Oops!" / "Whoops" / "Uh-oh"),
- over-celebrate ("Awesome!" / "Great job!" / 🎉),
- guilt-trip ("You haven't… yet" / "Don't forget!"),
- hide the cause behind metaphor ("Something went wrong" with no detail),
- shout (sentence case everywhere; ALL CAPS only for system status acronyms).

We **always**:

- name the **thing**: the entity (placement, site, student), the action (Save, Invite, Export), the outcome (saved, sent, downloaded),
- say what **changed** or what **the user can do next**,
- use **present tense** (`Saving` / `Saved` / `Try again`), not past-aspirational (`We've saved your changes!`),
- use **active voice** (`Exxat couldn't save the placement.` not `The placement could not be saved.`).

---

## 2. Tone (the variable)

Tone shifts by surface. Same voice, different temperature.

| Surface | Tone | Example |
|---|---|---|
| Primary action label | Imperative, 1–3 words | "Save", "Invite people", "Export" |
| Empty state (filtered) | Helpful, names the filter | "No placements match the current filters. Clear them to see all 247." |
| Empty state (no data ever) | Welcoming, names the next step | "No placements yet. Add your first one to get started." |
| Inline validation | Neutral, says the rule | "Use the format MM/DD/YYYY." |
| Banner (informational) | Calm, explains why | "Read-only — this term has ended." |
| Banner (warning) | Direct, says the consequence | "Saving will overwrite 3 students' assignments." |
| Banner (error) | Honest, names the failure + next step | "Exxat couldn't reach the placement service. Try again, or check your network." |
| Dialog (destructive confirm) | Specific, names the object | "Delete placement P-2026-014? This cannot be undone." |
| Microcopy (helper, hints) | Brief, format-only | "Out of 4.0", "MM/DD/YYYY" |

---

## 3. Buttons

| Pattern | Use | Example |
|---|---|---|
| **Sentence case** | Always | `Save`, `Invite people`, `Export selection` |
| **Title case** | Never | ~~`Save Changes`~~ → `Save changes` |
| **Verb-first imperative** | Primary actions | `Save`, `Send invite`, `Create placement`, `Download CSV` |
| **No "Please"** | The button is the request | ~~`Please save`~~ → `Save` |
| **Don't repeat the field name** | Inline context is enough | ~~`Save changes to placement`~~ → `Save` |
| **"Cancel" not "Discard"** | Cancel returns to a safe state; Discard is only for destructive draft loss | dialog primary = `Save changes`; cancel = `Cancel` |
| **Loading verb** | When in-flight, swap to `…` form, preserve width | `Save` → `Saving…` |
| **Disabled tooltip** | Always say why | "Add at least one collaborator first." |

### Don't

| ❌ Don't | ✅ Do |
|---|---|
| `Click here` | `Open placement` |
| `OK` | `Save`, `Got it`, `Continue` (the actual outcome) |
| `Submit` | `Send invite`, `Save changes`, `Create placement` |
| `Yes` / `No` in destructive dialogs | `Delete placement`, `Cancel` |
| `Loading…` for >2 s with no detail | `Loading placements…` (name the thing) |

---

## 4. Empty states

There are **three** kinds. The copy is different for each.

### 4a. Filter-empty ("zero matches")

The dataset has rows; the active filters hide all of them. Tell the user the filters are responsible and offer to clear them.

```
No placements match the current filters.
[Clear filters]
```

Rules:

- Name the entity ("placements", not "items").
- Mention "the current filters" — not just "no results".
- Surface a **Clear filters** action if the toolbar has any filters applied.
- If the search box is the only filter, the message becomes `No placements match "<query>".` (quote the query exactly).

### 4b. True-empty ("no data ever")

The dataset is empty for this user / scope. Tell them what to do next.

```
No placements yet.
Add your first one to start tracking student rotations.
[New placement]
```

Rules:

- One-line headline + one-line context.
- The CTA is the same imperative used elsewhere in the app — don't invent "Start now" for an empty state.
- If creation requires a precursor ("Add at least one site first"), say so and link to the precursor.

### 4c. Permission-empty ("not allowed to see")

The user can't see anything because of access. Don't show counts; don't suggest creating.

```
You don't have access to this hub.
Ask a coordinator to invite you with Viewer or higher access.
```

Rules:

- Name the access level required.
- Don't show row counts the user can't see.
- Don't expose the existence of restricted records by mentioning "0 of N hidden".

---

## 5. Errors

Errors must answer three questions: **What happened? Why? What can the user do?**

| Element | Required? | Example |
|---|---|---|
| Subject | required | `Exxat couldn't save the placement.` |
| Cause | when knowable | `The site was deleted while you were editing.` |
| Next step | required | `Choose another site or refresh.` |

### Don't

- `Something went wrong.` — every word is empty. Replace with the subject + cause.
- `Error 500: Internal Server Error.` — leak the trace ID to logs, not the user. User-facing: "Exxat had a problem. Try again in a moment."
- Toasts for errors. Use `SystemBanner` (route-level) or inline `FormMessage` (field-level). See [`exxat-no-toast.mdc`](../../../.cursor/rules/exxat-no-toast.mdc).

### Field-level (`FormMessage`)

Match the rule, not the field name. Keep under 60 chars.

| Rule | Message |
|---|---|
| Required | `This is required.` |
| Format (date) | `Use MM/DD/YYYY.` |
| Format (phone) | `Use +1 (555) 555-0100.` |
| Range (number) | `Enter a number between 0 and 4.0.` |
| Unique | `That ID is already in use.` |
| Server | `Exxat couldn't save this field. Try again.` |

---

## 6. Banners

We use **persistent banners** (not toasts) for all product feedback. See [`exxat-no-toast.mdc`](../../../.cursor/rules/exxat-no-toast.mdc) and `LocalBanner` / `SystemBanner` in `packages/ui`.

| Variant | Use | Lead with |
|---|---|---|
| `info` | Read-only / scope notice / "you're viewing X" | The fact: "Read-only — this term has ended." |
| `success` | Confirmed state change (long-lived; toasts forbidden) | The outcome: "Invite sent to 3 collaborators." |
| `warning` | Action will cause consequence | The consequence: "Saving will overwrite 3 students' assignments." |
| `error` | Recoverable failure | The subject + next step: "Exxat couldn't reach the placement service. Try again." |
| `destructive` | Pending destructive change | The object + reversibility: "This term will be archived in 7 days. Restore now to keep it." |

Rules:

- One banner per region. If two compete, the higher-severity wins.
- Pair a banner with an **action** when there's something the user can do (`[Restore]`, `[Try again]`, `[Open log]`).
- No exclamation marks. The variant color carries the tone.

---

## 7. Status badges

Status labels live in [`lib/list-status-badges.ts`](https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/apps/web/lib/list-status-badges.ts) and are shared across every surface (table, board card, list row). Don't fork labels per page.

| Type | Conventions | Example |
|---|---|---|
| Lifecycle | Title case, single word where possible | `Active`, `Draft`, `Archived`, `Pending` |
| Outcome | Past-tense verb when an action completed | `Approved`, `Rejected`, `Sent`, `Skipped` |
| Risk | Plain language, no jargon | `On track`, `At risk`, `Blocked` |
| Mandatory pairing | Color **AND** icon (WCAG 1.4.1 — never color alone) | green check, amber triangle, red circle-x |

Never: `OK`, `N/A`, `?` as a status label. Show the actual lifecycle state or `Unknown` with a tooltip describing how to resolve it.

---

## 8. KPI copy (the highest-stakes copy in the product)

KPIs read top-down: **label → value → trend chip → description**. The reader is scanning, not reading. Each line earns its place.

| Field | Rule | Example |
|---|---|---|
| `label` | Sentence case noun phrase. ≤ 24 chars. No "Total" prefix (the value is total by default). | `Active placements`, `New invites`, `Compliance issues` |
| `value` | The number. Use `tabular-nums`. Round to a sensible precision. Suffix unit (`%`, `hrs`) without space when natural. | `247`, `12 %`, `38 hrs` |
| `delta` | The **count** of change. Empty (`""` or `0`) hides the chip entirely. Never prose. | `+12`, `-3`, `+8 %` |
| `description` | The caption beneath the value row. Prose explaining what the number is or how it splits. Never the delta. | `vs last week`, `across 4 sites`, `left + right` |

See [`exxat-kpi-trends.mdc`](../../../.cursor/rules/exxat-kpi-trends.mdc) for the trend-polarity rules (when up means bad, set `trendPolarity: "lower_is_better"`).

### Don't

- `Total: 247` — drop "Total".
- `247 placements` in `value` — put `247` in `value`, `placements` is in `label`.
- `+5 (up 12 % from last week)` in `delta` — `delta = "+5"`, `description = "vs last week"`.

---

## 9. Form labels and helper text

| Element | Rule | Example |
|---|---|---|
| Label | Sentence case, no colon, no "*" — pair `*` decoration with `aria-required` only. | `Date of birth` |
| Required marker | Visible `*` (`aria-hidden`), programmatic `aria-required="true"`. | `Date of birth *` |
| Helper text | Persistent, format-first. Use `FormDescription`. Never placeholder-only. | `MM/DD/YYYY` |
| Placeholder | May mirror the format. Never the sole carrier. | `MM/DD/YYYY` |
| Inline error | Replaces helper while active. Match the rule, not the field name. | `Use MM/DD/YYYY.` |
| Unit in label vs description | Units go in description when context-dependent (`Out of 4.0` under "GPA"), in label when fixed (`Hours per week`). | — |

See [`exxat-accessibility.mdc`](../../../.cursor/rules/exxat-accessibility.mdc) §"Form fields — format hints MUST be persistent".

---

## 10. Dates, times, numbers

| Type | Format | Example |
|---|---|---|
| Date (UI) | Locale-aware, defaults to `MM/DD/YYYY` for en-US | `12/14/2025` |
| Date range | Same format, en-dash with hair-thin spaces (or hyphen-minus in mono) | `12/14/2025 – 12/20/2025` |
| Time | 12-hour with am/pm in lowercase | `2:30 pm` |
| Relative time | Use sparingly; pair with absolute on hover/tooltip | `Updated 3 hours ago` (tip: `12/15/2025, 11:14 am`) |
| Numbers | `tabular-nums`. Use thousands separator (`12,547`) for ≥ 4 digits | `12,547` |
| Currency | Symbol-first, no space (`$1,200.00`) | `$1,200.00` |
| Percent | No space (`12 %` is wrong, use `12%`) | `12%` |
| Duration | Short form (`38 hrs`, `2 wks`) | `38 hrs` |

---

## 11. Reviewer checklist (paste into PRs that touch copy)

- [ ] Sentence case (not title case) everywhere.
- [ ] No `Click here`, `Submit`, `OK`, `Loading…` without a noun.
- [ ] No toasts; banners or inline status instead.
- [ ] Empty state names the entity and surfaces a next action or "Clear filters".
- [ ] Errors answer: what / why / what now.
- [ ] Status labels come from `lib/list-status-badges.ts`, not new strings.
- [ ] KPI `delta` is a count; KPI `description` is prose. Polarity matches the metric.
- [ ] Form helper text is `FormDescription`, not placeholder-only.
- [ ] No exclamation marks outside `success` banners (and even those rarely).
- [ ] No emoji unless explicitly approved for that surface.

---

## See also

- [`HANDBOOK.md`](./HANDBOOK.md) — where this fits in the docs map
- [`glossary.md`](./glossary.md) — vocabulary
- [`.cursor/rules/exxat-no-toast.mdc`](../../../.cursor/rules/exxat-no-toast.mdc) — why banners, not toasts
- [`.cursor/rules/exxat-kpi-trends.mdc`](../../../.cursor/rules/exxat-kpi-trends.mdc) — KPI delta vs description
- [`.cursor/rules/exxat-accessibility.mdc`](../../../.cursor/rules/exxat-accessibility.mdc) — format-hint persistence rule
