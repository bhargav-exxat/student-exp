"use client"

import * as React from "react"
import { DashboardSectionIntro } from "@/components/dashboard-section-heading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const GETTING_STARTED_STORAGE_KEY = "exxat:getting-started-variant"

export type GettingStartedVariant = "checklist" | "workspace" | "numbered" | "quickstart"

const GETTING_STARTED_VARIANTS: { value: GettingStartedVariant; label: string }[] = [
  { value: "checklist", label: "Checklist" },
  { value: "workspace", label: "Workspace setup" },
  { value: "numbered", label: "Stepped flow" },
  { value: "quickstart", label: "Quick start" },
]

function isGettingStartedVariant(value: string): value is GettingStartedVariant {
  return GETTING_STARTED_VARIANTS.some((variant) => variant.value === value)
}

interface ChecklistStep {
  id: string
  title: string
  description: string
  completed: boolean
  actionLabel: string
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your name, photo, and role so your team knows who you are.",
    completed: true,
    actionLabel: "Edit profile",
  },
  {
    id: "workspace",
    title: "Set up your workspace",
    description: "Customize your workspace with a name, icon, and default settings.",
    completed: false,
    actionLabel: "Configure workspace",
  },
  {
    id: "invite",
    title: "Invite your team",
    description: "Bring your teammates on board so you can collaborate in real time.",
    completed: false,
    actionLabel: "Send invites",
  },
  {
    id: "integrations",
    title: "Connect integrations",
    description: "Link tools like Slack or GitHub to streamline clinical education workflows.",
    completed: false,
    actionLabel: "Browse integrations",
  },
  {
    id: "workflow",
    title: "Create your first workflow",
    description: "Automate a repetitive task with a simple drag-and-drop workflow builder.",
    completed: false,
    actionLabel: "Build workflow",
  },
  {
    id: "notifications",
    title: "Set up notifications",
    description: "Choose how and when you want to be notified about updates and mentions.",
    completed: false,
    actionLabel: "Manage notifications",
  },
]

interface SetupStep {
  title: string
  description: string
  iconClass: string
  actionLabel: string
}

const WORKSPACE_STEPS: SetupStep[] = [
  {
    title: "Create your workspace",
    description:
      "Name your workspace and pick a URL. This is where your team will collaborate on placements and compliance.",
    iconClass: "fa-rocket-launch",
    actionLabel: "Get started",
  },
  {
    title: "Invite your team",
    description: "Add teammates by email so everyone can collaborate in real time across programs.",
    iconClass: "fa-users",
    actionLabel: "Send invites",
  },
  {
    title: "Set up your first program",
    description: "Create a program to organize sites, rotations, and milestones in one place.",
    iconClass: "fa-folder-tree",
    actionLabel: "Create program",
  },
  {
    title: "Connect your tools",
    description: "Link email, calendar, or LMS integrations to keep your workflow in sync.",
    iconClass: "fa-plug",
    actionLabel: "Browse integrations",
  },
]

const NUMBERED_STEPS = [
  {
    id: "1.",
    title: "Confirm your program profile",
    description: "Set the program name, term dates, and default placement policies for your cohort.",
  },
  {
    id: "2.",
    title: "Add sites and rotations",
    description: "Register clinical sites, capacity, and rotation templates so students can be matched.",
  },
  {
    id: "3.",
    title: "Connect compliance rules",
    description: "Link requirements and document types so clearance status stays accurate.",
  },
  {
    id: "4.",
    title: "Open the placement cycle",
    description: "Publish the cycle, invite supervisors, and start assigning students to sites.",
  },
] as const

const QUICK_START_STEPS = [
  {
    title: "Program defaults",
    subtitle: "Policies & term",
    iconClass: "fa-sliders",
    description: "Set placement policies, term dates, and notification preferences for your program.",
    buttonText: "Edit settings",
  },
  {
    title: "Sites & capacity",
    subtitle: "Clinical partners",
    iconClass: "fa-hospital",
    description: "Add sites, supervisors, and rotation capacity so students can be placed accurately.",
    buttonText: "Manage sites",
  },
  {
    title: "Compliance templates",
    subtitle: "Requirements",
    iconClass: "fa-table",
    description: "Map document types and clearance rules so student status stays audit-ready.",
    buttonText: "Open templates",
  },
  {
    title: "Go live",
    subtitle: "Launch cycle",
    iconClass: "fa-chart-line",
    description: "Open the cycle, monitor fill rate, and export placement reports for leadership.",
    buttonText: "View dashboard",
  },
] as const

function CircularProgress({ completedCount, total }: { completedCount: number; total: number }) {
  const progress = total > 0 ? (completedCount / total) * 100 : 0
  const strokeDashoffset = 100 - progress
  return (
    <svg className="-rotate-90" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle className="stroke-muted" cx="7" cy="7" r="6" fill="none" pathLength="100" strokeWidth="2" />
      <circle
        className="stroke-[var(--brand-color)]"
        cx="7"
        cy="7"
        r="6"
        fill="none"
        pathLength="100"
        strokeWidth="2"
        strokeDasharray="100"
        strokeLinecap="round"
        style={{ strokeDashoffset }}
      />
    </svg>
  )
}

function ChecklistVariant() {
  const [steps, setSteps] = React.useState<ChecklistStep[]>(() => [...CHECKLIST_STEPS])
  const [openStepId, setOpenStepId] = React.useState<string | null>(() => {
    const firstIncomplete = CHECKLIST_STEPS.find((step) => !step.completed)
    return firstIncomplete?.id ?? CHECKLIST_STEPS[0]?.id ?? null
  })
  const [dismissed, setDismissed] = React.useState(false)
  const completedCount = steps.filter((step) => step.completed).length

  if (dismissed) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm text-muted-foreground">Checklist dismissed</p>
        <Button type="button" variant="link" className="h-auto text-xs" onClick={() => setDismissed(false)}>
          Show again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="text-balance text-sm font-medium leading-snug text-foreground">Get started with Exxat</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CircularProgress completedCount={completedCount} total={steps.length} />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{completedCount}</span>
            {" / "}
            <span className="font-medium text-foreground">{steps.length}</span> completed
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon-sm" variant="ghost" className="size-8 shrink-0" aria-label="Checklist options">
                <i className="fa-light fa-ellipsis-vertical" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDismissed(true)}>
                <i className="fa-light fa-box-archive me-2 text-xs" aria-hidden="true" />
                Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isOpen = openStepId === step.id
          const prev = steps[index - 1]
          const prevOpen = prev != null && openStepId === prev.id
          const showBorderTop = !(index === 0 || isOpen || prevOpen)

          return (
            <div key={step.id} className={cn("group", isOpen && "rounded-lg", showBorderTop && "border-t border-border")}>
              <div className={cn("overflow-hidden rounded-lg transition-colors", isOpen && "border border-border bg-muted/60")}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setOpenStepId((prevId) => (prevId === step.id ? null : step.id))}
                >
                  <div className="relative flex w-full items-center justify-between gap-3 py-3 pe-2 ps-4">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {step.completed ? (
                        <span
                          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                          aria-label={`${step.title} — completed`}
                        >
                          <i className="fa-light fa-check text-xs" aria-hidden="true" />
                        </span>
                      ) : (
                        <span
                          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground"
                          aria-label={`${step.title} — not completed`}
                        >
                          <i className="fa-light fa-minus text-xs" aria-hidden="true" />
                        </span>
                      )}
                      <h4 className={cn("pt-0.5 text-sm font-semibold", step.completed ? "text-[var(--brand-color)]" : "text-foreground")}>
                        {step.title}
                      </h4>
                    </div>
                    {!isOpen ? <i className="fa-light fa-chevron-right shrink-0 text-xs text-muted-foreground" aria-hidden="true" /> : null}
                  </div>
                </button>
                {isOpen ? (
                  <div className="border-t border-border/60 px-4 pb-4 pt-0 ps-[3.25rem]">
                    <p className="max-w-md text-pretty text-xs leading-snug text-muted-foreground sm:text-sm">{step.description}</p>
                    <Button
                      type="button"
                      className="mt-3"
                      size="sm"
                      onClick={() => {
                        setSteps((prev) => prev.map((current) => (current.id === step.id ? { ...current, completed: true } : current)))
                        const nextIncomplete = steps.find((current) => !current.completed && current.id !== step.id)
                        setOpenStepId(nextIncomplete?.id ?? null)
                      }}
                    >
                      {step.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkspaceVariant() {
  const [completed, setCompleted] = React.useState<Set<number>>(() => new Set([0]))
  const currentStep = WORKSPACE_STEPS.findIndex((_, index) => !completed.has(index))
  const completedCount = completed.size

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium leading-snug text-foreground">Set up your workspace</h3>
        <p className="text-sm text-muted-foreground">Complete these steps to get your team up and running.</p>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{completedCount}</span> of {WORKSPACE_STEPS.length} completed
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / WORKSPACE_STEPS.length) * 100}%`, background: "var(--brand-color)" }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {WORKSPACE_STEPS.map((step, index) => {
          const isCompleted = completed.has(index)
          const isActive = index === currentStep
          return (
            <div key={step.title} className={cn("rounded-lg border p-4 transition-colors", isActive ? "border-[var(--brand-color)]/35 bg-muted/40" : "border-border bg-card")}>
              <div className="flex gap-3">
                {isCompleted ? (
                  <Checkbox checked disabled size="lg" motion="none" variant="success" className="mt-0.5 shrink-0" aria-label={`Step ${index + 1} completed`} />
                ) : (
                  <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", isActive ? "bg-[var(--brand-color)] text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {index + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium leading-snug", isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>{step.title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{step.description}</p>
                  {isActive ? (
                    <Button
                      type="button"
                      className="mt-3 gap-2"
                      size="sm"
                      onClick={() => setCompleted((prev) => new Set(prev).add(index))}
                    >
                      <i className={cn("fa-light shrink-0 text-xs", step.iconClass)} aria-hidden="true" />
                      {step.actionLabel}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NumberedVariant() {
  const [activeStep, setActiveStep] = React.useState(0)
  const progress = ((activeStep + 1) / NUMBERED_STEPS.length) * 100
  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium leading-snug text-foreground">Placement cycle setup</h3>
        <p className="text-sm text-muted-foreground">Complete each step to run placements with your team.</p>
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Step <span className="tabular-nums text-foreground">{activeStep + 1}</span> / {NUMBERED_STEPS.length}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--brand-color)" }} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {NUMBERED_STEPS.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => setActiveStep(index)}
            className={cn(
              "w-full rounded-lg border px-3 py-3 text-left outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              index === activeStep ? "border-[var(--brand-color)]/40 bg-muted/50" : "border-border bg-card hover:bg-muted/30",
            )}
          >
            <div className="flex items-start gap-3">
              {index < activeStep ? (
                <span
                  className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                  aria-label={`${step.title} — completed`}
                >
                  <i className="fa-light fa-check text-xs" aria-hidden="true" />
                </span>
              ) : (
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground">
                  <span aria-hidden="true">{step.id}</span>
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                {index === activeStep ? <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{step.description}</p> : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuickStartVariant() {
  const [activeStep, setActiveStep] = React.useState(1)
  const [openTitle, setOpenTitle] = React.useState<string>(() => QUICK_START_STEPS[1]!.title)

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium leading-snug text-foreground">Quick start</h3>
        <p className="text-sm text-muted-foreground">Wire up your workspace for placements and compliance in four steps.</p>
      </div>
      <div className="flex flex-col gap-1">
        {QUICK_START_STEPS.map((step, index) => {
          const status: "complete" | "current" | "upcoming" = index < activeStep ? "complete" : index === activeStep ? "current" : "upcoming"
          const isOpen = openTitle === step.title
          return (
            <Collapsible key={step.title} open={isOpen} onOpenChange={(open) => setOpenTitle(open ? step.title : "")}>
              <div className={cn("rounded-lg border transition-colors", status === "current" ? "border-[var(--brand-color)]/35 bg-muted/40" : "border-border bg-card")}>
                <CollapsibleTrigger
                  type="button"
                  className="flex w-full items-start gap-3 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {status === "complete" ? (
                      <span
                        className="inline-flex size-5 items-center justify-center rounded border border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                        aria-label={`${step.title} — completed`}
                      >
                        <i className="fa-light fa-check text-[11px]" aria-hidden="true" />
                      </span>
                    ) : (
                      <i className={cn("fa-light text-sm", step.iconClass)} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{step.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{step.subtitle}</span>
                  </span>
                  <i className={cn("fa-light fa-chevron-down mt-1 shrink-0 text-xs transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border/60 px-3 pb-3 pt-0 ps-11">
                    <p className="text-xs leading-snug text-muted-foreground sm:text-sm">{step.description}</p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      variant={status === "complete" ? "outline" : "default"}
                      onClick={() => {
                        if (status !== "current") return
                        const next = activeStep + 1
                        setActiveStep(next)
                        if (next < QUICK_START_STEPS.length) setOpenTitle(QUICK_START_STEPS[next]!.title)
                      }}
                    >
                      {step.buttonText}
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}

export function renderGettingStartedVariant(variant: GettingStartedVariant) {
  switch (variant) {
    case "checklist":
      return <ChecklistVariant />
    case "workspace":
      return <WorkspaceVariant />
    case "numbered":
      return <NumberedVariant />
    case "quickstart":
      return <QuickStartVariant />
    default:
      return <ChecklistVariant />
  }
}

export function GettingStartedVariantView({ variant }: { variant: GettingStartedVariant }) {
  return renderGettingStartedVariant(variant)
}

export function GettingStarted({
  inset = true,
  titleAs = "h2",
  title = "Getting started",
  description = "Pick a layout. Your choice is saved on this device.",
}: {
  inset?: boolean
  titleAs?: "h1" | "h2"
  title?: string
  description?: string
}) {
  const pad = inset ? "px-4 lg:px-6" : ""
  const [variant, setVariant] = React.useState<GettingStartedVariant>("checklist")
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GETTING_STARTED_STORAGE_KEY)
      if (raw && isGettingStartedVariant(raw)) setVariant(raw)
    } catch {
      /* ignore storage errors */
    }
    setReady(true)
  }, [])

  return (
    <section aria-labelledby="getting-started-heading" className="flex flex-col gap-4">
      <DashboardSectionIntro
        className={pad}
        title={title}
        titleId="getting-started-heading"
        titleAs={titleAs}
        description={description}
        actions={(
          <div className="w-full sm:w-auto sm:min-w-[13rem]">
            <Select
              value={ready ? variant : "checklist"}
              onValueChange={(value) => {
                if (!isGettingStartedVariant(value)) return
                setVariant(value)
                try {
                  window.localStorage.setItem(GETTING_STARTED_STORAGE_KEY, value)
                } catch {
                  /* ignore storage errors */
                }
              }}
            >
              <SelectTrigger className="w-full" aria-label="Getting started layout">
                <SelectValue placeholder="Choose layout" />
              </SelectTrigger>
              <SelectContent align="end" sideOffset={4}>
                {GETTING_STARTED_VARIANTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />
      <div className={cn(pad)}>{renderGettingStartedVariant(variant)}</div>
    </section>
  )
}

export function GettingStartedProgressCard({
  steps,
  title = "Getting Started",
}: {
  steps: { id: number; label: string; done: boolean }[]
  title?: string
}) {
  const done = steps.filter((step) => step.done).length
  const total = steps.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--brand-color)" }}>
            {done}/{total}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--brand-color)" }} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{pct}% complete</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
            <Checkbox
              checked={step.done}
              disabled
              size="sm"
              motion="none"
              variant={step.done ? "success" : "outline"}
              className="shrink-0"
              aria-label={step.done ? `Completed: ${step.label}` : `Not completed — step ${step.id}: ${step.label}`}
            />
            <p className={cn("flex-1 text-xs leading-snug", step.done ? "text-muted-foreground line-through" : "font-medium text-foreground")}>
              {step.label}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
