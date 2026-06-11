"use client"

import * as React from "react"
import { useRouter } from "@/lib/router-compat"

import { AskLeoComposer } from "@/components/ask-leo-composer"
import { cn } from "@/lib/utils"

export interface DedicatedSearchUrlComposerProps {
  /** Serialized `URLSearchParams` for the active route (stable string from parent). */
  searchParamsKey: string
  /** Base path for `router.replace` (no query). */
  replacePath: string
  /**
   * Merge submitted text into the next query string. Hub supplies domain rules
   * (e.g. preserve `scope=` / toggles while updating `q=`).
   */
  patchSearchParams: (current: URLSearchParams, submittedText: string) => URLSearchParams
  /** Optional — record a successful non-empty submission (e.g. recents). */
  onRecordSubmission?: (trimmed: string) => void
  /** `hero` — centered landing; `default` — inset under a list header. */
  layout?: "default" | "hero"
  animatedPlaceholders: readonly string[] | string[]
  animatedPlaceholderIntervalMs?: number
  animatedPlaceholderMaxLines?: 1 | 2
  placeholder?: string
  inputLabel?: string
  submitAppearance?: "search" | "send"
  submitButtonAriaLabel?: string
  /** Screen-reader-only instructions for the field (not the sole format hint). */
  srOnlyDescription: React.ReactNode
  composerClassName?: string
}

/**
 * AI-styled composer that updates the URL via `router.replace` — does not open Ask Leo.
 */
export function DedicatedSearchUrlComposer({
  searchParamsKey,
  replacePath,
  patchSearchParams,
  onRecordSubmission,
  layout = "default",
  animatedPlaceholders,
  animatedPlaceholderIntervalMs = 4800,
  animatedPlaceholderMaxLines = 2,
  placeholder = "Search…",
  inputLabel = "Search",
  submitAppearance = "search",
  submitButtonAriaLabel = "Run search",
  srOnlyDescription,
  composerClassName,
}: DedicatedSearchUrlComposerProps) {
  const router = useRouter()
  const sp = React.useMemo(() => new URLSearchParams(searchParamsKey), [searchParamsKey])
  const qFromUrl = sp.get("q") ?? ""
  const [value, setValue] = React.useState(qFromUrl)
  const [expanded, setExpanded] = React.useState(false)

  React.useEffect(() => {
    setValue(qFromUrl)
  }, [qFromUrl])

  const onSubmit = React.useCallback(
    (message: string) => {
      const trimmed = message.trim()
      if (trimmed) onRecordSubmission?.(trimmed)
      const next = patchSearchParams(new URLSearchParams(searchParamsKey), trimmed)
      const qs = next.toString()
      router.replace(qs ? `${replacePath}?${qs}` : replacePath)
    },
    [onRecordSubmission, patchSearchParams, replacePath, router, searchParamsKey],
  )

  return (
    <div className={cn(layout === "hero" ? "min-w-0" : "px-4 pb-3 lg:px-6")}>
      <p className="sr-only">{srOnlyDescription}</p>
      <div
        className={cn(
          "min-w-0 max-w-full border border-[color:var(--control-border)] bg-card shadow-sm transition-[border-radius,padding,box-shadow] duration-200 ease-out",
          layout === "hero" && "shadow-md",
          expanded
            ? layout === "hero"
              ? "rounded-2xl p-1.5 shadow-md"
              : "rounded-2xl p-1.5 shadow-md"
            : layout === "hero"
              ? "rounded-2xl px-1.5 py-1.5 sm:px-2 sm:py-2"
              : "rounded-full px-1 py-1",
        )}
      >
        <AskLeoComposer
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          onExpandedChange={setExpanded}
          animatedPlaceholders={[...animatedPlaceholders]}
          animatedPlaceholderIntervalMs={animatedPlaceholderIntervalMs}
          animatedPlaceholderMaxLines={animatedPlaceholderMaxLines}
          leadingSlot="ai-mark"
          inputLabel={inputLabel}
          submitAppearance={submitAppearance}
          submitButtonAriaLabel={submitButtonAriaLabel}
          placeholder={placeholder}
          className={cn(
            "[&_form>div]:rounded-none [&_form>div]:border-0 [&_form>div]:bg-transparent [&_form>div]:shadow-none",
            composerClassName,
          )}
        />
      </div>
    </div>
  )
}
