// PageHeader was promoted to `@exxatdesignux/ui` on 2026-05-20 so
// non-Next consumers (Vite, Remix, docs sites) can compose hub headers
// without duplicating collaboration variants and face-row a11y wiring.
//
// This shim keeps every existing `import … from "@/components/page-header"`
// site working. Apps/web-specific helpers (label constants, role icon
// maps) still live in `lib/collaborator-access.ts`.
export * from "@exxatdesignux/ui/components/page-header"
