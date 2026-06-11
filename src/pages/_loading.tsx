import { Skeleton } from "@/components/ui/skeleton"

/**
 * Generic loading fallback — used by `<Suspense fallback>` around lazy routes.
 */
export function LoadingFallback() {
  return (
    <div
      className="flex flex-col gap-4 p-6 md:p-8"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full max-w-3xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
