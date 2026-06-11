import { Suspense } from "react"

import { LibraryClient } from "@/components/library-client"

/**
 * `/library/list` — Vite mirror of `app/(app)/library/list/page.tsx`.
 * Library list surface, optimized for `?q=` search landings.
 */
export default function LibraryListPage() {
  return (
    <Suspense fallback={null}>
      <LibraryClient />
    </Suspense>
  )
}
