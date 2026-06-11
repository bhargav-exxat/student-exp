"use client"

import * as React from "react"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import { isPlatformCreatorWorkspace } from "@exxatdesignux/product-framework"

const BUILDER_SESSION_KEY = "exxat-ds:builder-session:v1"

/**
 * Whether the signed-in user is a **workspace builder** (may use Settings → Add product).
 *
 * Builders author products; **end users only see them after you deploy**
 * (`public/tenant-products.json` + routes in the build). Wire this hook to auth
 * and pass the result to `ProductProvider` `authoring`.
 *
 * **Wire to your auth** — e.g. `return session.capabilities.includes("product:author")`.
 *
 * Demo / QA without auth:
 * - **Local dev (`pnpm dev`)** — defaults to **builder** so the person
 *   running the starter sees authoring (Add product, hide/unhide, set
 *   default) out of the box. Production builds fall through to end-user
 *   mode unless wired to real session auth (below).
 * - `VITE_EXXAT_BUILDER_SESSION=true` on a staging deploy (treat all users as builders)
 * - Profile → **Builder mode** (this browser only — does not publish to end users)
 *
 * **Production note:** wire this to real auth — e.g.
 * `return session.capabilities.includes("product:author")` — so deployed
 * end users (coordinators, students) get the read-only product list and
 * only your workspace builders get the authoring controls. The dev default
 * below never applies to a production build (`import.meta.env.DEV` is false).
 */
export function useCanAuthorProducts(): boolean {
  const [demoBuilder] = usePersistedState<boolean>(BUILDER_SESSION_KEY, false)

  return React.useMemo(() => {
    if (isPlatformCreatorWorkspace()) return true
    if (readViteBuilderSessionFlag()) return true
    if (demoBuilder) return true
    // Dogfood / local-dev default — see JSDoc. Never true in a prod build.
    if (isViteDev()) return true
    return false
  }, [demoBuilder])
}

function isViteDev(): boolean {
  try {
    return (
      import.meta as ImportMeta & { env?: { DEV?: boolean } }
    ).env?.DEV === true
  } catch {
    return false
  }
}

export { BUILDER_SESSION_KEY }

function readViteBuilderSessionFlag(): boolean {
  try {
    return (
      import.meta as ImportMeta & { env?: { VITE_EXXAT_BUILDER_SESSION?: string } }
    ).env?.VITE_EXXAT_BUILDER_SESSION === "true"
  } catch {
    return false
  }
}
