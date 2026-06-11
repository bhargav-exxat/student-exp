"use client"

/**
 * QuestionBankSearchSheet — right-side Sheet for adding questions from the
 * Question Bank into an assessment. Includes draft panel (left) + search (right).
 */

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tip } from "@/components/ui/tip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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

// ─── Quality Badge (compact) ──────────────────────────────────────────────────

function QualityBadgeCompact({ tier }: { tier: QuestionQualityTier }) {
  switch (tier) {
    case "high":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
          <i className="fa-light fa-circle-check text-[10px]" aria-hidden="true" />
          High
        </span>
      )
    case "review":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
          <i className="fa-light fa-triangle-exclamation text-[10px]" aria-hidden="true" />
          Review
        </span>
      )
    case "poor":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
          <i className="fa-light fa-circle-xmark text-[10px]" aria-hidden="true" />
          Poor
        </span>
      )
    case "no-data":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          <i className="fa-light fa-chart-simple text-[10px]" aria-hidden="true" />
          No Data
        </span>
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{topic}</span>
        <span className={cn("text-xs tabular-nums", isEmpty ? "text-red-600 font-medium" : "text-muted-foreground")}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all",
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

// ─── Filters for sheet ────────────────────────────────────────────────────────

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
        className="h-6 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by topic"
      >
        <option value="">All Topics</option>
        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        value={filters.program}
        onChange={e => onChange({ ...filters, program: e.target.value as QuestionProgram | "" })}
        className="h-6 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
    <div className="flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2 py-1">
      <i className="fa-light fa-wand-magic-sparkles text-blue-500 text-xs" aria-hidden="true" />
      <span className="text-xs text-blue-700"><span className="font-medium">AI:</span> {parts}</span>
    </div>
  )
}

// ─── Alternate suggestion row ─────────────────────────────────────────────────

interface AlternateSuggestionProps {
  item: QuestionBankItem
  onAdd: () => void
}

function AlternateSuggestion({ item, onAdd }: AlternateSuggestionProps) {
  return (
    <div className="ml-4 mt-2 rounded bg-amber-50/40 border border-dashed border-amber-200 p-3 flex flex-col gap-2 transition-all">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
          <i className="fa-light fa-sparkles text-[10px]" aria-hidden="true" />
          Suggested Alternate
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-7 text-xs border-amber-300 hover:bg-amber-100/50 hover:text-amber-900 cursor-pointer"
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add
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
        <p className="text-xs text-amber-955/90 leading-relaxed font-normal">
          {item.stem}
        </p>
      </div>
    </div>
  )
}

// ─── Result list row ─────────────────────────────────────────────────────────

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
    <div className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
      <div className="flex items-start gap-4 px-4 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground/80 tabular-nums">{item.id}</span>
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
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {item.stem}
          </p>
          {isOverexposed && (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-200">
                <i className="fa-light fa-triangle-exclamation text-[10px]" aria-hidden="true" />
                Used · {item.lastUsedSemester}
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

// ─── Draft panel ─────────────────────────────────────────────────────────────

interface DraftPanelProps {
  draftQuestions: DraftQuestion[]
  onDismissWarning: (id: string) => void
}

function DraftPanel({ draftQuestions, onDismissWarning }: DraftPanelProps) {
  return (
    <div className="flex w-[25%] min-w-[220px] flex-col border-r border-border bg-surface-1">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Assessment Draft</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {draftQuestions.length} Question{draftQuestions.length !== 1 ? "s" : ""} Added
        </p>
      </div>

      {/* Topic coverage */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Coverage</p>
        <div className="flex flex-col gap-2">
          <TopicCoverageBar topic="Cardiology" pct={80} />
          <TopicCoverageBar topic="Renal" pct={60} />
          <TopicCoverageBar topic="Pulmonary" pct={0} />
        </div>
      </div>

      {/* Added questions list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {draftQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground px-4">
            <i className="fa-light fa-clipboard-list text-2xl" aria-hidden="true" />
            <p className="text-xs">Add questions from the search panel</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {draftQuestions.map(dq => (
              <div key={dq.item.id} className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-xs text-muted-foreground">{dq.item.id}</span>
                  <p className="min-w-0 flex-1 truncate text-xs text-foreground">{dq.item.stem.slice(0, 60)}…</p>
                </div>
                {dq.duplicateChecking && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    <i className="fa-light fa-spinner" aria-hidden="true" /> Checking for duplicates…
                  </span>
                )}
                {dq.duplicateWarning && !dq.duplicateChecking && (
                  <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-1 text-amber-700">
                      <i className="fa-light fa-triangle-exclamation text-[10px]" aria-hidden="true" />
                      <span className="font-medium">
                        Overlap with {dq.duplicateWarning.overlappingId} ({dq.duplicateWarning.overlapPct}%) · Review
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-amber-700 underline underline-offset-1 hover:text-amber-900"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissWarning(dq.item.id)}
                        className="text-xs text-amber-700 underline underline-offset-1 hover:text-amber-900"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passive tip */}
      <div className="border-t border-border bg-muted/40 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          💡 0 Pulmonary questions · 20% syllabus
        </p>
      </div>
    </div>
  )
}

// ─── Search panel ─────────────────────────────────────────────────────────────

interface SearchPanelProps {
  items: QuestionBankItem[]
  draftIds: Set<string>
  onAdd: (item: QuestionBankItem) => void
}

function SearchPanel({ items, draftIds, onAdd }: SearchPanelProps) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<SheetFilterState>({ topic: "", program: "" })

  const filtered = React.useMemo(() => {
    const activeFilters = items.filter(r => {
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
  }, [items, filters, query])

  // For overexposed rows, provide an alternate from unused questions
  const getAlternate = React.useCallback(
    (item: QuestionBankItem) => {
      if (!item.lastUsedSemester || item.usageCount <= 1) return null
      return items.find(
        r =>
          r.topic === item.topic &&
          r.id !== item.id &&
          r.lastUsedSemester === null &&
          !draftIds.has(r.id),
      ) ?? null
    },
    [items, draftIds],
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Search bar */}
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-wand-magic-sparkles text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Describe the questions you need…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search questions"
            className="text-sm"
          />
        </InputGroup>
        {query && <SheetAiChip query={query} />}
        <SheetFilterRow filters={filters} onChange={setFilters} />
      </div>

      {/* Results list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <i className="fa-light fa-magnifying-glass text-xl" aria-hidden="true" />
            <p className="text-sm">No results found.</p>
          </div>
        ) : (
          filtered.map(item => (
            <ResultRow
              key={item.id}
              item={item}
              isAdded={draftIds.has(item.id)}
              onAdd={() => onAdd(item)}
              alternate={getAlternate(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface QuestionBankSearchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentTitle?: string
}

export function QuestionBankSearchSheet({
  open,
  onOpenChange,
  assessmentTitle = "PA Pharmacology Midterm",
}: QuestionBankSearchSheetProps) {
  const [draftQuestions, setDraftQuestions] = React.useState<DraftQuestion[]>([])
  const draftIds = React.useMemo(() => new Set(draftQuestions.map(d => d.item.id)), [draftQuestions])

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-7xl data-[side=right]:sm:max-w-7xl"
        style={{ maxWidth: "80rem" }}
        showCloseButton
        showOverlay
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <i className="fa-light fa-books text-muted-foreground" aria-hidden="true" />
            Add Questions — {assessmentTitle}
          </SheetTitle>
        </SheetHeader>

        {/* Body: left draft panel + right search panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DraftPanel draftQuestions={draftQuestions} onDismissWarning={handleDismissWarning} />
          <SearchPanel items={QUESTION_BANK_ITEMS} draftIds={draftIds} onAdd={handleAdd} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
