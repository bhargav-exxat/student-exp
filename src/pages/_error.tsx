import * as React from "react"
import { useRouteError } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { isChunkLoadError } from "@/lib/chunk-load-error"

/**
 * Route-level error surface, healthcare-flavored to match `_not-found.tsx`.
 *
 *   - Eyebrow: human label, never raw status code.
 *   - Illustration: clinical clipboard with a "needs attention" flag
 *     (mirror of the 404 missing-entry illustration so the two pages
 *     read as a coherent set).
 *   - Headline (Ivy Presto italic): a calm clinical idiom.
 *   - Substantial primary CTA + ghost dashboard link.
 *   - Stack trace tucked into a `<details>` in dev only.
 */
function routeErrorFromUnknown(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === "object" && error !== null && "message" in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error(String(error))
}

export function RouteError() {
  const dashboardHref = useProductDashboardHref()
  const routeError = useRouteError()
  const err = routeErrorFromUnknown(routeError)
  const chunkStale = isChunkLoadError(err)

  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.error(err)
    }
  }, [err])

  const kicker = chunkStale ? "Update available" : "Something needs a second look"
  const title = chunkStale ? "Catching up." : "Let's run that again."
  const body = chunkStale
    ? "A newer version is ready. A reload picks it up — takes about a second."
    : import.meta.env.DEV
      ? err.message
      : "Something didn't render correctly. Reloading the page usually clears it."

  return (
    <div
      className="mx-auto flex min-h-[75vh] max-w-2xl flex-col justify-center px-6 py-16"
      role="alert"
    >
      <ChartFlagIllustration variant={chunkStale ? "refresh" : "alert"} />

      <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {kicker}
      </p>

      <h1 className="font-heading mt-3 text-3xl font-normal italic leading-[1.1] tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>

      <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
        {body}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="h-12 gap-2 px-6 text-[15px] font-medium"
          onClick={() => window.location.reload()}
        >
          <i className="fa-light fa-arrows-rotate text-sm" aria-hidden="true" />
          Reload page
        </Button>

        <Button
          asChild
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          <a href={dashboardHref}>Go to dashboard</a>
        </Button>
      </div>

      {import.meta.env.DEV && (
        <details className="mt-12 border-t border-border pt-6">
          <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
            Stack trace
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-destructive/80">
            {err.stack?.slice(0, 800)}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Same clipboard motif as the 404, with two variants:
 *   - `alert`   — one row carries a brand-colored flag + asterisk, signalling
 *                 "this entry needs review".
 *   - `refresh` — one row has a brand-colored circular arrow, signalling
 *                 "this chart is being updated".
 */
function ChartFlagIllustration({
  className,
  variant,
}: {
  className?: string
  variant: "alert" | "refresh"
}) {
  return (
    <svg
      viewBox="0 0 240 290"
      className={`h-48 w-auto text-foreground/55 ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
    >
      <rect x="36" y="42" width="168" height="232" rx="10" stroke="currentColor" strokeWidth="1.75" />
      <rect x="92" y="20" width="56" height="36" rx="6" stroke="currentColor" strokeWidth="1.75" />
      <line x1="104" y1="32" x2="136" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="52" y="62" width="136" height="200" rx="4" stroke="currentColor" strokeWidth="1" opacity="0.45" />

      <line x1="64" y1="84" x2="176" y2="84" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <line x1="64" y1="96" x2="148" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.35" />

      <g opacity="0.42">
        <rect x="64" y="118" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="123" x2="172" y2="123" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.42">
        <rect x="64" y="140" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="145" x2="160" y2="145" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>

      {/* Highlighted entry — alert flag OR refresh, depending on variant */}
      <g>
        <rect x="61" y="160" width="15" height="15" rx="2.5" stroke="var(--brand-color)" strokeWidth="2" />
        {variant === "alert" ? (
          // Filled diamond / asterisk inside the box for "needs attention"
          <path
            d="M 68.5 164 L 71 167.5 L 68.5 171 L 66 167.5 Z"
            fill="var(--brand-color)"
          />
        ) : (
          // Curved arrow inside the box for "refreshing"
          <>
            <path
              d="M 64 168 a 4.5 4.5 0 1 1 4.5 4.5"
              stroke="var(--brand-color)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 67.5 173.5 L 68.5 172 L 70 173"
              stroke="var(--brand-color)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        <line
          x1="84"
          y1="167.5"
          x2="176"
          y2="167.5"
          stroke="var(--brand-color)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </g>

      {/* Trailing rows fading */}
      <g opacity="0.32">
        <rect x="64" y="190" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="195" x2="166" y2="195" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.22">
        <rect x="64" y="212" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="217" x2="158" y2="217" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.12">
        <rect x="64" y="234" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="239" x2="144" y2="239" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
    </svg>
  )
}
