import { Suspense } from "react"

import { LibraryHubClient } from "@/components/library-hub-client"

/** `/library` — Vite mirror of `app/(app)/library/page.tsx`. */
export default function LibraryHubPage() {
  return (
    <Suspense fallback={null}>
      <LibraryHubClient />
    </Suspense>
  )
}
