/**
 * Cookie name persisted by `@exxatdesignux/ui` `SidebarProvider` (`setOpen`).
 *
 * Versioned (`_v2`) on 2026-05-21 to drop stale values written by the pre-fix
 * code where incidental layout collapses clobbered the user's preference on
 * every navigation. The legacy `sidebar_state` cookie (without `_v2`) is
 * ignored on the server and actively deleted client-side on first mount.
 */
export const SIDEBAR_STATE_COOKIE_NAME = "sidebar_state_v2"

/** Read desktop sidebar expanded state for SSR `defaultOpen` (matches client cookie restore). */
export function sidebarDefaultOpenFromCookie(
  value: string | undefined,
): boolean {
  // No cookie OR malformed value → default expanded.
  // Only an exact `"false"` from the new cookie counts as a saved collapsed preference.
  return value !== "false"
}
