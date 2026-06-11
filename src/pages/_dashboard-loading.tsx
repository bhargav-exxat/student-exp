import { Skeleton } from "@/components/ui/skeleton"

/**
 * Dashboard route fallback — used by the `<Suspense fallback>` wrapping the
 * lazy dashboard tabs in `src/views/dashboard.tsx`.
 */
export function DashboardLoadingFallback() {
  return (
    <div
      className="flex flex-col gap-4 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Skeleton className="h-9 w-56 max-w-full" />
      <Skeleton className="h-11 w-full max-w-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="min-h-[320px] w-full rounded-xl" />
    </div>
  )
}
