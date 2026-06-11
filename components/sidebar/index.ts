// Barrel re-export for the sidebar shell.
// Consumers SHOULD import via `@/components/sidebar`; per-file paths still
// work as escape hatch (e.g. `@/components/sidebar/secondary-panel`).
//
// See apps/web/docs/components-audit-2026-05.md §2.3.
export * from "./app-sidebar"
export * from "./app-sidebar-dynamic"
export * from "./sidebar-shell"
export * from "./sidebar-auto-collapse"
export * from "./sidebar-auto-open"
export * from "./nav-main"
export * from "./nav-secondary"
export * from "./nav-documents"
export * from "./nav-user"
export * from "./secondary-nav"
export * from "./secondary-panel"
