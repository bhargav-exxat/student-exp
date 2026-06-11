/**
 * Searchable ⌘K rows from mock/API data. Wire new sources here — not in `command-menu-config.ts`.
 *
 * In this demo app the global ⌘K palette ships with route + Ask Leo entries only.
 * When a consumer adds a real data source (e.g. a Students hub), build a
 * `CommandMenuGroup` here with `searchOnly: true` so the palette stays
 * lightweight on open and the items only surface once the user types.
 */

import type { CommandMenuGroup } from "@/lib/command-menu-config"

/** Demo rows for hubs — none in this app. Real apps populate this from their primary entity. */
export const COMMAND_MENU_SEARCH_DATA_GROUPS: CommandMenuGroup[] = []

export function getCommandMenuSearchDataGroups(): CommandMenuGroup[] {
  return COMMAND_MENU_SEARCH_DATA_GROUPS
}
