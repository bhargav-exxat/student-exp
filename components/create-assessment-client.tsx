"use client"

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tip } from "@/components/ui/tip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_DANGER,
  LIST_HUB_STATUS_TINT_NEUTRAL,
} from "@/lib/list-status-badges"
import { cn } from "@/lib/utils"
import type { QuestionBankItem, QuestionTopic, BloomsLabel, QuestionDifficulty, QuestionQualityTier, QuestionProgram } from "@/lib/mock/question-bank"
import { BLOOMS_LEVEL_MAP, QUESTION_BANK_ITEMS } from "@/lib/mock/question-bank"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftQuestion {
  item: QuestionBankItem
  duplicateWarning?: {
    overlappingId: string
    overlapPct: number
  } | null
  duplicateChecking?: boolean
}

// ─── Professional Quality Badge Mapping ────────────────────────────────────────

function QualityBadgeCompact({ tier }: { tier: QuestionQualityTier }) {
  switch (tier) {
    case "high":
      return (
        <ListHubStatusBadge
          label="High Quality"
          tintClassName={LIST_HUB_STATUS_TINT_SUCCESS}
          icon="fa-circle-check"
          surface="detail"
          className="h-5 py-0"
        />
      )
    case "review":
      return (
        <ListHubStatusBadge
          label="Needs Review"
          tintClassName={LIST_HUB_STATUS_TINT_WARNING}
          icon="fa-triangle-exclamation"
          surface="detail"
          className="h-5 py-0"
        />
      )
    case "poor":
      return (
        <ListHubStatusBadge
          label="Poor"
          tintClassName={LIST_HUB_STATUS_TINT_DANGER}
          icon="fa-circle-xmark"
          surface="detail"
          className="h-5 py-0"
        />
      )
    case "no-data":
      return (
        <ListHubStatusBadge
          label="No Data"
          tintClassName={LIST_HUB_STATUS_TINT_NEUTRAL}
          icon="fa-chart-simple"
          surface="detail"
          className="h-5 py-0"
        />
      )
  }
}

// ─── Topic coverage bar ───────────────────────────────────────────────────────

interface TopicCoverageBarProps {
  topic: string
  pct: number
}

function TopicCoverageBar({ topic, pct }: TopicCoverageBarProps) {
  const isEmpty = pct === 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{topic}</span>
        <span className={cn("text-xs font-semibold tabular-nums", isEmpty ? "text-red-600" : "text-muted-foreground")}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            isEmpty ? "bg-red-400" : pct >= 80 ? "bg-emerald-500" : "bg-brand",
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${topic} coverage: ${pct}%`}
        />
      </div>
    </div>
  )
}

// ─── Alternate Suggestion Component ──────────────────────────────────────────

interface AlternateSuggestionProps {
  item: QuestionBankItem
  onAdd: () => void
}

function AlternateSuggestion({ item, onAdd }: AlternateSuggestionProps) {
  return (
    <div className="ml-6 mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/30 p-3 flex flex-col gap-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
          <i className="fa-light fa-sparkles text-[10px]" aria-hidden="true" />
          Suggested Alternate (Prevents Overexposure)
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-7 text-xs border-amber-300 hover:bg-amber-100/50 hover:text-amber-900 cursor-pointer"
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Alternate
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap text-xs text-amber-800/80">
          <span className="font-mono font-semibold text-amber-900 tabular-nums">
            {item.id}
          </span>
          <span>·</span>
          <QualityBadgeCompact tier={item.qualityTier} />
          <span>·</span>
          <div className="inline-flex items-center gap-1">
            <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] font-semibold tabular-nums text-amber-700/85 border-amber-300/40 bg-amber-50/50">
              L{item.bloomsLevel}
            </Badge>
            <span className="text-xs font-medium text-amber-700/85">{item.bloomsLabel}</span>
          </div>
          <span>·</span>
          <span className="capitalize">{item.difficulty}</span>
        </div>
        <p className="text-xs text-amber-950/90 leading-relaxed font-normal">
          {item.stem}
        </p>
      </div>
    </div>
  )
}

// ─── Professional Result List Row ────────────────────────────────────────────

interface ResultRowProps {
  item: QuestionBankItem
  isAdded: boolean
  onAdd: () => void
  alternate?: QuestionBankItem | null
}

function ResultRow({ item, isAdded, onAdd, alternate }: ResultRowProps) {
  const [showAlternate, setShowAlternate] = React.useState(false)
  const isOverexposed = item.lastUsedSemester !== null && item.usageCount > 1

  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 px-4 hover:bg-muted/10 last:border-0 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Question Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Top Line: ID & Metadata */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground/80 tabular-nums">
              {item.id}
            </span>
            
            <span>·</span>
            <QualityBadgeCompact tier={item.qualityTier} />
            
            <span>·</span>
            <div className="inline-flex items-center gap-1.5">
              <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground bg-background">
                L{item.bloomsLevel}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">{item.bloomsLabel}</span>
            </div>

            <span>·</span>
            <span className="capitalize">{item.difficulty}</span>

            {item.program && (
              <>
                <span>·</span>
                <span>{item.program}</span>
              </>
            )}
          </div>

          {/* Stem */}
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {item.stem}
          </p>

          {/* Overexposure indicators */}
          {isOverexposed && (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-200">
                <i className="fa-light fa-triangle-exclamation text-[10px]" aria-hidden="true" />
                Overexposed: Used in {item.lastUsedSemester} ({item.usageCount} times)
              </span>
              {alternate && (
                <button
                  type="button"
                  onClick={() => setShowAlternate(v => !v)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {showAlternate ? "Hide alternate" : "Suggest Alternate →"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Add Action */}
        <div className="shrink-0 flex items-center pt-1">
          {isAdded ? (
            <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700 h-8 gap-1.5 px-3">
              <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" />
              Added
            </Badge>
          ) : (
            <Button
              type="button"
              size="default"
              onClick={onAdd}
              aria-label={`Add ${item.id} to assessment`}
              className="h-8 shadow-sm cursor-pointer"
            >
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add
            </Button>
          )}
        </div>
      </div>

      {showAlternate && alternate && (
        <AlternateSuggestion
          item={alternate}
          onAdd={() => {
            onAdd()
            setShowAlternate(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Filter dropdowns row ────────────────────────────────────────────────────

const TOPICS: QuestionTopic[] = ["Renal", "Cardiology", "Pulmonary", "Pharmacology", "Neurology"]
const PROGRAMS: QuestionProgram[] = ["PA", "PT", "OT", "Nursing"]

interface SheetFilterState {
  topic: QuestionTopic | ""
  program: QuestionProgram | ""
}

function SheetFilterRow({ filters, onChange }: { filters: SheetFilterState; onChange: (f: SheetFilterState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.topic}
        onChange={e => onChange({ ...filters, topic: e.target.value as QuestionTopic | "" })}
        className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by topic"
      >
        <option value="">All Topics</option>
        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        value={filters.program}
        onChange={e => onChange({ ...filters, program: e.target.value as QuestionProgram | "" })}
        className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by program"
      >
        <option value="">All Programs</option>
        {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  )
}

// ─── AI chip ──────────────────────────────────────────────────────────────────

const DIFFICULTIES = ["easy", "moderate", "hard"]

function SheetAiChip({ query }: { query: string }) {
  const q = query.toLowerCase()
  const topic = TOPICS.find(t => q.includes(t.toLowerCase()))
  const blooms = (Object.values(BLOOMS_LEVEL_MAP) as BloomsLabel[]).find(l => q.includes(l.toLowerCase()))
  const diff = DIFFICULTIES.find(d => q.includes(d.toLowerCase()))
  if (!topic && !blooms && !diff) return null
  const diffLabel = diff ? (diff.charAt(0).toUpperCase() + diff.slice(1)) : undefined
  const parts = [topic, blooms, diffLabel].filter(Boolean).join(" · ")
  return (
    <div className="flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 py-1.5">
      <i className="fa-light fa-wand-magic-sparkles text-blue-500 text-xs" aria-hidden="true" />
      <span className="text-xs text-blue-700"><span className="font-semibold">AI Interpreted:</span> {parts}</span>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function CreateAssessmentClient() {
  const { productRootSegment } = useParams()
  const navigate = useNavigate()
  
  const [draftQuestions, setDraftQuestions] = React.useState<DraftQuestion[]>([])
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<SheetFilterState>({ topic: "", program: "" })
  const [searchOpen, setSearchOpen] = React.useState(false)

  const draftIds = React.useMemo(() => new Set(draftQuestions.map(d => d.item.id)), [draftQuestions])

  const filtered = React.useMemo(() => {
    const activeFilters = QUESTION_BANK_ITEMS.filter(r => {
      if (filters.topic && r.topic !== filters.topic) return false
      if (filters.program && r.program !== filters.program) return false
      return true
    })

    if (!query.trim()) {
      return activeFilters
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) {
      return activeFilters
    }

    const scored = activeFilters.map(r => {
      let score = 0
      let matchedTermsCount = 0

      const id = r.id.toLowerCase()
      const stem = r.stem.toLowerCase()
      const topic = r.topic.toLowerCase()
      const subtopic = r.subtopic.toLowerCase()
      const bloomsLabel = r.bloomsLabel.toLowerCase()
      const difficulty = r.difficulty.toLowerCase()
      const program = r.program.toLowerCase()

      for (const term of terms) {
        let termMatched = false
        
        if (topic === term) {
          score += 15
          termMatched = true
        } else if (topic.includes(term)) {
          score += 8
          termMatched = true
        }
        
        if (bloomsLabel === term) {
          score += 10
          termMatched = true
        } else if (bloomsLabel.includes(term)) {
          score += 5
          termMatched = true
        }
        
        if (difficulty === term) {
          score += 10
          termMatched = true
        }
        
        if (program === term) {
          score += 8
          termMatched = true
        }
        
        if (subtopic.includes(term)) {
          score += 4
          termMatched = true
        }
        
        if (id.includes(term)) {
          score += 5
          termMatched = true
        }
        
        if (stem.includes(term)) {
          score += 2
          termMatched = true
        }
        
        if (termMatched) {
          matchedTermsCount++
        }
      }

      if (matchedTermsCount > 1) {
        score += matchedTermsCount * 10
      }

      return { item: r, score }
    })

    return scored
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item)
  }, [filters, query])

  // For overexposed rows, provide an alternate from unused questions
  const getAlternate = React.useCallback(
    (item: QuestionBankItem) => {
      if (!item.lastUsedSemester || item.usageCount <= 1) return null
      return QUESTION_BANK_ITEMS.find(
        r =>
          r.topic === item.topic &&
          r.id !== item.id &&
          r.lastUsedSemester === null &&
          !draftIds.has(r.id),
      ) ?? null
    },
    [draftIds],
  )

  const handleAdd = React.useCallback((item: QuestionBankItem) => {
    if (draftIds.has(item.id)) return

    // Optimistic add
    setDraftQuestions(prev => [
      ...prev,
      { item, duplicateChecking: true, duplicateWarning: null },
    ])

    // Async duplicate check (simulated)
    window.setTimeout(() => {
      // Simulate: Q-1482 always has an "overlap" with Q-1391 for demo purposes
      const hasDuplicate = item.id === "Q-1482"
      setDraftQuestions(prev =>
        prev.map(d =>
          d.item.id === item.id
            ? {
                ...d,
                duplicateChecking: false,
                duplicateWarning: hasDuplicate
                  ? { overlappingId: "Q-1391", overlapPct: 82 }
                  : null,
              }
            : d,
        ),
      )
    }, 2000)
  }, [draftIds])

  const handleDismissWarning = React.useCallback((id: string) => {
    setDraftQuestions(prev =>
      prev.map(d => (d.item.id === id ? { ...d, duplicateWarning: null } : d)),
    )
  }, [])

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [
          { label: "Question Bank", href: `/${productRootSegment}/question-bank` },
          { label: "Create Assessment" }
        ]
      }}
    >
      <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
        {/* Header Block */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground">Create Assessment</h1>
            <p className="text-sm text-muted-foreground">Define setup details and compile exam questions.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/${productRootSegment}/question-bank`)}
            className="cursor-pointer"
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to Bank
          </Button>
        </div>

        {/* Content Columns */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* LEFT COLUMN: Setup details & Syllabus Coverage */}
          <div className="w-full lg:w-[42%] flex flex-col gap-6">
            
            {/* Assessment Details Setup */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <i className="fa-light fa-file-signature text-muted-foreground" aria-hidden="true" />
                Assessment Setup
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="assessment-title" className="text-xs font-semibold text-muted-foreground">Assessment Title</label>
                  <input
                    id="assessment-title"
                    type="text"
                    defaultValue="PA Pharmacology Midterm"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter assessment title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="assessment-term" className="text-xs font-semibold text-muted-foreground">Term</label>
                    <select
                      id="assessment-term"
                      defaultValue="fall-2026"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="fall-2026">Fall 2026</option>
                      <option value="spring-2026">Spring 2026</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="assessment-duration" className="text-xs font-semibold text-muted-foreground">Duration</label>
                    <input
                      id="assessment-duration"
                      type="text"
                      defaultValue="60 mins"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="assessment-desc" className="text-xs font-semibold text-muted-foreground">Instructions (Optional)</label>
                  <textarea
                    id="assessment-desc"
                    className="w-full h-16 rounded-md border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Enter instructions for students..."
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Created by: Faculty Author</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <i className="fa-solid fa-circle text-[6px]" aria-hidden="true" />
                  Draft Saved
                </span>
              </div>
            </div>

            {/* Assessment Syllabus Coverage */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <i className="fa-light fa-chart-pie text-muted-foreground" aria-hidden="true" />
                  Syllabus Coverage
                </h2>
                <Badge className="bg-brand text-brand-foreground font-semibold">
                  Syllabus Match: 80%
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                <TopicCoverageBar topic="Cardiology" pct={80} />
                <TopicCoverageBar topic="Renal" pct={60} />
                <TopicCoverageBar topic="Pulmonary" pct={0} />
              </div>

              <div className="mt-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-amber-50/50 border border-amber-200/40 p-2 rounded-lg">
                  <i className="fa-light fa-lightbulb text-amber-500" aria-hidden="true" />
                  <span>0 Pulmonary questions · 20% syllabus weighting missed</span>
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-10 cursor-pointer" onClick={() => navigate(`/${productRootSegment}/question-bank`)}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 h-10 cursor-pointer">
                Create Assessment
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: Assessment Questions (Search trigger + Added questions list) */}
          <div className="w-full lg:w-[58%] rounded-xl border border-border bg-card shadow-sm flex flex-col min-h-[500px]">
            
            {/* Card Header */}
            <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-muted/5 rounded-t-xl">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Assessment Questions</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {draftQuestions.length} Question{draftQuestions.length !== 1 ? "s" : ""} Added
                </span>
              </div>
            </div>

            {/* Stylized Search Trigger Bar */}
            <div className="px-5 py-4 border-b border-border bg-muted/5">
              <div 
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-between w-full h-10 px-3.5 rounded-lg border border-input bg-background hover:bg-muted/15 cursor-pointer transition-colors shadow-xs group"
                role="button"
                tabIndex={0}
                aria-label="Search from question bank to add questions"
              >
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <i className="fa-light fa-magnifying-glass text-muted-foreground/80 group-hover:text-foreground transition-colors" aria-hidden="true" />
                  <span>Search from question bank</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <i className="fa-light fa-wand-magic-sparkles text-[10px]" aria-hidden="true" />
                    AI Search
                  </span>
                  <i className="fa-light fa-chevron-right text-muted-foreground/60 text-xs group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Draft Questions List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[350px]">
              {draftQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground px-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <i className="fa-light fa-clipboard-list text-xl text-muted-foreground/80" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">No questions added yet</p>
                    <p className="text-xs text-muted-foreground/80 max-w-sm">
                      Click the search bar above to browse the bank, use AI filters, and add clinical case questions.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSearchOpen(true)}
                    className="mt-2 h-8 text-xs cursor-pointer"
                  >
                    <i className="fa-light fa-plus mr-1" aria-hidden="true" />
                    Add Questions
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {draftQuestions.map(dq => (
                    <div key={dq.item.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5 shadow-sm transition-all hover:shadow-md">
                      {/* Header Line */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="font-mono text-xs font-semibold text-foreground/80 tabular-nums">
                            {dq.item.id}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-foreground/75">{dq.item.topic}</span>
                          <span>·</span>
                          <QualityBadgeCompact tier={dq.item.qualityTier} />
                          <span>·</span>
                          <div className="inline-flex items-center gap-1">
                            <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground bg-background">
                              L{dq.item.bloomsLevel}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">{dq.item.bloomsLabel}</span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setDraftQuestions(prev => prev.filter(d => d.item.id !== dq.item.id))}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors cursor-pointer"
                          aria-label={`Remove ${dq.item.id}`}
                        >
                          <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                        </button>
                      </div>
                      
                      {/* Stem */}
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {dq.item.stem}
                      </p>

                      {/* Duplicate check status */}
                      {dq.duplicateChecking && (
                        <div className="text-xs text-muted-foreground animate-pulse flex items-center gap-1.5 bg-muted/40 py-1.5 px-2.5 rounded-lg border border-border/50">
                          <i className="fa-light fa-spinner fa-spin text-brand" aria-hidden="true" />
                          <span>Checking question bank for duplicates…</span>
                        </div>
                      )}
                      
                      {/* Duplicate warning */}
                      {dq.duplicateWarning && !dq.duplicateChecking && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs transition-all shadow-2xs">
                          <div className="flex items-start gap-2 text-amber-800">
                            <i className="fa-light fa-triangle-exclamation text-xs mt-0.5 shrink-0" aria-hidden="true" />
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold leading-normal">
                                Overlap with {dq.duplicateWarning.overlappingId} ({dq.duplicateWarning.overlapPct}%) · Review
                              </span>
                              <span className="text-amber-700/95 leading-normal font-normal">
                                This clinical scenario shares 82% overlap with a pharmacology question in your active exams.
                              </span>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-3 pl-6">
                            <button
                              type="button"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              View Side-by-Side
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDismissWarning(dq.item.id)}
                              className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                            >
                              Dismiss Warning
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* SEARCH SHEET PANEL */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-2xl data-[side=right]:sm:max-w-2xl bg-card border-l border-border"
          style={{ maxWidth: "44rem" }}
          showCloseButton
          showOverlay
        >
          <SheetHeader className="border-b border-border px-5 py-4 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              Search Question Bank
            </SheetTitle>
          </SheetHeader>

          {/* Search area inside Sheet */}
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 bg-muted/5 shrink-0">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <i className="fa-light fa-wand-magic-sparkles text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Describe questions (e.g. Renal Apply Hard) or search by topic..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search questions"
                className="text-sm"
              />
            </InputGroup>
            
            {query && <SheetAiChip query={query} />}
            
            <div className="flex items-center justify-between gap-4 mt-1">
              <SheetFilterRow filters={filters} onChange={setFilters} />
              {(query || filters.topic || filters.program) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    setFilters({ topic: "", program: "" })
                  }}
                  className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Results Panel inside Sheet */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 text-xs font-semibold text-muted-foreground flex items-center justify-between shrink-0">
              <span>SEARCH RESULTS ({filtered.length})</span>
              <span>All Programs bank</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <i className="fa-light fa-magnifying-glass text-3xl" aria-hidden="true" />
                  <p className="text-sm font-medium">No matching questions found.</p>
                  <p className="text-xs text-muted-foreground/80">Try clearing filters or changing search query.</p>
                </div>
              ) : (
                filtered.map(item => (
                  <ResultRow
                    key={item.id}
                    item={item}
                    isAdded={draftIds.has(item.id)}
                    onAdd={() => handleAdd(item)}
                    alternate={getAlternate(item)}
                  />
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </PrimaryPageTemplate>
  )
}
