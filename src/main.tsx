import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, createBrowserRouter } from "react-router-dom"

import "@fontsource-variable/inter/index.css"
import "./styles/globals.css"

import { DevChunkLoadRecovery } from "@/components/dev-chunk-load-recovery"

import { App } from "./App"
import { routes } from "./routes"

/**
 * Vite entry — replaces the Next root layout (`app/layout.tsx`).
 *
 * The HTML shell, theme-color meta, Adobe Fonts preconnect, and Font
 * Awesome kit script live in `index.html` (static, no JS needed).
 *
 * `App` wraps the route tree with the same provider stack the Next
 * layout used (Theme, Tooltip, Product, etc.). Per-section providers
 * (Library secondary panel, dashboard view) live on the route shells
 * that need them — see `src/App.tsx`.
 *
 * `next/font/google` Inter is replaced by `@fontsource-variable/inter`
 * which loads the same weights as a self-hosted variable font with
 * zero layout shift. The `--font-sans` CSS variable is set on
 * `document.documentElement` once on boot so the rest of the DS
 * (tokens-themes, surfaces) sees the same font-family token Next had.
 */

document.documentElement.style.setProperty(
  "--font-sans",
  "'Inter Variable', 'Inter', system-ui, sans-serif",
)

const router = createBrowserRouter([
  {
    element: <App />,
    children: routes,
  },
])

const rootEl = document.getElementById("root")
if (!rootEl) {
  throw new Error("Root element #root not found in index.html")
}

createRoot(rootEl).render(
  <StrictMode>
    <DevChunkLoadRecovery />
    <RouterProvider router={router} />
  </StrictMode>,
)
