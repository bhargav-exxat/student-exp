import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { exxatBuilderDevSync } from "@exxatdesignux/product-framework/vite/exxat-builder-dev-sync"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    exxatBuilderDevSync(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    /** One Zustand store instance — never bundle product-framework twice. */
    dedupe: ["@exxatdesignux/product-framework"],
  },
  css: {
    /**
     * Tailwind v4 + `@tailwindcss/vite` does not require postcss. We
     * explicitly opt out of postcss config discovery so Vite does not
     * walk up the workspace tree and pick up the parent
     * `packages/ui/postcss.config.mjs`, which in this monorepo pins a
     * native lightningcss binary that may be missing per-platform.
     */
    postcss: { plugins: [] },
    transformer: "postcss",
  },
  server: {
    host: "127.0.0.1",
    /**
     * Customer apps default to the **5000-series** so a DS dev server
     * on `:4000` (see `apps/web/vite.config.ts`) and a customer-app dev
     * server can coexist on the same machine without colliding on the
     * old shared `:3000`. Alt ports: `pnpm dev:5001`, `pnpm dev:5005`.
     */
    port: 5000,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
