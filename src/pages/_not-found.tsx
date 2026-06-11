import { Link } from "react-router-dom"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

/**
 * Page-not-found surface, healthcare-flavored.
 *
 *   - Eyebrow: "Page not found" — plain, no "404" jargon.
 *   - Illustration: a clinical clipboard / chart with one entry missing,
 *     highlighted in brand color. Reads instantly to clinical-education
 *     users as "this record isn't on file".
 *   - Headline: "Not on the chart." (Ivy Presto italic) — clinical idiom
 *     that reinforces the metaphor.
 *   - Substantial primary CTA back to the dashboard, ghost "Go back".
 */
export default function NotFound() {
  const dashboardHref = useProductDashboardHref()
  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Page not found",
      }}
    >
      <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col justify-center px-6 py-16">
        {/* Clinical chart on a clipboard — one entry highlighted as missing */}
        <ChartIllustration />

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Page not found
        </p>

        <h1 className="font-heading mt-3 text-3xl font-normal italic leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          Not on the chart.
        </h1>

        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          We couldn&apos;t find this page. It may have been moved, or the link
          could be outdated.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="h-12 gap-2 px-6 text-[15px] font-medium"
          >
            <Link to={dashboardHref}>
              <i className="fa-light fa-arrow-left text-sm" aria-hidden="true" />
              Take me home
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => window.history.back()}
          >
            Go back
          </Button>
        </div>
      </div>
    </PrimaryPageTemplate>
  )
}

/**
 * Inline SVG — a stylized clinical chart on a clipboard. One row has an
 * empty checkbox and a dashed line drawn in `--brand-color`, suggesting
 * the missing record. Other rows fade to the bottom for a real-paper feel.
 *
 * Pure SVG, no external assets. `currentColor` makes it theme-reactive,
 * brand line uses the active product brand token.
 */
function ChartIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 290"
      className={`h-48 w-auto text-foreground/55 ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Clipboard backboard */}
      <rect
        x="36"
        y="42"
        width="168"
        height="232"
        rx="10"
        stroke="currentColor"
        strokeWidth="1.75"
      />

      {/* Top clip */}
      <rect
        x="92"
        y="20"
        width="56"
        height="36"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <line
        x1="104"
        y1="32"
        x2="136"
        y2="32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Paper inset */}
      <rect
        x="52"
        y="62"
        width="136"
        height="200"
        rx="4"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />

      {/* Form-style header rules — like Patient / Date / Provider fields */}
      <line
        x1="64"
        y1="84"
        x2="176"
        y2="84"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="64"
        y1="96"
        x2="148"
        y2="96"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* Three normal entries — checkbox + rule */}
      <g opacity="0.42">
        <rect x="64" y="118" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="123" x2="172" y2="123" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.42">
        <rect x="64" y="140" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="145" x2="160" y2="145" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.42">
        <rect x="64" y="162" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="167" x2="168" y2="167" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>

      {/* THE missing entry — full-strength brand color, slightly larger checkbox, dashed line */}
      <g>
        <rect
          x="61"
          y="186"
          width="15"
          height="15"
          rx="2.5"
          stroke="var(--brand-color)"
          strokeWidth="2"
        />
        <line
          x1="84"
          y1="194"
          x2="176"
          y2="194"
          stroke="var(--brand-color)"
          strokeWidth="1.75"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        {/* Small "?" floating beside the missing entry — subtle */}
        <text
          x="66"
          y="198"
          fontSize="10"
          fontStyle="italic"
          fontFamily="ivypresto-text, serif"
          fill="var(--brand-color)"
          fontWeight="500"
        >
          ?
        </text>
      </g>

      {/* Two more entries below, fading out */}
      <g opacity="0.22">
        <rect x="64" y="216" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="221" x2="156" y2="221" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
      <g opacity="0.12">
        <rect x="64" y="238" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <line x1="82" y1="243" x2="142" y2="243" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </g>
    </svg>
  )
}
