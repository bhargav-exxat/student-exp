import { Suspense } from "react"

import { LibraryClient } from "@/components/library-client"

/** `/library/all` — Vite mirror of `app/(app)/library/all/page.tsx`. */
export default function LibraryAllPage() {
  return (
    <Suspense fallback={null}>
      <LibraryClient />
    </Suspense>
  )
}
