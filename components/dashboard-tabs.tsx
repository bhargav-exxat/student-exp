"use client"

/**
 * DashboardTabs — three-view dashboard switcher
 *
 *  Report  — full KPI + charts view (current dashboard)
 *  Simple  — Promo · Greeting · Onboarding gallery · Tasks · Insights · Recent · Learn
 *  Mix     — compact metrics + key chart + tasks & activity side-by-side
 */

import * as React from "react"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { TintedIconDisc, type TintedIconDiscTone } from "@/components/tinted-icon-disc"
import { Separator } from "@/components/ui/separator"
import { KeyMetrics, type MetricItem, type MetricInsight } from "@/components/key-metrics"
import type { ChartCardVariant } from "@/components/charts-overview"
import { DashboardReportCharts } from "@/components/dashboard-report-charts"
import { GettingStarted, GettingStartedProgressCard } from "@/components/onboarding/getting-started"
import { TaskListPanel, type TaskListItem } from "@/components/task-list-panel"
import { PageHeader } from "@/components/page-header"
import { useDashboardView }  from "@/contexts/dashboard-view-context"
import { useChartVariant }   from "@/contexts/chart-variant-context"
import { useAskLeo, useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import { cn } from "@/lib/utils"
import {
  DashboardSectionTitle,
  dashboardSectionDescriptionClassName,
} from "@/components/dashboard-section-heading"
import { DashboardPromoBanner } from "@/components/dashboard-promo-banner"
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark } from "@/hooks/use-coach-mark"
import { formatDateFromDate } from "@/lib/date-filter"

/* ── Types passed from the page ─────────────────────────────────────────── */
interface DashboardTabsProps {
  metrics: MetricItem[]
  insight: MetricInsight
  title?: string
  subtitle?: string
}

/* ════════════════════════════════════════════════════════════════════════════
   SIMPLE TAB — widgets
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Greeting ─────────────────────────────────────────────────────────────── */
function GreetingWidget({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    setNow(new Date())
  }, [])

  const hour = now?.getHours() ?? 9
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          {!compact ? (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
              {now ? formatDateFromDate(now) : ""}
            </p>
          ) : null}
          {compact ? (
            <p
              className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {greeting}, Himanshu 👋
            </p>
          ) : (
            <h2
              className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {greeting}, Himanshu 👋
            </h2>
          )}
          {!compact ? (
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              You have <span className="font-medium text-foreground">8 reviews</span> pending and{" "}
              <span className="font-medium text-foreground">23 requests</span> waiting today.
            </p>
          ) : null}
        </div>
        <TintedIconDisc icon="fa-sun-bright" tone="brand" size="lg" />
      </div>
    </div>
  )
}

/* ── Tasks ────────────────────────────────────────────────────────────────── */
const TASK_ITEMS: TaskListItem[] = [
  { id: 1, label: "Review pending evaluations",   due: "Today",     priority: "high",   done: false },
  { id: 2, label: "Approve site contract — City Med", due: "Today",  priority: "high",   done: false },
  { id: 3, label: "Send onboarding docs to PT cohort", due: "Tomorrow", priority: "medium", done: false },
  { id: 4, label: "Update compliance checklist",  due: "03/25/2026", priority: "medium", done: false },
  { id: 5, label: "Schedule supervisor training", due: "03/28/2026", priority: "low",    done: true  },
]

/* ── Insights ─────────────────────────────────────────────────────────────── */
const INSIGHTS: {
  id: number
  icon: string
  tone: TintedIconDiscTone
  title: string
  body: string
}[] = [
  {
    id: 1,
    icon: "fa-arrow-trend-up",
    tone: "chart-2",
    title: "Placement rate up 12%",
    body:  "Nursing placements increased compared to last quarter. Site capacity utilisation at 94%.",
  },
  {
    id: 2,
    icon: "fa-triangle-exclamation",
    tone: "chart-4",
    title: "Review backlog growing",
    body:  "8 evaluations have been pending for more than 48 hrs. Clear them to unblock new requests.",
  },
  {
    id: 3,
    icon: "fa-certificate",
    tone: "brand",
    title: "Compliance milestone",
    body:  "Nursing program reached 98% compliance — highest in 12 months.",
  },
]

function InsightsWidget({ plain = false }: { plain?: boolean }) {
  /* Glow applied — AI surface (rule 1). See GLOW GUIDELINE in key-metrics.tsx */
  const glowStyle = {
    background:
      "radial-gradient(ellipse 120% 80% at 50% 100%, oklch(from var(--brand-color) l c h / 0.14) 0%, transparent 65%)",
  } as const

  const items = INSIGHTS.map((ins, idx) => (
    <React.Fragment key={ins.id}>
      <div className="flex gap-3 items-start py-2">
        <TintedIconDisc
          className="mt-0.5"
          icon={ins.icon}
          tone={ins.tone}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-snug">{ins.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ins.body}</p>
        </div>
      </div>
      {plain && idx < INSIGHTS.length - 1 ? (
        <Separator className="opacity-50" aria-hidden="true" />
      ) : null}
    </React.Fragment>
  ))

  if (plain) {
    return (
      <section aria-labelledby="dashboard-insights-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <DashboardSectionTitle as="h1" id="dashboard-insights-heading">
            Insights
          </DashboardSectionTitle>
          <p className={cn(dashboardSectionDescriptionClassName, "mt-0.5")}>
            AI-generated · Updated now
          </p>
        </div>
        <div className="flex flex-col">{items}</div>
      </section>
    )
  }

  return (
    <Card size="sm" className="overflow-hidden" style={glowStyle}>
      <CardHeader>
        <DashboardSectionTitle as="h2">Insights</DashboardSectionTitle>
        <CardDescription>AI-generated · Updated now</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {INSIGHTS.map((ins) => (
          <div key={ins.id} className="flex gap-3 items-start">
            <TintedIconDisc
              className="mt-0.5"
              icon={ins.icon}
              tone={ins.tone}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">{ins.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ins.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ── Recent Activity ──────────────────────────────────────────────────────── */
const ACTIVITY: {
  id: number
  icon: string
  tone: TintedIconDiscTone
  actor: string
  action: string
  subject: string
  time: string
}[] = [
  { id: 1, icon: "fa-user-check",     tone: "chart-2",     actor: "Dr. Patel",     action: "approved",    subject: "City Med placement",      time: "2m ago"  },
  { id: 2, icon: "fa-file-signature", tone: "brand",       actor: "Sarah Kim",     action: "submitted",   subject: "OT evaluation form",       time: "18m ago" },
  { id: 3, icon: "fa-circle-xmark",   tone: "destructive", actor: "North Clinic",  action: "rejected",    subject: "2 pending requests",       time: "1h ago"  },
  { id: 4, icon: "fa-envelope-open",  tone: "chart-4",     actor: "System",        action: "sent reminder", subject: "to 5 supervisors",       time: "3h ago"  },
  { id: 5, icon: "fa-arrow-up-right", tone: "brand",       actor: "You",           action: "exported",    subject: "Q1 compliance report",     time: "5h ago"  },
  { id: 6, icon: "fa-user-plus",      tone: "chart-2",     actor: "Admissions",    action: "added",       subject: "14 new nursing students",  time: "Yesterday"},
]

function RecentActivityWidget({ plain = false }: { plain?: boolean }) {
  const rows = ACTIVITY.map((ev, idx) => (
    <React.Fragment key={ev.id}>
      <div className="flex items-start gap-3 py-2">
        <TintedIconDisc
          className="mt-0.5"
          icon={ev.icon}
          tone={ev.tone}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-snug text-foreground">
            <span className="font-medium">{ev.actor}</span>{" "}
            <span className="text-muted-foreground">{ev.action}</span>{" "}
            <span className="font-medium">{ev.subject}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{ev.time}</p>
        </div>
      </div>
      {idx < ACTIVITY.length - 1 && (
        <Separator className="opacity-50" aria-hidden="true" />
      )}
    </React.Fragment>
  ))

  if (plain) {
    return (
      <section aria-labelledby="dashboard-activity-heading" className="flex flex-col gap-3">
        <DashboardSectionTitle as="h1" id="dashboard-activity-heading">
          Recent Activity
        </DashboardSectionTitle>
        <div className="flex flex-col overflow-auto">{rows}</div>
      </section>
    )
  }

  return (
    <Card size="sm">
      <CardHeader>
        <DashboardSectionTitle as="h2">Recent Activity</DashboardSectionTitle>
      </CardHeader>
      <CardContent className="flex flex-col overflow-auto">{rows}</CardContent>
    </Card>
  )
}

/* ── Learn / Guide ────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Create your organisation profile",  done: true  },
  { id: 2, label: "Add your first placement site",     done: true  },
  { id: 3, label: "Import student roster",             done: true  },
  { id: 4, label: "Configure compliance requirements", done: false },
  { id: 5, label: "Invite supervisors",                done: false },
  { id: 6, label: "Launch first placement cycle",      done: false },
]

const GUIDE_ARTICLES = [
  {
    id: "workflow",
    icon: "fa-sitemap",
    title: "How does a placement actually work?",
    meta: "5m read",
    gradientClass: "bg-gradient-to-br from-chart-3 to-chart-1",
  },
  {
    id: "site",
    icon: "fa-circle-play",
    title: "Watch: Setting up your first clinical site",
    meta: "3m watch",
    gradientClass: "bg-gradient-to-br from-chart-1 to-chart-5",
  },
  {
    id: "compliance",
    icon: "fa-shield-check",
    title: "Make compliance less of a headache",
    meta: "8m read",
    gradientClass: "bg-gradient-to-br from-chart-2 to-chart-4",
  },
  {
    id: "reports",
    icon: "fa-file-chart-column",
    title: "Turn your data into a report in 2 minutes",
    meta: "4m read",
    gradientClass: "bg-gradient-to-br from-chart-4 to-chart-5",
  },
  {
    id: "support",
    icon: "fa-headset",
    title: "Stuck? Our team is one message away",
    meta: "Get help",
    gradientClass: "bg-gradient-to-br from-chart-3 to-muted",
  },
]

function LearnSection({ layout = "scroll", plain = false }: { layout?: "scroll" | "stack"; plain?: boolean }) {
  const done     = STEPS.filter((s) => s.done).length
  const total    = STEPS.length
  const pct      = Math.round((done / total) * 100)
  const nextStep = STEPS.find((s) => !s.done)
  const stacked  = layout === "stack"
  const tileClass = cn(
    "flex flex-col rounded-lg overflow-hidden border border-border bg-card hover:bg-interactive-hover-soft transition-colors focus-visible:outline-2 focus-visible:outline-ring",
    stacked ? "w-full" : "shrink-0 w-[13rem]",
  )

  const tiles = (
    <>
      <a
        href="#"
        className={tileClass}
        aria-label={`Continue setup — ${done} of ${total} steps done`}
      >
        <div
          className="h-[6.5rem] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-chart-1 to-chart-3"
        >
          <i className="fa-light fa-rocket-launch text-[3rem] text-background/25" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
            <div className="h-[3px] rounded-full overflow-hidden bg-background/20">
              <div
                className="h-full rounded-full bg-background/80"
                style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-sm font-medium leading-snug text-foreground">
            Pick up where you left off
          </p>
          {nextStep && (
            <p className="text-xs text-muted-foreground leading-snug">Next: {nextStep.label}</p>
          )}
          <div className="mt-auto pt-1.5">
            <span className="inline-block text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {done}/{total} steps
            </span>
          </div>
        </div>
      </a>

      {GUIDE_ARTICLES.map((g) => (
        <a
          key={g.id}
          href="#"
          className={tileClass}
          aria-label={g.title}
        >
          <div
            className={cn("h-[6.5rem] flex items-center justify-center overflow-hidden", g.gradientClass)}
          >
            <i className={`fa-light ${g.icon} text-[3rem] text-background/25`} aria-hidden="true" />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <h3 className="text-sm font-medium leading-snug text-foreground">{g.title}</h3>
            <div className="flex items-center gap-1.5 mt-auto pt-1.5 text-muted-foreground">
              <i className="fa-light fa-book-open text-xs" aria-hidden="true" />
              <span className="text-xs">{g.meta}</span>
            </div>
          </div>
        </a>
      ))}
    </>
  )

  const rail = (
    <div
      className={cn("flex gap-3", stacked ? "flex-col" : "overflow-x-auto")}
      style={stacked ? undefined : { scrollbarWidth: "none" }}
    >
      {tiles}
    </div>
  )

  if (plain) {
    return (
      <section aria-labelledby="dashboard-learn-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <DashboardSectionTitle as="h1" id="dashboard-learn-heading">
            Learn
          </DashboardSectionTitle>
          <p className={cn(dashboardSectionDescriptionClassName, "mt-0.5")}>
            Guides, videos &amp; resources
          </p>
        </div>
        {rail}
      </section>
    )
  }

  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader>
        <DashboardSectionTitle as="h2">Learn</DashboardSectionTitle>
        <CardDescription>Guides, videos &amp; resources</CardDescription>
      </CardHeader>
      <CardContent>{rail}</CardContent>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB VIEWS
   ════════════════════════════════════════════════════════════════════════════ */

function ReportView({ metrics, insight, chartVariant }: DashboardTabsProps & { chartVariant: ChartCardVariant }) {
  return (
    <DashboardReportCharts
      metrics={metrics}
      insight={insight}
      chartVariant={chartVariant}
    />
  )
}

function SimpleView() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-2 pb-8 sm:gap-11 sm:px-6 sm:pb-9 lg:gap-12 lg:px-8 lg:pb-10">
      <DashboardPromoBanner />
      <GreetingWidget compact />
      <GettingStarted inset={false} titleAs="h1" />
      <TaskListPanel
        title="Tasks"
        headingId="dashboard-tasks-heading"
        headingLevel="h1"
        plain
        defaultTasks={TASK_ITEMS}
      />
      <InsightsWidget plain />
      <RecentActivityWidget plain />
      <LearnSection layout="scroll" plain />
    </div>
  )
}

function MixView({ metrics, insight }: DashboardTabsProps) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="px-4 lg:px-6">
        <DashboardPromoBanner />
      </div>
      {/* Key metrics flat band */}
      <KeyMetrics variant="flat" metrics={metrics} insight={insight} />

      <div className="px-4 lg:px-6 flex flex-col gap-4">
        {/* Row: Greeting + Onboarding */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2">
            <GreetingWidget />
          </div>
          <GettingStartedProgressCard steps={STEPS} title="Guided onboarding" />
        </div>

        {/* Row: Tasks + Recent Activity */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
          <TaskListPanel title="Tasks" defaultTasks={TASK_ITEMS} />
          <RecentActivityWidget />
        </div>

        {/* Row: Insights */}
        <InsightsWidget />

        <GettingStarted />

        {/* Learn panel — full width */}
        <LearnSection />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   COACH MARK FLOW — dashboard onboarding tour
   ════════════════════════════════════════════════════════════════════════════ */

const DASHBOARD_TOUR_STEPS = [
  {
    id: "tour-welcome",
    target: "h1",
    side: "bottom" as const,
    align: "start" as const,
    title: "Welcome to your Dashboard",
    description:
      "This is your command centre. See key metrics, charts, tasks and AI insights — all in one place.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=320&fit=crop&q=80",
    imageAlt: "Dashboard analytics overview",
  },
  {
    id: "tour-metrics",
    target: "[aria-label='Key Metrics']",
    side: "bottom" as const,
    align: "start" as const,
    title: "Key Metrics at a Glance",
    description:
      "Track pending requests, confirmed placements, compliance rate and more. Trends show how numbers changed since last period.",
  },
  {
    id: "tour-insights",
    target: "[aria-label='Insight']",
    side: "left" as const,
    align: "start" as const,
    title: "AI-Powered Insights",
    description:
      "Leo analyses your data and surfaces actionable insights automatically — no need to dig through reports.",
  },
  {
    id: "tour-askleo",
    target: "[aria-label='Ask Leo']",
    side: "bottom" as const,
    align: "end" as const,
    title: "Ask Leo Anything",
    description:
      "Click here or press ⌘⌥K to open Leo, your AI assistant. Ask questions about your data, get recommendations, or automate tasks.",
  },
]

/* ════════════════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════════════════ */

export function DashboardTabs({
  metrics,
  insight: insightProp,
  title = "Dashboard",
  subtitle,
}: DashboardTabsProps) {
  const { chartVariant } = useChartVariant()
  const { activeView }   = useDashboardView()
  const { openWithPrompt } = useAskLeo()

  const insight = React.useMemo<MetricInsight>(() => {
    if (insightProp.onAction) return insightProp
    return {
      ...insightProp,
      onAction: () =>
        openWithPrompt(
          insightProp.description ?? insightProp.statement ?? insightProp.title,
        ),
    }
  }, [insightProp, openWithPrompt])

  const tour = useCoachMark({
    flowId: "dashboard-tour",
    steps: DASHBOARD_TOUR_STEPS,
    delay: 800,
  })

  const viewLabel =
    activeView === "report" ? "Report" : activeView === "simple" ? "Simple" : "Mix"

  useAskLeoPageContext(
    React.useMemo(
      () => ({
        title: "Dashboard",
        description: `${viewLabel} layout · ${metrics.length} KPI tiles on the strip.`,
        suggestions: [
          "What changed in my key metrics this week?",
          "Summarize the insight card for my stand-up",
          "Which metric should I watch for placement risk?",
        ],
      }),
      [viewLabel, metrics.length],
    ),
  )

  return (
    <div className="flex flex-col">
      {/* Coach mark tour — targets elements by CSS selector, no wrapping needed */}
      <CoachMark state={tour} />

      {/* Simple view: greeting IS the page header — no separate PageHeader */}
      {activeView !== "simple" && (
        <PageHeader title={title} subtitle={subtitle} className="pt-4 md:pt-6" />
      )}
      {activeView === "report" && <ReportView metrics={metrics} insight={insight} chartVariant={chartVariant} />}
      {activeView === "simple" && <SimpleView />}
      {activeView === "mix"    && <MixView metrics={metrics} insight={insight} />}
    </div>
  )
}
