"use client"

import * as React from "react"
import { useRouter } from "@/lib/router-compat"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import type { DedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"

export interface DedicatedSearchRecentsProps {
  recents: Pick<DedicatedSearchRecentsController, "read" | "record" | "clear" | "eventName">
  searchParamsKey: string
  replacePath: string
  patchSearchParams: (current: URLSearchParams, submittedText: string) => URLSearchParams
  sectionTitle?: string
  clearLabel?: string
}

/**
 * Recent query rows — reads storage only after mount so SSR and first client paint match (no hydration drift).
 */
export function DedicatedSearchRecents({
  recents,
  searchParamsKey,
  replacePath,
  patchSearchParams,
  sectionTitle = "Recently searched",
  clearLabel = "Clear",
}: DedicatedSearchRecentsProps) {
  const router = useRouter()
  const [items, setItems] = React.useState<string[]>([])

  React.useEffect(() => {
    const sync = () => setItems(recents.read())
    sync()
    window.addEventListener(recents.eventName, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(recents.eventName, sync)
      window.removeEventListener("storage", sync)
    }
  }, [recents])

  const runQuery = React.useCallback(
    (q: string) => {
      recents.record(q)
      const next = patchSearchParams(new URLSearchParams(searchParamsKey), q)
      const qs = next.toString()
      router.replace(qs ? `${replacePath}?${qs}` : replacePath)
    },
    [patchSearchParams, recents, replacePath, router, searchParamsKey],
  )

  if (items.length === 0) {
    return null
  }

  const headingId = "dedicated-search-recents-heading"

  return (
    <section className="min-w-0" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id={headingId} className="text-base font-semibold tracking-tight text-foreground">
          {sectionTitle}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto min-h-6 shrink-0 px-2 py-1 text-sm text-muted-foreground"
          onClick={() => recents.clear()}
        >
          {clearLabel}
        </Button>
      </div>
      <div className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:mt-2.5">
        {items.map((q, i) => (
          <div key={`${q}-${i}`} className="min-w-0">
            <Tip side="bottom" label={`Run this search again — ${q}`}>
              <button
                type="button"
                aria-label={`Run this search again — ${q}`}
                className="flex w-full min-h-11 items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5 sm:py-3.5"
                onClick={() => runQuery(q)}
              >
                <i className="fa-light fa-clock-rotate-left size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{q}</span>
                <i className="fa-light fa-chevron-right shrink-0 text-xs text-muted-foreground" aria-hidden="true" />
              </button>
            </Tip>
          </div>
        ))}
      </div>
    </section>
  )
}
