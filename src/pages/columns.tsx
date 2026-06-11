import { Suspense } from "react"

import { ColumnsClient } from "@/components/columns-client"

/** `/columns` — Vite mirror of `app/(app)/columns/page.tsx`. */
export default function ColumnsPage() {
  return (
    <Suspense fallback={null}>
      <ColumnsClient />
    </Suspense>
  )
}
