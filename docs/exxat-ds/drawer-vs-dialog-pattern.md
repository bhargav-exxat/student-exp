# Sheet panel vs dialog vs route

> **Related:** `docs/data-views-pattern.md` (Page vs drawer), **`AGENTS.md` §6.4**, **`.cursor/rules/exxat-page-vs-drawer.mdc`**. **This doc** splits **floating `Sheet` panels** vs **modal dialog** when both stay on the same route.

## Sheet (side panel — product “drawers”)

**Use when:**

- The **list or hub behind the panel** still matters (user compares, copies, or dismisses and continues browsing).
- The flow is **medium length** — export options, table/column properties, invite collaborators, filters that mirror the grid.
- **Width** helps — tables of options, multi-field forms that would feel cramped in a narrow dialog.

**Implementation:** **`Sheet`** from `@exxatdesignux/ui/components/sheet` with the floating inset pattern (`showOverlay={false}`, `getFloatingSheetInsetProps`) — see `ExportDrawer`, `TablePropertiesDrawer`, `InviteCollaboratorsDrawer`, `LibraryNewFolderSheet`.

**Avoid when:** The task is the **only** thing the user should focus on and the parent would distract (prefer **dialog** for a sharp confirm, or **route** for a full wizard).

## Dialog (modal)

**Use when:**

- You need a **hard stop** — user must answer or dismiss before interacting with the page again (confirm delete, acknowledge legal, pick a single blocking choice).
- The content is **short and focused** — one decision, one form step, or a compact message with primary/secondary actions.
- **Destructive or irreversible** actions — pair with clear copy; **Esc** / Cancel returns safely.

**Examples:** `AlertDialog`, confirm-before-remove, “Save changes?” when navigating away.

**Avoid when:** Users need to **reference** the grid or copy values from the page while the panel is open — use a **sheet panel** or **inline** pattern instead.

## Route (new page)

Use when the work is **primary**, **long**, **multi-step**, or deserves its **own URL** — see **`exxat-page-vs-drawer.mdc`** and **`AGENTS.md` §6.4**.

## Quick matrix

| Need | Sheet panel | Dialog | Route |
| --- | --- | --- | --- |
| Keep hub visible | Yes | No (blocks) | No |
| Short confirm / alert | Rare | Yes | Overkill |
| Long form / wizard | Cramped | No | Yes |
| Properties tied to a table | Yes | Too small | Optional |

## Accessibility

- **Dialog / sheet:** Must expose a **title** (`DialogTitle`, `SheetTitle`) — use `sr-only` if visually hidden.
- **Focus trap** is expected in dialogs; sheet panels should still **restore focus** on close to the invoking control.

## See also

- **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**, **`.cursor/skills/exxat-drawer-vs-dialog/SKILL.md`**
- **`exxat-no-toast.mdc`** — use dialog/banner/inline, not toasts, for outcomes that need acknowledgment.
