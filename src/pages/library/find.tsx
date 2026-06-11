import { Suspense } from "react"

import { LibraryClient } from "@/components/library-client"

/**
 * `/library/find` — Vite mirror of `app/(app)/library/find/page.tsx`.
 * Discovery hub composer results.
 */
export default function LibraryFindPage() {
  return (
    <Suspense fallback={null}>
      <LibraryClient />
    </Suspense>
  )
}
