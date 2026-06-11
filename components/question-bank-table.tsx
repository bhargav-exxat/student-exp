"use client"

/**
 * QuestionBankTable — standalone question bank table with AI search bar,
 * filter chips, DataTable, and overexposure indicators.
 */

import * as React from "react"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@/components/data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import type { QuestionBankItem, QuestionTopic, QuestionDifficulty, QuestionQualityTier, QuestionProgram } from "@/lib/mock/question-bank"
import { BLOOMS_LEVEL_MAP, type BloomsLabel } from "@/lib/mock/question-bank"

// ─── Quality Badge ────────────────────────────────────────────────────────────

interface QualityBadgeProps {
  tier: QuestionQualityTier
}

function QualityBadge({ tier }: QualityBadgeProps) {
  switch (tier) {
    case "high":
      return (
        <Badge variant="default" className="whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-600">
          <i className="fa-light fa-circle-check" aria-hidden="true" />
          High Quality
        </Badge>
      )
    case "review":
      return (
        <Badge variant="default" className="whitespace-nowrap bg-amber-500 text-white hover:bg-amber-500">
          <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />
          Review
        </Badge>
      )
    case "poor":
      return (
        <Badge variant="destructive" className="whitespace-nowrap">
          <i className="fa-light fa-circle-xmark" aria-hidden="true" />
          Poor
        </Badge>
      )
    case "no-data":
      return (
        <Badge variant="secondary" className="whitespace-nowrap">
          <i className="fa-light fa-chart-simple" aria-hidden="true" />
          No Data
        </Badge>
      )
  }
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyChip({ difficulty, pValue }: { difficulty: QuestionDifficulty; pValue: number }) {
  const label = difficulty === "easy" ? "Easy" : difficulty === "moderate" ? "Moderate" : "Hard"
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-foreground/90">{label}</span>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">p={pValue.toFixed(2)}</span>
    </div>
  )
}

// ─── Overexposure tag ─────────────────────────────────────────────────────────

function OverexposureTag({ semester }: { semester: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
      <i className="fa-light fa-rotate" aria-hidden="true" />
      Used · {semester}
    </span>
  )
}

// ─── AI Interpreted chip ──────────────────────────────────────────────────────

interface AiInterpretedChipProps {
  topic?: string
  bloomsLabel?: string
  difficulty?: string
  onEdit: () => void
}

function AiInterpretedChip({ topic, bloomsLabel, difficulty, onEdit }: AiInterpretedChipProps) {
  const parts = [topic, bloomsLabel, difficulty].filter(Boolean).join(" · ")
  return (
    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
      <i className="fa-light fa-wand-magic-sparkles text-blue-600 text-sm" aria-hidden="true" />
      <span className="text-xs text-blue-700">
        <span className="font-medium">AI interpreted:</span> {parts}
      </span>
      <Tip side="top" label="Edit search interpretation">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit AI search interpretation"
          className="inline-flex size-5 items-center justify-center rounded text-blue-500 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <i className="fa-light fa-pen text-xs" aria-hidden="true" />
        </button>
      </Tip>
    </div>
  )
}

// ─── Filter dropdowns row ────────────────────────────────────────────────────

const TOPICS: QuestionTopic[] = ["Renal", "Cardiology", "Pulmonary", "Pharmacology", "Neurology"]
const BLOOMS_LABELS: BloomsLabel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]
const DIFFICULTIES: QuestionDifficulty[] = ["easy", "moderate", "hard"]
const QUALITIES: QuestionQualityTier[] = ["high", "review", "poor"]
const PROGRAMS: QuestionProgram[] = ["PA", "PT", "OT", "Nursing"]

interface FilterState {
  topic: QuestionTopic | ""
  blooms: BloomsLabel | ""
  difficulty: QuestionDifficulty | ""
  quality: QuestionQualityTier | ""
  program: QuestionProgram | ""
}

interface FilterChipRowProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  onClearAll: () => void
}

function FilterChipRow({ filters, onChange, onClearAll }: FilterChipRowProps) {
  const hasAny = Object.values(filters).some(v => v !== "")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.topic}
        onChange={e => onChange({ ...filters, topic: e.target.value as QuestionTopic | "" })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by topic"
      >
        <option value="">All Topics</option>
        {TOPICS.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={filters.blooms}
        onChange={e => onChange({ ...filters, blooms: e.target.value as BloomsLabel | "" })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by Bloom's level"
      >
        <option value="">All Levels</option>
        {BLOOMS_LABELS.map(l => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <select
        value={filters.difficulty}
        onChange={e => onChange({ ...filters, difficulty: e.target.value as QuestionDifficulty | "" })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by difficulty"
      >
        <option value="">All Difficulty</option>
        {DIFFICULTIES.map(d => (
          <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
        ))}
      </select>

      <select
        value={filters.quality}
        onChange={e => onChange({ ...filters, quality: e.target.value as QuestionQualityTier | "" })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by quality tier"
      >
        <option value="">All Quality</option>
        <option value="high">High Quality</option>
        <option value="review">Review Recommended</option>
        <option value="poor">Poor Discriminator</option>
      </select>

      <select
        value={filters.program}
        onChange={e => onChange({ ...filters, program: e.target.value as QuestionProgram | "" })}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by program"
      >
        <option value="">All Programs</option>
        {PROGRAMS.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {hasAny && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  opts: {
    contextMode?: boolean
    onAddToAssessment?: (row: QuestionBankItem) => void
  }
): ColumnDef<QuestionBankItem>[] {
  const { contextMode, onAddToAssessment } = opts
  return [
    { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true },
    {
      key: "id",
      label: "Question ID",
      width: 110,
      minWidth: 90,
      sortable: true,
      sortKey: "id",
      defaultPin: "left",
      cell: row => (
        <span className="font-mono text-xs font-medium text-foreground tabular-nums">{row.id}</span>
      ),
    },
    {
      key: "stem",
      label: "Question Stem",
      width: 320,
      minWidth: 200,
      sortable: true,
      sortKey: "stem",
      filter: { type: "text", icon: "fa-file-lines", operators: ["contains", "not_contains"] },
      cell: row => (
        <span className="line-clamp-2 text-sm text-foreground">
          {row.stem.length > 80 ? `${row.stem.slice(0, 80)}…` : row.stem}
        </span>
      ),
    },
    {
      key: "topic",
      label: "Topic / Subtopic",
      width: 180,
      minWidth: 140,
      sortable: true,
      sortKey: "topic",
      filter: {
        type: "select",
        icon: "fa-layer-group",
        operators: ["is", "is_not"],
        options: TOPICS.map(t => ({ value: t, label: t })),
      },
      cell: row => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{row.topic}</span>
          <span className="text-xs text-muted-foreground">{row.subtopic}</span>
        </div>
      ),
    },
    {
      key: "bloomsLevel",
      label: "Bloom's",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "bloomsLevel",
      cell: row => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="font-mono tabular-nums">
            L{row.bloomsLevel}
          </Badge>
          <span className="text-xs text-muted-foreground">{BLOOMS_LEVEL_MAP[row.bloomsLevel]}</span>
        </div>
      ),
    },
    {
      key: "qualityTier",
      label: "Quality",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "qualityTier",
      cell: row => <QualityBadge tier={row.qualityTier} />,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "difficulty",
      cell: row => <DifficultyChip difficulty={row.difficulty} pValue={row.pValue} />,
    },
    {
      key: "program",
      label: "Program",
      width: 100,
      minWidth: 80,
      sortable: true,
      sortKey: "program",
      filter: {
        type: "select",
        icon: "fa-graduation-cap",
        operators: ["is", "is_not"],
        options: PROGRAMS.map(p => ({ value: p, label: p })),
      },
      cell: row => (
        <Badge variant="secondary">{row.program}</Badge>
      ),
    },
    {
      key: "questionType",
      label: "Type",
      width: 130,
      minWidth: 100,
      sortable: true,
      sortKey: "questionType",
      cell: row => (
        <span className="text-sm text-foreground/90">{row.questionType}</span>
      ),
    },
    {
      key: "usageCount",
      label: "Usage",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "usageCount",
      cell: row => (
        <div className="flex flex-col gap-1">
          <span className="text-sm tabular-nums text-foreground/90">
            {row.usageCount} {row.usageCount === 1 ? "use" : "uses"}
          </span>
          {row.lastUsedSemester && row.usageCount > 1 && (
            <OverexposureTag semester={row.lastUsedSemester} />
          )}
        </div>
      ),
    },
    ...(contextMode
      ? [
          {
            key: "actions",
            label: "",
            width: 160,
            minWidth: 140,
            defaultPin: "right" as const,
            lockPin: true,
            cell: (row: QuestionBankItem) => (
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onAddToAssessment?.(row)}
                  aria-label={`Add ${row.id} to assessment`}
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add to Assessment
                </Button>
              </div>
            ),
          },
        ]
      : [
          {
            key: "actions",
            label: "",
            width: 48,
            minWidth: 48,
            defaultPin: "right" as const,
            lockPin: true,
            cell: (row: QuestionBankItem) => (
              <div className="flex items-center justify-center">
                <Tip side="top" label={`Actions for ${row.id}`}>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Actions for question ${row.id}`}
                  >
                    <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
                  </Button>
                </Tip>
              </div>
            ),
          },
        ]),
  ]
}

// ─── Apply local filters ──────────────────────────────────────────────────────

function applyFilters(rows: QuestionBankItem[], filters: FilterState, query: string): QuestionBankItem[] {
  const filtered = rows.filter(r => {
    if (filters.topic && r.topic !== filters.topic) return false
    if (filters.blooms && r.bloomsLabel !== filters.blooms) return false
    if (filters.difficulty && r.difficulty !== filters.difficulty) return false
    if (filters.quality && r.qualityTier !== filters.quality) return false
    if (filters.program && r.program !== filters.program) return false
    return true
  })

  if (!query.trim()) {
    return filtered
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) {
    return filtered
  }

  const scored = filtered.map(r => {
    let score = 0
    let matchedTermsCount = 0

    const id = r.id.toLowerCase()
    const stem = r.stem.toLowerCase()
    const topic = r.topic.toLowerCase()
    const subtopic = r.subtopic.toLowerCase()
    const bloomsLabel = r.bloomsLabel.toLowerCase()
    const difficulty = r.difficulty.toLowerCase()
    const program = r.program.toLowerCase()
    const author = r.author.toLowerCase()

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
      
      if (author.includes(term)) {
        score += 3
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
}


// ─── Mock AI interpretation ───────────────────────────────────────────────────

function deriveAiInterpretation(query: string): { topic?: string; bloomsLabel?: string; difficulty?: string } | null {
  if (!query.trim()) return null
  const q = query.toLowerCase()
  const topic = TOPICS.find(t => q.includes(t.toLowerCase()))
  const blooms = (Object.values(BLOOMS_LEVEL_MAP) as BloomsLabel[]).find(l => q.includes(l.toLowerCase()))
  const diff = DIFFICULTIES.find(d => q.includes(d.toLowerCase()))
  if (!topic && !blooms && !diff) return null
  return {
    topic: topic ?? undefined,
    bloomsLabel: blooms ?? undefined,
    difficulty: diff ? (diff.charAt(0).toUpperCase() + diff.slice(1)) : undefined,
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface QuestionBankTableProps {
  items: QuestionBankItem[]
  /** When true, adds an [+ Add to Assessment] action column */
  contextMode?: boolean
  onAddToAssessment?: (row: QuestionBankItem) => void
  className?: string
}

export function QuestionBankTable({
  items,
  contextMode = false,
  onAddToAssessment,
  className,
}: QuestionBankTableProps) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<FilterState>({
    topic: "",
    blooms: "",
    difficulty: "",
    quality: "",
    program: "",
  })

  const aiInterpretation = React.useMemo(() => deriveAiInterpretation(query), [query])

  const filteredRows = React.useMemo(
    () => applyFilters(items, filters, query),
    [items, filters, query],
  )

  const columns = React.useMemo(
    () => buildColumns({ contextMode, onAddToAssessment }),
    [contextMode, onAddToAssessment],
  )

  const handleClearAll = React.useCallback(() => {
    setFilters({ topic: "", blooms: "", difficulty: "", quality: "", program: "" })
    setQuery("")
  }, [])

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* AI Search bar */}
      <div className="flex flex-col gap-2 px-4 pt-3 lg:px-6">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-wand-magic-sparkles text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Describe the questions you need or search by keyword…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="AI-powered question search"
            className="text-sm"
          />
        </InputGroup>

        {aiInterpretation ? (
          <AiInterpretedChip
            topic={aiInterpretation.topic}
            bloomsLabel={aiInterpretation.bloomsLabel}
            difficulty={aiInterpretation.difficulty}
            onEdit={() => setQuery("")}
          />
        ) : null}
      </div>

      {/* Filter chip row */}
      <div className="px-4 lg:px-6">
        <FilterChipRow
          filters={filters}
          onChange={setFilters}
          onClearAll={handleClearAll}
        />
      </div>

      {/* DataTable */}
      <DataTable<QuestionBankItem>
        data={filteredRows}
        columns={columns}
        searchable={false}
        getRowId={row => row.id}
        getRowSelectionLabel={row => `${row.id}: ${row.stem.slice(0, 60)}`}
        selectable
        defaultSort={{ key: "id", dir: "asc" }}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <i className="fa-light fa-magnifying-glass text-2xl" aria-hidden="true" />
            <p className="text-sm">No questions match your search or filters.</p>
          </div>
        }
      />
    </div>
  )
}
