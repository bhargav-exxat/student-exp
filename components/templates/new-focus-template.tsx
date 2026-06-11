"use client"

/**
 * NewFocusTemplate — focused, single-task "New X" workflow shell.
 *
 * One template, three variants — pick the one that matches your task shape:
 *
 *   1. `variant="shell"`            empty body slot — caller renders anything inside the
 *                                   hero header (title + description + Back link).
 *
 *   2. `variant="workflow"`         multi-step wizard like New placement — `StepIndicator`,
 *                                   step content render-prop, sticky footer with progress
 *                                   dots + Back / Next / Submit buttons (Kbd hints + bound
 *                                   ⌘Enter / ⌘⌥← shortcuts).
 *
 *   3. `variant="form-inspector"`   two-column split (builder + inspector scroll inside
 *                                   their cards; main inset does not page-scroll) — New question.
 *                                   Inspector is collapsible via the caller's controlled
 *                                   open state.
 *
 * The template does NOT own form state. Callers wrap `<NewFocusTemplate>` in a
 * `<form>` (or `<Form>` from `react-hook-form`) and pass step validators / submit
 * handlers — this keeps the template framework-agnostic.
 *
 * IMPORTANT — `<form>` MUST flex inside the app shell row.
 * `NewFocusTemplate` renders a `PrimaryPageTemplate` which renders a `SidebarInset`.
 * The `SidebarInset` itself sits as a flex child of the `(app)/layout` row alongside
 * the primary sidebar + secondary panel + Ask Leo rail and uses `w-full flex-1` to
 * fill the remaining space. If the caller wraps `NewFocusTemplate` in a `<form>` (which
 * is the canonical pattern for `react-hook-form`), the `<form>` itself becomes the flex
 * child and `SidebarInset`'s `flex-1` no longer reaches the row. The page then
 * collapses to its intrinsic content width and renders as a thin column with the rest
 * of the viewport empty. ALWAYS apply `flex min-h-0 min-w-0 flex-1 flex-col` to the
 * wrapping `<form>` so it behaves like a normal flex column host:
 *
 * ```tsx
 * <form className="flex min-h-0 min-w-0 flex-1 flex-col" onSubmit={…}>
 *   <NewFocusTemplate variant="form-inspector" …>…</NewFocusTemplate>
 * </form>
 * ```
 *
 * See `new-placement-form.tsx` and `new-library-item-form.tsx` for canonical usage.
 *
 * The template owns:
 *   • Page chrome (`PrimaryPageTemplate` underneath: `SidebarInset`, `SiteHeader`).
 *   • The hero `<h1>` + description + Back link.
 *   • For `workflow`: `StepIndicator`, step content render slot, sticky footer with
 *     keyboard-shortcut Kbd hints + bound `<Shortcut>` handlers (⌘Enter advance,
 *     ⌘⌥← back, plain Enter submit on final step).
 *   • For `form-inspector`: 2-column split panes — builder scrolls inside the left card,
 *     inspector inside the right card (lg+). Uses `containScroll` so the shell stays
 *     viewport-height like a focused workspace, unlike hub routes that page-scroll.
 *
 * WCAG 2.1 AA — same rules as `new-placement-form` / `new-library-item-form`:
 *  ✓ Hero `<h1>` carries the page title (only one h1 per route).
 *  ✓ Step indicator uses `aria-current="step"` and visible labels (1.3.1).
 *  ✓ Focus moves to step content when step changes (2.4.3).
 *  ✓ Submit/Cancel/Back/Next buttons carry inline Kbd hints + Shortcut bindings.
 *  ✓ Footer is sticky and contained within `<form>` so Enter on step 1..n-1 is no-op.
 */

import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { useModKeyLabel, useAltKeyLabel } from "@/hooks/use-mod-key-label"
import { SidebarAutoCollapse } from "@/components/sidebar"
import {
  PrimaryPageTemplate,
  type PrimaryPageTemplateProps,
} from "@/components/templates/primary-page-template"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { DotPattern } from "@/components/ui/dot-pattern"

// ─── Shared types ────────────────────────────────────────────────────────────

interface BackLink {
  href: string
  label?: string
  ariaLabel?: string
}

interface NewFocusBaseProps {
  /** Page `<h1>` text. */
  title: string
  /** Subhead below the title — short sentence describing the task. */
  description?: React.ReactNode
  /** Back link rendered above the hero (and as `siteHeader.back` if `useSiteHeaderBack`). */
  back: BackLink
  /**
   * When `true`, the parent route's `SiteHeader` carries the back-icon (parent-link only;
   * no hero back link rendered). Mirrors `NewQuestionPage` which passes `back` to `SiteHeader`.
   * Default `false` — Back link is rendered inline above the hero (matches `new-record/page`).
   */
  useSiteHeaderBack?: boolean
  /**
   * Replace the default hero (Back link + `<h1>` + description) with a fully custom node.
   * Use this when the page needs a `PageHeader`-style chrome (subtitle / actions / row),
   * e.g. New question composer with Save / More actions. Title and description props are
   * ignored when `header` is provided.
   */
  header?: React.ReactNode
  /**
   * Render alongside the default hero `<h1>` as right-aligned actions (filled CTA + overflow).
   * Ignored when `header` is provided.
   */
  headerActions?: React.ReactNode
  /**
   * Optional ID-style subtitle rendered below the `<h1>` in lieu of `description`. Use this
   * for stable record identifiers (e.g. draft question id + version).
   */
  headerSubtitle?: React.ReactNode
  /** Override the `PrimaryPageTemplate` max-width. Default: `max-w-3xl` (workflow / shell), `max-w-[1100px]` (form-inspector). */
  maxWidthClassName?: string
  /** Extra classes for the `PrimaryPageTemplate` body wrapper. Default sets `overflow-y-auto`. */
  bodyClassName?: string
  /** Extra classes for the `PrimaryPageTemplate` content column. */
  contentClassName?: string
  /** Optional extra chrome rendered before `SiteHeader` (e.g. command-menu). `SidebarAutoCollapse` is included by default. */
  beforeSiteHeader?: React.ReactNode
  /** Customize the `siteHeader` props passed to `PrimaryPageTemplate`. */
  siteHeader?: PrimaryPageTemplateProps["siteHeader"]
}

// ─── Variant 1: shell ────────────────────────────────────────────────────────

interface ShellVariantProps extends NewFocusBaseProps {
  variant: "shell"
  /** Body content rendered below the hero. */
  children: React.ReactNode
}

// ─── Variant 2: workflow ─────────────────────────────────────────────────────

export interface NewFocusStep {
  /** Stable identifier for the step (used as React key + `STEP_FIELDS` map key). */
  id: string
  /** Short label shown under the step circle (e.g. "Student"). */
  label: string
  /** Optional Font Awesome glyph (e.g. `fa-user-graduate`) shown in the section heading. */
  icon?: string
  /** Render the step body. Receives the active step index (0-based). */
  render: (ctx: { stepIndex: number; isActive: boolean }) => React.ReactNode
}

interface WorkflowVariantProps extends NewFocusBaseProps {
  variant: "workflow"
  /** Ordered step list. Length must be ≥ 1. */
  steps: NewFocusStep[]
  /** Active step (0-based). The caller owns this state so a step can be reached via review-section "Edit". */
  step: number
  /** Called when the user clicks a step circle directly (jump). Optional — omit to disable jumps. */
  onStepChange?: (next: number) => void
  /**
   * Called when Next / ⌘Enter is invoked. Caller validates the current step's fields and
   * returns `true` if advance should proceed. Async-friendly for `react-hook-form` triggers.
   */
  onNext: () => boolean | Promise<boolean>
  /** Called when the form is submitted on the final step. */
  onSubmit: () => void | Promise<void>
  /** Label on the final-step submit button (e.g. "Create placement"). */
  submitLabel: string
  /** Optional icon glyph for the submit button (defaults to `fa-check`). */
  submitIcon?: string
  /** Disable inputs / show spinner when `true`. */
  submitting?: boolean
  /** Override the Next button label. Default `"Next"`. */
  nextLabel?: string
  /** Override the Back button label. Default `"Back"`. */
  backLabel?: string
  /** Scroll to top of window when step changes. Default `true`. */
  scrollOnStepChange?: boolean
}

// ─── Variant 3: form-inspector ───────────────────────────────────────────────

interface FormInspectorVariantProps extends NewFocusBaseProps {
  variant: "form-inspector"
  /** Form body rendered in the left column. */
  children: React.ReactNode
  /**
   * Inspector body rendered in the right rail (sticky on lg+).
   * Either a static node (template handles open/close by toggling visibility) OR a render
   * function that receives `{ open }` so the caller can render different content in collapsed
   * state (e.g. show a single "Open inspector" button when `!open`). Use the function form
   * when the caller's inspector has its own internal show/hide affordance.
   */
  inspector: React.ReactNode | ((ctx: { open: boolean }) => React.ReactNode)
  /** `true` → inspector expanded; `false` → collapsed to a rail with an "Open" affordance. */
  inspectorOpen: boolean
  /** Called when the toolbar inspector toggle is clicked. */
  onInspectorOpenChange: (open: boolean) => void
  /** Width of the inspector rail when open. Default `"320px"`. */
  inspectorOpenWidth?: string
  /** Width of the inspector rail when collapsed. Default `"3.5rem"` (~56px). */
  inspectorCollapsedWidth?: string
  /** Accessible label on the inspector `<aside>`. Default `"Inspector"`. */
  inspectorAriaLabel?: string
  /**
   * Hide the built-in inspector toggle (sidebar-flip icon). Use this when the caller renders
   * its own toggle in the header actions or inside the inspector body itself
   * (e.g. New question composer routes the toggle through a "More actions" overflow menu).
   */
  hideInspectorToggle?: boolean
  /**
   * Leo inline draft — animates the full-page dot canvas (`pageCanvas`) only;
   * does not paint thinking chrome on builder/inspector cards.
   */
  leoDrafting?: boolean
}

// ─── Union ───────────────────────────────────────────────────────────────────

export type NewFocusTemplateProps =
  | ShellVariantProps
  | WorkflowVariantProps
  | FormInspectorVariantProps

// ─── Step indicator (workflow variant) ───────────────────────────────────────

function StepIndicator({
  steps,
  current,
  onStepClick,
}: {
  steps: NewFocusStep[]
  current: number
  onStepClick?: (i: number) => void
}) {
  return (
    <nav aria-label="Form steps" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const isCompleted = idx < current
          const isActive = idx === current
          const isLast = idx === steps.length - 1
          const Circle = (
            <div
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                isCompleted && "border-emerald-600 bg-emerald-600 text-white",
                isActive && "border-brand bg-brand/10 text-brand",
                !isCompleted && !isActive && "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {isCompleted ? (
                <i className="fa-light fa-check text-xs" aria-hidden="true" />
              ) : (
                <span>{idx + 1}</span>
              )}
              <span className="sr-only">
                Step {idx + 1}: {step.label}
                {isCompleted ? " (completed)" : isActive ? " (current)" : ""}
              </span>
            </div>
          )
          return (
            <React.Fragment key={step.id}>
              <li className="flex flex-col items-center gap-1.5 shrink-0">
                {onStepClick && isCompleted ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(idx)}
                    className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Go to step ${idx + 1}: ${step.label}`}
                  >
                    {Circle}
                  </button>
                ) : (
                  Circle
                )}
                <span
                  className={cn(
                    "hidden sm:block text-xs whitespace-nowrap",
                    isActive && "text-foreground font-medium",
                    isCompleted && "text-emerald-600 font-medium",
                    !isCompleted && !isActive && "text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {step.label}
                </span>
              </li>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors",
                    idx < current ? "bg-emerald-600" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Hero block (shared) ─────────────────────────────────────────────────────

function NewFocusHero({
  title,
  description,
  back,
  showInlineBack,
  actions,
  subtitle,
}: {
  title: string
  description?: React.ReactNode
  back: BackLink
  showInlineBack: boolean
  actions?: React.ReactNode
  subtitle?: React.ReactNode
}) {
  const hasActions = actions != null
  return (
    <>
      {showInlineBack ? (
        <Link
          to={back.href}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-interactive-hover-foreground transition-colors mb-5 group"
          aria-label={back.ariaLabel ?? `Back to ${back.label ?? "previous page"}`}
        >
          <i
            className="fa-light fa-arrow-left text-xs transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {back.label ?? "Back"}
        </Link>
      ) : null}
      <div
        className={cn(
          hasActions
            ? "mb-8 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6"
            : "",
        )}
      >
        <div className={cn(hasActions ? "min-w-0" : "")}>
          <h1
            className="text-[2.25rem] font-semibold tracking-tight leading-none text-foreground mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                hasActions || subtitle ? "" : "mb-8",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {hasActions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </>
  )
}

// ─── Body renderers ──────────────────────────────────────────────────────────

function ShellBody({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function WorkflowBody(props: WorkflowVariantProps) {
  const {
    steps,
    step,
    onStepChange,
    onNext,
    onSubmit,
    submitLabel,
    submitIcon = "fa-check",
    submitting = false,
    nextLabel = "Next",
    backLabel = "Back",
    scrollOnStepChange = true,
  } = props

  const lastIndex = steps.length - 1
  const isFinal = step === lastIndex
  const stepHeadingRef = React.useRef<HTMLDivElement>(null)
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  React.useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [step])

  const handleNextClick = React.useCallback(async () => {
    const ok = await onNext()
    if (!ok) return
    onStepChange?.(Math.min(step + 1, lastIndex))
    if (scrollOnStepChange) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [onNext, onStepChange, step, lastIndex, scrollOnStepChange])

  const handleBackClick = React.useCallback(() => {
    onStepChange?.(Math.max(step - 1, 0))
    if (scrollOnStepChange) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [onStepChange, step, scrollOnStepChange])

  const handleSubmitClick = React.useCallback(() => {
    void onSubmit()
  }, [onSubmit])

  return (
    <>
      {/*
        Steps 1..n-1: ⌘Enter advances. Final step: ⌘Enter submits — plain Enter is
        intentionally NOT bound globally; a global Enter shortcut would fire when focus
        is on the step container (we focus it after each step for a11y), submitting
        without an explicit submit action ("Review auto-closes" bug). Native Enter on
        the submit button still submits the wrapping `<form>` on the final step.
      */}
      {!isFinal && (
        <Shortcut keys="⌘Enter" disabled={submitting} onInvoke={handleNextClick} />
      )}
      {isFinal && (
        <Shortcut keys="⌘Enter" disabled={submitting} onInvoke={handleSubmitClick} />
      )}
      {step > 0 && (
        <Shortcut keys="⌘⌥←" disabled={submitting} onInvoke={handleBackClick} />
      )}

      <StepIndicator
        steps={steps}
        current={step}
        onStepClick={onStepChange ? (i) => onStepChange(i) : undefined}
      />

      <div ref={stepHeadingRef} tabIndex={-1} className="outline-none">
        {steps[step]?.render({ stepIndex: step, isActive: true })}
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border flex items-center justify-between mt-8 py-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "rounded-full transition-all h-1.5",
                i === step ? "w-6 bg-brand" : i < step ? "w-3 bg-brand/40" : "w-3 bg-border",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackClick}
            disabled={step === 0 || submitting}
          >
            <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
            {backLabel}
            <KbdGroup className="ms-1.5">
              <Kbd variant="bare">
                {mod}
                {alt}←
              </Kbd>
            </KbdGroup>
          </Button>

          {!isFinal ? (
            <Button type="button" onClick={handleNextClick} disabled={submitting}>
              {nextLabel}
              <i className="fa-light fa-arrow-right text-[13px]" aria-hidden="true" />
              <KbdGroup className="ms-1.5">
                <Kbd variant="bare">{mod}⏎</Kbd>
              </KbdGroup>
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <>
                  <i className="fa-light fa-spinner-third fa-spin text-[13px]" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <i className={`fa-light ${submitIcon} text-[13px]`} aria-hidden="true" />
                  {submitLabel}
                  <KbdGroup className="ms-1.5">
                    <Kbd variant="bare">{mod}⏎</Kbd>
                  </KbdGroup>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

/** FigJam-style dot field on the shell main canvas; drifts when Leo is drafting. */
function FormInspectorPageBackdrop({ leoDrafting = false }: { leoDrafting?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {!leoDrafting ? (
        <DotPattern
          width={14}
          height={14}
          cr={0.85}
          glow={false}
          className="size-full fill-[color-mix(in_oklch,var(--brand-color)_32%,var(--border))] opacity-80 dark:opacity-55"
        />
      ) : null}
      <AiThinkingOverlay
        active={leoDrafting}
        fillClassName="fill-brand/25 dark:fill-brand/35"
      />
    </div>
  )
}

function FormInspectorBody(props: FormInspectorVariantProps) {
  const {
    children,
    header,
    inspector,
    inspectorOpen,
    onInspectorOpenChange,
    inspectorOpenWidth = "320px",
    inspectorCollapsedWidth = "4.5rem",
    inspectorAriaLabel = "Inspector",
    hideInspectorToggle = false,
  } = props

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {header ? <div className="mb-4 shrink-0">{header}</div> : null}
      <div
        className={cn(
          "grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden",
          "max-h-[var(--composer-pane-max,calc(100svh-12.5rem))]",
          "transition-[gap,grid-template-columns] duration-200",
          "@max-[519px]/main:min-h-0 @max-[519px]/main:flex-1",
          "@max-[519px]/main:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]",
          "@min-[520px]/main:h-full @min-[520px]/main:min-h-0",
          "@min-[520px]/main:grid-cols-[minmax(0,1fr)_var(--inspector-w)]",
          "@min-[520px]/main:grid-rows-[minmax(0,1fr)] @min-[520px]/main:items-stretch",
          inspectorOpen ? "@min-[520px]/main:gap-x-5" : "@min-[520px]/main:gap-x-3",
        )}
        style={
          {
            "--inspector-w": inspectorOpen ? inspectorOpenWidth : inspectorCollapsedWidth,
          } as React.CSSProperties
        }
      >
        <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>

        <aside
          aria-label={inspectorAriaLabel}
          className={cn(
            "flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          )}
        >
          {hideInspectorToggle ? null : (
            <div className="mb-3 flex shrink-0 items-center justify-end">
              <Tip
                side="left"
                label={inspectorOpen ? "Hide inspector" : "Show inspector"}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onInspectorOpenChange(!inspectorOpen)}
                  aria-label={inspectorOpen ? "Hide inspector" : "Show inspector"}
                  aria-expanded={inspectorOpen}
                >
                  <i
                    className={cn(
                      "fa-light text-sm",
                      inspectorOpen ? "fa-sidebar-flip" : "fa-sidebar",
                    )}
                    aria-hidden="true"
                  />
                </Button>
              </Tip>
            </div>
          )}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              inspectorOpen ? "h-full max-h-full overflow-hidden" : "overflow-visible",
            )}
          >
            {typeof inspector === "function"
              ? inspector({ open: inspectorOpen })
              : inspectorOpen
                ? inspector
                : null}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Public component ───────────────────────────────────────────────────────

function defaultMaxWidth(variant: NewFocusTemplateProps["variant"]): string {
  switch (variant) {
    case "form-inspector":
      return "mx-auto w-full max-w-[1200px]"
    case "workflow":
      return "max-w-3xl"
    case "shell":
    default:
      return "max-w-3xl"
  }
}

function defaultContentClass(variant: NewFocusTemplateProps["variant"]): string {
  switch (variant) {
    case "form-inspector":
      return "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden px-5 pt-3 pb-3"
    case "workflow":
    case "shell":
    default:
      return "px-8 pt-10 pb-32"
  }
}

function defaultBodyClass(variant: NewFocusTemplateProps["variant"]): string {
  switch (variant) {
    case "form-inspector":
      return "flex min-h-0 flex-1 flex-col overflow-hidden"
    case "workflow":
    case "shell":
    default:
      return "overflow-y-auto"
  }
}

export function NewFocusTemplate(props: NewFocusTemplateProps) {
  const {
    variant,
    title,
    description,
    back,
    useSiteHeaderBack = false,
    header,
    headerActions,
    headerSubtitle,
    maxWidthClassName,
    bodyClassName,
    contentClassName,
    beforeSiteHeader,
    siteHeader,
  } = props

  const computedSiteHeader = useSiteHeaderBack
    ? { back: { href: back.href, label: back.label ?? "Back", ariaLabel: back.ariaLabel } as const, ...(siteHeader ?? {}) }
    : siteHeader

  return (
    <PrimaryPageTemplate
      beforeSiteHeader={
        <>
          <SidebarAutoCollapse />
          {beforeSiteHeader}
        </>
      }
      siteHeader={computedSiteHeader}
      containScroll={variant === "form-inspector"}
      pageCanvas={
        variant === "form-inspector" ? (
          <>
            <FormInspectorPageBackdrop
              leoDrafting={variant === "form-inspector" ? props.leoDrafting : false}
            />
            {variant === "form-inspector" && props.leoDrafting ? (
              <span role="status" aria-live="polite" className="sr-only">
                Leo is drafting your question…
              </span>
            ) : null}
          </>
        ) : undefined
      }
      maxWidthClassName={maxWidthClassName ?? defaultMaxWidth(variant)}
      bodyClassName={cn(defaultBodyClass(variant), bodyClassName)}
      contentClassName={cn(defaultContentClass(variant), contentClassName)}
    >
      {variant === "form-inspector" ? null : header ? (
        <div className="shrink-0">{header}</div>
      ) : (
        <NewFocusHero
          title={title}
          description={description}
          back={back}
          showInlineBack={!useSiteHeaderBack}
          actions={headerActions}
          subtitle={headerSubtitle}
        />
      )}

      {variant === "shell" ? <ShellBody>{props.children}</ShellBody> : null}
      {variant === "workflow" ? <WorkflowBody {...props} /> : null}
      {variant === "form-inspector" ? <FormInspectorBody {...props} /> : null}
    </PrimaryPageTemplate>
  )
}
