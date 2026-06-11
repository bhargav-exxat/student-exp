# Global command palette (⌘K)

**Code:** `components/command-menu.tsx`, config **`buildCommandMenuConfig()`** in **`lib/command-menu-config.ts`**, wired in **`src/App.tsx`** via **`CommandMenuProvider`**. Searchable row data is built in **`lib/command-menu-search-data.ts`** (not inside the shell component).

## Role

The command menu is the app’s **global search and AI entry**—one place to jump to routes, library pages, patterns, and AI starters. It is **not** a duplicate of the left sidebar; it **indexes** product surfaces for fast discovery.

## User model

| Need | Where it lives |
|------|----------------|
| **Find a page, component, or pattern** | Palette — filterable list, **Enter** to navigate. |
| **Quick AI / natural language** | Prefer **short answers or “research” snippets inside the palette** when the product can return compact, citeable results without leaving the flow. |
| **Long or complex answers** | **Ask Leo** right sidebar — multi-step reasoning, long-form help, or anything that does not fit a small results surface. |

**Design rule:** Treat the palette as **progressive disclosure**—lightweight results first in-menu; **escalate** to Ask Leo when the answer is too large or needs a dedicated conversation surface.

## Keyboard

- **⌘K / Ctrl+K** — open / toggle the palette (global listener in `CommandMenu`).
- **Ask Leo** remains **⌘⌥K / Ctrl+Alt+K** (see `.cursor/rules/exxat-kbd-shortcuts.mdc`) so it does not collide with table search where both exist.

## Configuration

- **Static groups** (AI suggestions, Navigation, Components, Patterns) live in **`lib/command-menu-config.ts`**.
- Optional **`dataGroups`** are passed to **`buildCommandMenuConfig({ dataGroups })`** from the app shell. **Implementation:** **`getCommandMenuSearchDataGroups()`** in **`lib/command-menu-search-data.ts`** maps mock/API rows (e.g. placements with student names) to **`CommandMenuItem`** rows with **`label`**, **`href`**, and **`keywords`** for cmdk filtering. The layout uses **`buildCommandMenuConfig({ dataGroups: getCommandMenuSearchDataGroups() })`**. Keep domain mapping **outside** `command-menu.tsx` so data sources can change without editing the shell.
- **`searchOnly` on `CommandMenuGroup`:** cmdk shows **every** mounted item when the search box is empty. For large indexes (hundreds of placements), set **`searchOnly: true`** on that group so **`command-menu.tsx`** does not render it until the user has typed a non-empty query. Static groups (AI, Navigation, …) stay visible on open; the data group appears once the user searches.

## Files (quick reference)

| Piece | Location |
|-------|----------|
| Palette UI | `components/command-menu.tsx` |
| Static groups + `buildCommandMenuConfig` | `lib/command-menu-config.ts` (`CommandMenuGroup.searchOnly`) |
| Row → menu items (placements, etc.) | `lib/command-menu-search-data.ts` |
| Provider + `dataGroups` | `src/App.tsx` |

## Sidebar

**“Search or ask Leo”** in the sidebar opens the same palette; shortcuts and copy should stay aligned with **`AGENTS.md` §7.1**.

---

Keep this document aligned with **`apps/web/AGENTS.md` §7.1** when behavior or copy changes.
