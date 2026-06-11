import { Suspense } from "react"

import { TokensThemesClient } from "@/components/tokens-themes-client"

/** `/tokens-themes` — Vite mirror of `app/(app)/tokens-themes/page.tsx`. */
export default function TokensThemesPage() {
  return (
    <Suspense fallback={null}>
      <TokensThemesClient />
    </Suspense>
  )
}
