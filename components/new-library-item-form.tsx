"use client"

/**
 * NewLibraryItemForm — single-page authoring for the library.
 *
 * IA (matches the rest of the library surfaces):
 *
 *   ├─ PageHeader (title + actions; parent trail is in `SiteHeader`)
 *   │     · "New question" + "V1 · Last updated …" subtitle
 *   │     · primary CTA — Save question (⏎)
 *   │     · ⋯ overflow menu (⌘⌥M) — Save as draft, inspector, discard
 *   ├─ 2-column layout (lg+): builder scrolls; inspector rail stays fixed (split pane)
 *   │     ┌─ Builder (left, `QuestionBuilderCard`)
 *   │     │     · Question prompt        (h1-style Textarea — type-aware)
 *   │     │     · Answer block — varies by question type
 *   │     │     · Explanation / rubric / model answer
 *   │     │     · References             (repeatable list)
 *   │     └─ Inspector (right, bg-card panel)
 *   │           · Question format        (builder, above Question — SelectionTileGrid)
 *   │           · Location               (folder SelectionTileGrid)
 *   │           · Level / Bloom / Cognitive (chips)
 *   │           · Tags                   (Input + Badge list)
 *   │       Sidebar-style collapse (⌘⌥]) — collapsed rail mimics
 *   │       `NestedSecondaryPanelShell` icon mode.
 *
 * Composes existing primitives — `PageHeader`, `Form`/`FormField`,
 * `Input`, `Textarea`, `Checkbox`, `Badge`, `Button`, `Tip`, `Kbd`,
 * `SelectionTileGrid`, `DropdownMenu` + react-hook-form + Zod (same
 * stack as `new-placement-form.tsx`).
 *
 * Local helpers (`OptionRow`, `BuilderSection`,
 * `InspectorSection`) live inside this file — they are not new shared
 * primitives, so they don't need a design-system review per
 * `exxat-reuse-before-custom.mdc`.
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { devLog } from "@/lib/dev-log"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { PageHeader } from "@/components/page-header"
import { NewFocusTemplate } from "@/components/templates/new-focus-template"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  SelectionTileGrid,
  type SelectionTileOption,
} from "@/components/ui/selection-tile-grid"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LibraryFolderPickerPanel } from "@/components/library-folder-picker-panel"
import { AskLeoButton } from "@/components/ask-leo-button"
import { LeoIcon } from "@/components/ui/leo-icon"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import {
  AUTHORING_QUESTION_TYPES,
  buildMockLeoQuestionDraft,
  LEO_QUESTION_DRAFT_DELAY_MS,
  AUTHORING_BLOOM_OPTIONS,
  AUTHORING_COG_LEVEL_OPTIONS,
  AUTHORING_DIFFICULTY_OPTIONS,
  AUTHORING_STATUS_OPTIONS,
  AUTHORING_DEFAULT_OPTION_COUNT,
  AUTHORING_MIN_OPTION_COUNT,
  AUTHORING_MAX_OPTION_COUNT,
  AUTHORING_LEAD_IN_PLACEHOLDER,
  AUTHORING_RATIONALE_PLACEHOLDER,
  type AuthoringQuestionType,
} from "@/lib/library-authoring"
import {
  DEFAULT_LIBRARY_FOLDERS,
  newFolderId,
  type LibraryFolder,
  type LibraryFolderColorKey,
} from "@/lib/mock/library-folders"

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_TYPES = AUTHORING_QUESTION_TYPES.map(t => t.value) as [
  AuthoringQuestionType,
  ...AuthoringQuestionType[],
]

/** Tiles for the export-drawer-style "File format" pattern (radio + outline + pop). */
const QUESTION_TYPE_TILES: SelectionTileOption<AuthoringQuestionType>[] =
  AUTHORING_QUESTION_TYPES.map(t => ({
    value: t.value,
    label: t.shortLabel,
    icon: t.icon,
  }))
const STATUSES = AUTHORING_STATUS_OPTIONS.map(s => s.value) as [
  (typeof AUTHORING_STATUS_OPTIONS)[number]["value"],
  ...(typeof AUTHORING_STATUS_OPTIONS)[number]["value"][],
]

const optionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
  rationale: z.string(),
})

const referenceSchema = z.object({
  id: z.string(),
  citation: z.string().min(1, "Add a citation or remove the row."),
})

const matchingPairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
})

const orderedItemSchema = z.object({
  id: z.string(),
  text: z.string(),
})

const fillBlankAnswerSchema = z.object({
  id: z.string(),
  accepted: z.string(),
})

const questionSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    status: z.enum(STATUSES),
    folderId: z.string().min(1, "Pick a location."),
    /* The lead-in IS the question (rendered as the page heading). All
       question types share this one field; the schema requires a real
       sentence so reviewers can read it on its own. */
    leadIn: z.string().min(8, "Add the question prompt (at least a sentence)."),
    options: z.array(optionSchema),
    rationale: z.string(),
    references: z.array(referenceSchema),
    /* Type-specific authoring fields — populated only by the matching builder. */
    numericValue: z.string(),
    numericTolerance: z.string(),
    numericUnits: z.string(),
    pairs: z.array(matchingPairSchema),
    orderedItems: z.array(orderedItemSchema),
    fillBlankAnswers: z.array(fillBlankAnswerSchema),
    difficulty: z.enum(["easy", "medium", "hard"]),
    bloom: z.string(),
    cogLevel: z.string(),
    tags: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const isMcq = data.type === "mcq_single" || data.type === "mcq_multiple"
    if (isMcq) {
      const filled = data.options.filter(o => o.text.trim()).length
      if (filled < AUTHORING_MIN_OPTION_COUNT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: `Provide at least ${AUTHORING_MIN_OPTION_COUNT} answer options.`,
        })
      }
      if (!data.options.some(o => o.isCorrect)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Mark at least one option as correct.",
        })
      }
    }
    if (data.type === "true_false" && !data.options.some(o => o.isCorrect)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Pick whether the statement is True or False.",
      })
    }
    if (data.type === "short_answer" && data.rationale.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rationale"],
        message: "Add the model answer and any acceptable variants.",
      })
    }
    if (data.type === "essay" && data.rationale.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rationale"],
        message: "Add a grading rubric so reviewers know how to score.",
      })
    }
    if (data.type === "numeric" && data.numericValue.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numericValue"],
        message: "Enter the correct numeric value.",
      })
    }
    if (data.type === "matching") {
      const filled = data.pairs.filter(p => p.left.trim() && p.right.trim()).length
      if (filled < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pairs"],
          message: "Add at least two matching pairs.",
        })
      }
    }
    if (data.type === "ordering") {
      const filled = data.orderedItems.filter(i => i.text.trim()).length
      if (filled < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orderedItems"],
          message: "Add at least two items to order.",
        })
      }
    }
    if (data.type === "fill_blank") {
      const filled = data.fillBlankAnswers.filter(a => a.accepted.trim()).length
      if (filled < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fillBlankAnswers"],
          message: "Add at least one accepted answer.",
        })
      }
    }
  })

type QuestionFormValues = z.infer<typeof questionSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const

// Runtime ID generators — called from user actions (Add option, Add pair, etc.) which
// only fire AFTER hydration, so `Math.random()` is safe here. NEVER call these from
// `buildInitial*` factories below — those run during the server render too and a
// random ID would mismatch the client tree on hydration.
function newOptionId() {
  return `opt-${Math.random().toString(36).slice(2, 9)}`
}
function newReferenceId() {
  return `ref-${Math.random().toString(36).slice(2, 9)}`
}
function newPairId() {
  return `pair-${Math.random().toString(36).slice(2, 9)}`
}
function newOrderedId() {
  return `ord-${Math.random().toString(36).slice(2, 9)}`
}
function newBlankId() {
  return `blk-${Math.random().toString(36).slice(2, 9)}`
}

// SSR-safe defaults — deterministic, index-based IDs so the server and client render
// the same `id` / `key` / DOM attributes (e.g. `Checkbox` IDs derived from `option.id`).
// Hydration mismatch issue: `Math.random()` produces different values per call, so
// using it in initial defaults makes every render emit a different tree.
function buildInitialOptions(type: AuthoringQuestionType): QuestionFormValues["options"] {
  if (type === "true_false") {
    return [
      { id: "opt-true", text: "True", isCorrect: false, rationale: "" },
      { id: "opt-false", text: "False", isCorrect: false, rationale: "" },
    ]
  }
  if (type === "mcq_single" || type === "mcq_multiple") {
    return Array.from({ length: AUTHORING_DEFAULT_OPTION_COUNT }, (_, i) => ({
      id: `opt-init-${i + 1}`,
      text: "",
      isCorrect: false,
      rationale: "",
    }))
  }
  return []
}

function buildInitialPairs(): QuestionFormValues["pairs"] {
  return Array.from({ length: 3 }, (_, i) => ({
    id: `pair-init-${i + 1}`,
    left: "",
    right: "",
  }))
}
function buildInitialOrderedItems(): QuestionFormValues["orderedItems"] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `ord-init-${i + 1}`,
    text: "",
  }))
}
function buildInitialFillBlankAnswers(): QuestionFormValues["fillBlankAnswers"] {
  return [{ id: "blk-init-1", accepted: "" }]
}

function folderBreadcrumb(folderId: string, folders: LibraryFolder[]): string {
  const f = folders.find(x => x.id === folderId)
  if (!f) return ""
  if (f.parentId == null) return f.name
  const parent = folders.find(x => x.id === f.parentId)
  return parent ? `${parent.name} / ${f.name}` : f.name
}

/**
 * Folder-aware difficulty insight — derived deterministically from the
 * folder id so the same folder always returns the same numbers. In a real
 * build this comes from analytics; for the mock it is a stable seed so
 * the inspector reads as if the AI had crunched historical data.
 */
function difficultyInsightForFolder(folder: LibraryFolder | undefined): {
  /** Predicted level based on the content the author is writing. */
  recommendation: "easy" | "medium" | "hard"
  /** Contextual note shown under the meter (e.g. folder distribution). */
  note: string
  /** Point-Biserial Index (0–1) — predicted question quality. */
  pbi: number
  /** Average folder difficulty (0–100, same scale as the meter). */
  averagePercent: number
} {
  if (!folder) {
    return {
      recommendation: "medium",
      note: "Pick a location to see how your question compares to this folder.",
      pbi: 0.3,
      averagePercent: 50,
    }
  }
  // Deterministic hash of folder id → stable mock numbers per folder.
  let h = 0
  for (let i = 0; i < folder.id.length; i++) h = (h * 31 + folder.id.charCodeAt(i)) >>> 0
  const tilt = (h % 100) / 100 // 0..1
  const mediumShare = 45 + Math.floor(tilt * 30) // 45..75 %
  const pbi = 0.22 + (tilt * 0.22) // 0.22..0.44
  const averagePercent = 35 + Math.floor(tilt * 35) // 35..70
  const recommendation: "easy" | "medium" | "hard" =
    averagePercent < 40 ? "easy" : averagePercent > 65 ? "hard" : "medium"
  return {
    recommendation,
    note: `Based on your content, this question is predicted ${recommendation}. ${mediumShare}% of items in ${folder.name} are Medium (avg PBI ${pbi.toFixed(2)}).`,
    pbi,
    averagePercent,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers (this file only — not new shared primitives)
// ─────────────────────────────────────────────────────────────────────────────


function InspectorSection({
  title,
  htmlFor,
  children,
  description,
}: {
  title: string
  htmlFor?: string
  children: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {title}
      </Label>
      {children}
      {description ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
      ) : null}
    </section>
  )
}

/** Shared composer column card — fixed chrome, scrollable body (builder + inspector). */
function ComposerPanelCard({
  title,
  headerActions,
  bodyClassName,
  children,
}: {
  title?: string
  headerActions?: React.ReactNode
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {title ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {headerActions}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-4 py-3 pb-3 sm:px-5 sm:py-3 sm:pb-3">
        <div className={cn("flex flex-col", bodyClassName ?? "gap-4")}>{children}</div>
      </div>
    </div>
  )
}

/** Builder canvas — format, stem, type-specific blocks, rationale, references. */
function QuestionBuilderCard({ children }: { children: React.ReactNode }) {
  return <ComposerPanelCard bodyClassName="gap-4">{children}</ComposerPanelCard>
}

function BuilderSection({
  title,
  required,
  hint,
  children,
}: {
  title: string
  required?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
          {required ? (
            <span className="ms-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </h2>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </section>
  )
}

// ─── Folder picker (Popover + Library secondary tree) ───────────────────────
//
// Compact selected tile — same visual rhythm as the collapsed
// "Question format" card. Popover uses `LibraryFolderPickerPanel` (search +
// folder tree aligned with the Library secondary panel).

const FOLDER_TINT_BG: Record<LibraryFolderColorKey, string> = {
  brand:
    "bg-brand-tint text-brand-deep dark:bg-brand-tint-light dark:text-foreground",
  success: "bg-[var(--icon-disc-chart-2-bg)] text-[var(--icon-disc-chart-2-fg)]",
  warning: "bg-[var(--icon-disc-chart-4-bg)] text-[var(--icon-disc-chart-4-fg)]",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
  chart1: "bg-[color-mix(in_oklch,var(--color-chart-1)_15%,transparent)] text-[var(--color-chart-1)]",
  chart2: "bg-[var(--icon-disc-chart-2-bg)] text-[var(--icon-disc-chart-2-fg)]",
  chart3: "bg-[color-mix(in_oklch,var(--color-chart-3)_15%,transparent)] text-[var(--color-chart-3)]",
}

interface FolderPickerControlProps {
  folders: LibraryFolder[]
  value: string
  onChange: (id: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestNewFolder: () => void
}

function FolderPickerControl({
  folders,
  value,
  onChange,
  open,
  onOpenChange,
  onRequestNewFolder,
}: FolderPickerControlProps) {
  const selected = folders.find(f => f.id === value)
  const tint = selected ? FOLDER_TINT_BG[selected.colorKey] : FOLDER_TINT_BG.muted

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={
            selected
              ? `Change location — currently ${folderBreadcrumb(selected.id, folders)}`
              : "Pick a location"
          }
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors",
            "hover:border-foreground/30 hover:bg-muted/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
              tint,
            )}
            aria-hidden="true"
          >
            <i className={cn("fa-light text-base", selected?.icon ?? "fa-folder")} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {selected ? selected.name : "Pick a location"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {selected
                ? selected.parentId
                  ? `in ${folders.find(p => p.id === selected.parentId)?.name}`
                  : "Top-level folder"
                : "Required"}
            </span>
          </span>
          <span
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
            aria-hidden="true"
          >
            <i className="fa-light fa-chevron-down text-xs" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
      >
        <LibraryFolderPickerPanel
          key={open ? "open" : "closed"}
          folders={folders}
          value={value}
          onChange={id => {
            onChange(id)
            onOpenChange(false)
          }}
          onRequestNewFolder={onRequestNewFolder}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── Difficulty meter (predicted from content + PBI + folder note) ───────────
//
// AI analyses the question content (stem length, option count, Bloom's level,
// vocabulary complexity) to **predict** how difficult examinees will find this
// item. The author can override by flipping to Manual mode.

interface DifficultyMeterProps {
  value: "easy" | "medium" | "hard"
  onChange: (next: "easy" | "medium" | "hard") => void
  mode: "auto" | "manual"
  onModeChange: (next: "auto" | "manual") => void
  insight: ReturnType<typeof difficultyInsightForFolder>
}

function DifficultyMeter({
  value,
  onChange,
  mode,
  onModeChange,
  insight,
}: DifficultyMeterProps) {
  const pbiPercent = Math.min(100, Math.max(0, insight.pbi * 100))
  const pbiTone =
    insight.pbi >= 0.3
      ? "bg-brand"
      : insight.pbi >= 0.2
        ? "bg-[var(--brand-color-light)]"
        : "bg-destructive"

  const levelLabel =
    value === "easy" ? "Low" : value === "hard" ? "High" : "Normal"

  return (
    <section className="flex flex-col gap-3">
      <Label className="text-xs font-medium text-muted-foreground">
        Predicted difficulty
      </Label>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
        {/* Level heading + AI / Manual toggle */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {levelLabel}
          </h3>
          <Tip
            side="top"
            label={
              mode === "auto"
                ? "Override the predicted difficulty"
                : "Let AI predict difficulty from your content"
            }
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[11px] font-medium"
              onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")}
              aria-pressed={mode === "manual"}
            >
              {mode === "auto" ? (
                <>
                  <span
                    aria-hidden
                    className="inline-flex size-4 shrink-0 [--leo-icon-fill:var(--brand-color-dark)] dark:[--leo-icon-fill:var(--brand-color-light)]"
                  >
                    <LeoIcon
                      variant="ambient"
                      size="sm"
                      orbitingSparkles={false}
                      className="size-4"
                    />
                  </span>
                  Predicted
                </>
              ) : (
                <>
                  <i className="fa-light fa-hand-pointer text-[10px]" aria-hidden="true" />
                  Manual
                </>
              )}
            </Button>
          </Tip>
        </div>

        {/* Manual chips — only shown when the author has overridden. */}
        {mode === "manual" ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={1}
            value={value}
            onValueChange={v => { if (v) onChange(v as "easy" | "medium" | "hard") }}
            className="flex-wrap"
          >
            {AUTHORING_DIFFICULTY_OPTIONS.map(d => (
              <ToggleGroupItem
                key={d.value}
                value={d.value}
                title={d.description}
                className="rounded-full px-3"
              >
                {d.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}

        {/* PBI score bar — the only progress indicator, so the section
            reads as a single unified card instead of two separate ones. */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Tip
              side="top"
              label="Point-Biserial Index — correlation between getting this question right and total score. Above 0.30 is good; below 0.20 suggests the item needs review."
            >
              <span
                tabIndex={0}
                role="img"
                aria-label="PBI score — Point-Biserial Index, a measure of question quality"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
              >
                PBI score
                <i
                  className="fa-light fa-circle-info text-[10px] text-muted-foreground/70"
                  aria-hidden="true"
                />
              </span>
            </Tip>
            <span className="font-mono tabular-nums text-xs font-medium text-foreground">
              {insight.pbi.toFixed(2)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-200", pbiTone)}
              style={{ width: `${pbiPercent}%` }}
            />
          </div>
        </div>

        {/* Folder note */}
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <i
            className="fa-light fa-circle-info mt-0.5 text-[10px]"
            aria-hidden="true"
          />
          <span>{insight.note}</span>
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Composer
// ─────────────────────────────────────────────────────────────────────────────

interface NewQuestionComposerProps {
  /** Assigned on the server — keeps SSR and hydration in sync. */
  draftQuestionId: string
  defaultFolderId?: string
  /** Where to send the user when they cancel or save. */
  backHref: string
  /** Label displayed in the `SiteHeader` back-icon (e.g. "Back to Favorites"). */
  backLabel?: string
  folders?: LibraryFolder[]
}

export function NewLibraryItemForm({
  draftQuestionId,
  defaultFolderId,
  backHref,
  backLabel = "Back",
  folders = DEFAULT_LIBRARY_FOLDERS,
}: NewQuestionComposerProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)
  const [isLeoDrafting, setIsLeoDrafting] = React.useState(false)
  const leoDraftTimeoutRef = React.useRef<any>(null)
  const [tagDraft, setTagDraft] = React.useState("")
  const [inspectorOpen, setInspectorOpen] = React.useState(true)
  const [moreOpen, setMoreOpen] = React.useState(false)
  /** Local folder list — extended in-place when the author adds one
      from the location picker so the new entry is selectable without
      a page navigation. */
  const [localFolders, setLocalFolders] = React.useState<LibraryFolder[]>(folders)
  React.useEffect(() => {
    setLocalFolders(prev =>
      prev.length === folders.length && prev.every((f, i) => f.id === folders[i]?.id)
        ? prev
        : folders,
    )
  }, [folders])
  const [folderPickerOpen, setFolderPickerOpen] = React.useState(false)
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  /** "auto" → the meter follows the AI recommendation derived from the
      selected folder's history; "manual" → the author has overridden
      the level via the chip row. */
  const [difficultyMode, setDifficultyMode] = React.useState<"auto" | "manual">("auto")

  const initialFolderId =
    defaultFolderId && folders.some(f => f.id === defaultFolderId)
      ? defaultFolderId
      : folders.find(f => f.id === "fld-favorites")?.id ?? folders[0]?.id ?? "fld-favorites"

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema) as Resolver<QuestionFormValues>,
    mode: "onTouched",
    defaultValues: {
      type: "mcq_single",
      status: "draft",
      folderId: initialFolderId,
      leadIn: "",
      options: buildInitialOptions("mcq_single"),
      rationale: "",
      references: [],
      numericValue: "",
      numericTolerance: "",
      numericUnits: "",
      pairs: buildInitialPairs(),
      orderedItems: buildInitialOrderedItems(),
      fillBlankAnswers: buildInitialFillBlankAnswers(),
      difficulty: "medium",
      bloom: "",
      cogLevel: "",
      tags: [],
    },
  })

  // `useWatch` is React-Compiler-safe; `form.watch()` is not. Same fix as
  // `new-placement-form.tsx`.
  const watchedType = useWatch({ control: form.control, name: "type" })
  const watchedOptions = useWatch({ control: form.control, name: "options" })
  const watchedPairs = useWatch({ control: form.control, name: "pairs" })
  const watchedOrderedItems = useWatch({ control: form.control, name: "orderedItems" })
  const watchedFillBlankAnswers = useWatch({
    control: form.control,
    name: "fillBlankAnswers",
  })
  const watchedTags = useWatch({ control: form.control, name: "tags" })
  const watchedFolderId = useWatch({ control: form.control, name: "folderId" })
  const watchedDifficulty = useWatch({ control: form.control, name: "difficulty" })

  React.useEffect(() => {
    return () => {
      if (leoDraftTimeoutRef.current !== null) {
        window.clearTimeout(leoDraftTimeoutRef.current)
      }
    }
  }, [])

  const applyLeoDraftPatch = React.useCallback(
    (patch: ReturnType<typeof buildMockLeoQuestionDraft>) => {
      if (patch.leadIn !== undefined) form.setValue("leadIn", patch.leadIn, { shouldDirty: true })
      if (patch.options !== undefined) {
        form.setValue("options", patch.options, { shouldDirty: true })
      }
      if (patch.rationale !== undefined) {
        form.setValue("rationale", patch.rationale, { shouldDirty: true })
      }
      if (patch.references !== undefined) {
        form.setValue("references", patch.references, { shouldDirty: true })
      }
      if (patch.numericValue !== undefined) {
        form.setValue("numericValue", patch.numericValue, { shouldDirty: true })
      }
      if (patch.numericTolerance !== undefined) {
        form.setValue("numericTolerance", patch.numericTolerance, { shouldDirty: true })
      }
      if (patch.numericUnits !== undefined) {
        form.setValue("numericUnits", patch.numericUnits, { shouldDirty: true })
      }
      if (patch.pairs !== undefined) form.setValue("pairs", patch.pairs, { shouldDirty: true })
      if (patch.orderedItems !== undefined) {
        form.setValue("orderedItems", patch.orderedItems, { shouldDirty: true })
      }
      if (patch.fillBlankAnswers !== undefined) {
        form.setValue("fillBlankAnswers", patch.fillBlankAnswers, { shouldDirty: true })
      }
      if (patch.difficulty !== undefined) {
        form.setValue("difficulty", patch.difficulty, { shouldDirty: true })
        setDifficultyMode("manual")
      }
      if (patch.bloom !== undefined) form.setValue("bloom", patch.bloom, { shouldDirty: true })
      if (patch.cogLevel !== undefined) {
        form.setValue("cogLevel", patch.cogLevel, { shouldDirty: true })
      }
      if (patch.tags !== undefined) form.setValue("tags", patch.tags, { shouldDirty: true })
    },
    [form],
  )

  const handleDraftWithLeo = React.useCallback(() => {
    if (isLeoDrafting || submitting) return
    setIsLeoDrafting(true)
    const folder = localFolders.find(f => f.id === watchedFolderId)
    leoDraftTimeoutRef.current = window.setTimeout(() => {
      applyLeoDraftPatch(buildMockLeoQuestionDraft(watchedType, folder?.name))
      setIsLeoDrafting(false)
      leoDraftTimeoutRef.current = null
    }, LEO_QUESTION_DRAFT_DELAY_MS)
  }, [
    applyLeoDraftPatch,
    isLeoDrafting,
    localFolders,
    submitting,
    watchedFolderId,
    watchedType,
  ])

  const difficultyInsight = React.useMemo(
    () => difficultyInsightForFolder(localFolders.find(f => f.id === watchedFolderId)),
    [localFolders, watchedFolderId],
  )
  // When the AI is in charge, mirror its recommendation into the form.
  // Avoids race conditions where the meter shows one value but submit
  // ships another.
  React.useEffect(() => {
    if (difficultyMode === "auto" && watchedDifficulty !== difficultyInsight.recommendation) {
      form.setValue("difficulty", difficultyInsight.recommendation, {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
  }, [difficultyMode, difficultyInsight.recommendation, watchedDifficulty, form])

  const isMulti = watchedType === "mcq_multiple"
  const isMcq = watchedType === "mcq_single" || watchedType === "mcq_multiple"
  const isTrueFalse = watchedType === "true_false"
  const isShortAnswer = watchedType === "short_answer"
  const isEssay = watchedType === "essay"
  const isNumeric = watchedType === "numeric"
  const isFillBlank = watchedType === "fill_blank"
  const isMatching = watchedType === "matching"
  const isOrdering = watchedType === "ordering"
  const isHotspot = watchedType === "hotspot"
  const showOptionsBlock = isMcq || isTrueFalse
  const correctCount = watchedOptions.filter(o => o.isCorrect).length

  function changeType(next: AuthoringQuestionType) {
    const prev = form.getValues("type")
    if (prev === next) return
    form.setValue("type", next, { shouldValidate: false })

    // mcq_single ↔ mcq_multiple preserves the typed options the author has
    // already drafted; any other transition rebuilds the options block.
    const mcqFamily = new Set(["mcq_single", "mcq_multiple"])
    if (mcqFamily.has(prev) && mcqFamily.has(next)) {
      if (next !== "mcq_multiple") {
        const opts = form.getValues("options")
        let firstCorrect = true
        form.setValue(
          "options",
          opts.map(o => {
            if (!o.isCorrect) return o
            if (firstCorrect) {
              firstCorrect = false
              return o
            }
            return { ...o, isCorrect: false }
          }),
          { shouldValidate: false },
        )
      }
      return
    }
    form.setValue("options", buildInitialOptions(next), { shouldValidate: false })
  }

  function patchOption(id: string, patch: Partial<QuestionFormValues["options"][number]>) {
    form.setValue(
      "options",
      form.getValues("options").map(o => (o.id === id ? { ...o, ...patch } : o)),
      { shouldDirty: true },
    )
  }

  function toggleCorrect(id: string) {
    const opts = form.getValues("options")
    const next = opts.map(o => {
      if (o.id === id) return { ...o, isCorrect: !o.isCorrect }
      if (!isMulti) return { ...o, isCorrect: false }
      return o
    })
    form.setValue("options", next, { shouldValidate: false, shouldDirty: true })
  }

  /** Letter chip — single/TF: mark this option correct; multi: toggle correct. */
  function selectOptionLetter(id: string) {
    const opts = form.getValues("options")
    const next = opts.map(o => {
      if (o.id === id) {
        if (isMulti) return { ...o, isCorrect: !o.isCorrect }
        return { ...o, isCorrect: true }
      }
      if (!isMulti) return { ...o, isCorrect: false }
      return o
    })
    form.setValue("options", next, { shouldValidate: false, shouldDirty: true })
  }

  function addOption() {
    const opts = form.getValues("options")
    if (opts.length >= AUTHORING_MAX_OPTION_COUNT) return
    form.setValue(
      "options",
      [...opts, { id: newOptionId(), text: "", isCorrect: false, rationale: "" }],
      { shouldDirty: true },
    )
  }

  function removeOption(id: string) {
    const opts = form.getValues("options")
    if (opts.length <= AUTHORING_MIN_OPTION_COUNT) return
    form.setValue(
      "options",
      opts.filter(o => o.id !== id),
      { shouldDirty: true },
    )
  }

  function addReference() {
    const refs = form.getValues("references")
    form.setValue("references", [...refs, { id: newReferenceId(), citation: "" }], {
      shouldDirty: true,
    })
  }
  function removeReference(id: string) {
    form.setValue(
      "references",
      form.getValues("references").filter(r => r.id !== id),
      { shouldDirty: true },
    )
  }

  function patchPair(id: string, patch: Partial<QuestionFormValues["pairs"][number]>) {
    form.setValue(
      "pairs",
      form.getValues("pairs").map(p => (p.id === id ? { ...p, ...patch } : p)),
      { shouldDirty: true },
    )
  }
  function addPair() {
    form.setValue(
      "pairs",
      [...form.getValues("pairs"), { id: newPairId(), left: "", right: "" }],
      { shouldDirty: true },
    )
  }
  function removePair(id: string) {
    const pairs = form.getValues("pairs")
    if (pairs.length <= 2) return
    form.setValue(
      "pairs",
      pairs.filter(p => p.id !== id),
      { shouldDirty: true },
    )
  }

  function patchOrdered(id: string, text: string) {
    form.setValue(
      "orderedItems",
      form.getValues("orderedItems").map(i => (i.id === id ? { ...i, text } : i)),
      { shouldDirty: true },
    )
  }
  function addOrdered() {
    form.setValue(
      "orderedItems",
      [...form.getValues("orderedItems"), { id: newOrderedId(), text: "" }],
      { shouldDirty: true },
    )
  }
  function removeOrdered(id: string) {
    const items = form.getValues("orderedItems")
    if (items.length <= 2) return
    form.setValue(
      "orderedItems",
      items.filter(i => i.id !== id),
      { shouldDirty: true },
    )
  }
  function moveOrdered(id: string, delta: -1 | 1) {
    const items = form.getValues("orderedItems")
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    const target = idx + delta
    if (target < 0 || target >= items.length) return
    const next = items.slice()
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    form.setValue("orderedItems", next, { shouldDirty: true })
  }

  function patchFillBlank(id: string, accepted: string) {
    form.setValue(
      "fillBlankAnswers",
      form.getValues("fillBlankAnswers").map(a => (a.id === id ? { ...a, accepted } : a)),
      { shouldDirty: true },
    )
  }
  function addFillBlank() {
    form.setValue(
      "fillBlankAnswers",
      [...form.getValues("fillBlankAnswers"), { id: newBlankId(), accepted: "" }],
      { shouldDirty: true },
    )
  }
  function removeFillBlank(id: string) {
    const items = form.getValues("fillBlankAnswers")
    if (items.length <= 1) return
    form.setValue(
      "fillBlankAnswers",
      items.filter(a => a.id !== id),
      { shouldDirty: true },
    )
  }

  function commitTag() {
    const t = tagDraft.trim()
    if (!t) return
    const tags = form.getValues("tags")
    if (!tags.includes(t)) {
      form.setValue("tags", [...tags, t], { shouldDirty: true })
    }
    setTagDraft("")
  }
  function removeTag(t: string) {
    form.setValue(
      "tags",
      form.getValues("tags").filter(x => x !== t),
      { shouldDirty: true },
    )
  }

  /** Two save actions — Save Question (primary, full validation, status
      moves to In review) and Save as draft (secondary, skips validation,
      status stays Draft). Both route back to the parent hub on success;
      no toasts per `exxat-no-toast.mdc`. */
  async function persist(values: QuestionFormValues, mode: "publish" | "draft") {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    devLog(`Question ${mode === "publish" ? "saved" : "drafted"} (${draftQuestionId}):`, values)
    setSubmitting(false)
    navigate(backHref)
  }
  function handleSaveQuestion() {
    void form.handleSubmit(values => persist({ ...values, status: "in_review" }, "publish"))()
  }
  function handleSaveAsDraft() {
    if (submitting) return
    const values = { ...form.getValues(), status: "draft" as const }
    void persist(values, "draft")
  }
  function handleCancel() {
    navigate(backHref)
  }

  // PageHeader subtitle — question id + version + last-updated stamp.
  const headerSubtitle = (
    <>
      <span className="font-mono tabular-nums">{draftQuestionId}</span>
      {" · V1 · Last updated just now"}
    </>
  )

  // Inspector body — wired into `NewFocusTemplate.form-inspector` via the `inspector`
  // render-prop. Renders both the collapsed-rail and expanded-card states so the composer
  // keeps its existing UX while the template owns the outer `<aside>` chrome (width
  // transition + sticky positioning).
  const inspectorContent = (
    <>
      {!inspectorOpen ? (
        <div className="flex w-full shrink-0 justify-start overflow-visible py-0.5">
          <Tip side="left" label="Show inspector">
            <button
              type="button"
              onClick={() => setInspectorOpen(true)}
              aria-label="Show inspector"
              aria-expanded={false}
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-panel-bg)] text-sidebar-foreground shadow-sm ring-1 ring-border transition-colors",
                "hover:bg-sidebar-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <i
                className="fa-light fa-arrow-left-to-line text-[15px] leading-none"
                aria-hidden="true"
              />
            </button>
          </Tip>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <ComposerPanelCard
          title="Inspector"
          headerActions={
            <Tip side="bottom" label="Hide inspector">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setInspectorOpen(false)}
                aria-label="Hide inspector"
                aria-expanded={true}
              >
                <i
                  className="fa-light fa-arrow-right-to-line"
                  aria-hidden="true"
                />
              </Button>
            </Tip>
          }
        >
          {/* Location — compact selected tile; popover uses Library
              secondary-panel search + folder tree (`LibraryFolderPickerPanel`). */}
          <FormField
            control={form.control}
            name="folderId"
            render={({ field }) => (
              <FormItem>
                <Label
                  className="text-xs font-medium text-muted-foreground"
                >
                  Location
                </Label>
                <FormControl>
                  <FolderPickerControl
                    folders={localFolders}
                    value={field.value}
                    onChange={v => field.onChange(v)}
                    open={folderPickerOpen}
                    onOpenChange={setFolderPickerOpen}
                    onRequestNewFolder={() => {
                      setFolderPickerOpen(false)
                      setNewFolderOpen(true)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Difficulty — meter + AI estimate + PBI + folder note.
              Defaults to AI mode (the meter follows the folder
              recommendation); "Override" flips to manual chips for
              authors who want to lock the level themselves. */}
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <DifficultyMeter
                value={field.value}
                onChange={v => field.onChange(v)}
                mode={difficultyMode}
                onModeChange={setDifficultyMode}
                insight={difficultyInsight}
              />
            )}
          />

          <FormField
            control={form.control}
            name="bloom"
            render={({ field }) => (
              <InspectorSection title="Bloom's taxonomy">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={field.value}
                  onValueChange={v => field.onChange(v)}
                  className="flex-wrap"
                >
                  {AUTHORING_BLOOM_OPTIONS.map(b => (
                    <ToggleGroupItem
                      key={b.value}
                      value={b.value}
                      title={b.hint}
                      className="rounded-full px-3"
                    >
                      {b.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </InspectorSection>
            )}
          />

          <FormField
            control={form.control}
            name="cogLevel"
            render={({ field }) => (
              <InspectorSection
                title="Cognitive level"
                description="Broader bucket used for analytics — separate from Bloom's level above."
              >
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={field.value}
                  onValueChange={v => field.onChange(v)}
                  className="flex-wrap"
                >
                  {AUTHORING_COG_LEVEL_OPTIONS.map(c => (
                    <ToggleGroupItem
                      key={c.value}
                      value={c.value}
                      title={c.hint}
                      className="rounded-full px-3"
                    >
                      {c.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </InspectorSection>
            )}
          />

          <InspectorSection title="Tags" htmlFor="qb-tag-input">
            {watchedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {watchedTags.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1.5">
                    <span>#{t}</span>
                    <Tip side="top" label={`Remove tag ${t}`}>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        aria-label={`Remove tag ${t}`}
                        className="-me-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <i
                          className="fa-light fa-xmark text-[9px]"
                          aria-hidden="true"
                        />
                      </button>
                    </Tip>
                  </Badge>
                ))}
              </div>
            ) : null}
            <Input
              id="qb-tag-input"
              value={tagDraft}
              onChange={e => setTagDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  commitTag()
                }
              }}
              onBlur={commitTag}
              placeholder="STEMI, antibiotics…"
              className="h-8 text-xs"
            />
          </InspectorSection>
        </ComposerPanelCard>
        </div>
      )}
    </>
  )

  return (
    <Form {...form}>
      {/* Global shortcuts — bound while the composer is mounted. The
          `useShortcut` hook skips inputs/textarea/contenteditable so
          Enter still types newlines inside the stem; Save fires only
          when focus is on chrome. */}
          <Shortcut keys="Escape" disabled={submitting} onInvoke={handleCancel} />
      <Shortcut keys="Enter" disabled={submitting} onInvoke={handleSaveQuestion} />
          <Shortcut
            keys="⌘⌥M"
            disabled={submitting}
            onInvoke={() => setMoreOpen(o => !o)}
          />
          <Shortcut
            keys="⌘⌥]"
            disabled={submitting}
            onInvoke={() => setInspectorOpen(o => !o)}
          />

          {/*
            `<form>` participates in the (app)/layout flex row alongside the sidebar +
            secondary panel + Ask Leo rail, so it MUST behave like a normal flex column
            host (flex-1 + min-w-0). Without these classes the form shrinks to its
            intrinsic content width and the page collapses into a narrow column on the
            left with the rest of the viewport empty. See `new-placement-form.tsx`.
          */}
          <form
            onSubmit={form.handleSubmit(values => persist({ ...values, status: "in_review" }, "publish"))}
            noValidate
            aria-label="New question form"
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <NewFocusTemplate
              variant="form-inspector"
              title="New question"
              back={{ href: backHref, label: backLabel, ariaLabel: `Back to ${backLabel}` }}
              useSiteHeaderBack
              hideInspectorToggle
              leoDrafting={isLeoDrafting}
              inspectorOpen={inspectorOpen}
              onInspectorOpenChange={setInspectorOpen}
              inspectorAriaLabel="Question inspector"
              inspector={() => inspectorContent}
              header={
                <PageHeader
                  title="New question"
                  subtitle={headerSubtitle}
                  actions={
                    <>
                      <AskLeoButton
                        size="lg"
                        label="Draft with Leo"
                        onClick={handleDraftWithLeo}
                        disabled={submitting || isLeoDrafting}
                        aria-busy={isLeoDrafting}
                        busyLabel="Leo is drafting…"
                        ariaLabel="Draft with Leo in the builder"
                        tooltipLabel="Draft a starter in the builder with Leo — does not open the side panel"
                        showShortcut={false}
                      />

                      {/* Primary — Save Question. Full validation; the
                          question moves to In review and the user is
                          returned to the parent hub. */}
                      <Button
                        type="button"
                        size="lg"
                        disabled={submitting}
                        aria-busy={submitting}
                        onClick={handleSaveQuestion}
                      >
                        {submitting ? (
                          <>
                            <i
                              className="fa-light fa-spinner-third fa-spin text-[13px]"
                              aria-hidden="true"
                            />
                            Saving…
                          </>
                        ) : (
                          <>
                            Save question
                            <KbdGroup className="ms-1.5">
                              <Kbd variant="bare">⏎</Kbd>
                            </KbdGroup>
                          </>
                        )}
                      </Button>

                      {/* More — overflow menu (⌘⌥M). */}
                      <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                        <Tip side="bottom" label="More actions">
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon-lg"
                              variant="outline"
                              aria-label="More actions"
                            >
                              <i
                                className="fa-light fa-ellipsis text-base"
                                aria-hidden="true"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                        </Tip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={submitting}
                            onSelect={() => {
                              window.setTimeout(() => handleSaveAsDraft(), 0)
                            }}
                          >
                            <i className="fa-light fa-file-pen" aria-hidden="true" />
                            Save as draft
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            shortcut="⌘⌥]"
                            onSelect={() => {
                              window.setTimeout(
                                () => setInspectorOpen(o => !o),
                                0,
                              )
                            }}
                          >
                            <i
                              className={cn(
                                "fa-light",
                                inspectorOpen ? "fa-sidebar-flip" : "fa-sidebar",
                              )}
                              aria-hidden="true"
                            />
                            {inspectorOpen ? "Hide inspector" : "Show inspector"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            shortcut="Esc"
                            onSelect={() => {
                              window.setTimeout(() => handleCancel(), 0)
                            }}
                            variant="destructive"
                          >
                            <i className="fa-light fa-trash-can" aria-hidden="true" />
                            Discard draft
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  }
                  className="px-0 lg:px-0"
                />
              }
              maxWidthClassName="mx-auto w-full max-w-[1200px]"
            >
              {/* ── Builder card — format, stem, and type-specific fields. */}
            <QuestionBuilderCard>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="gap-0 space-y-0">
                  <FormControl>
                    <SelectionTileGrid
                      sectionLabel="Question format"
                      options={QUESTION_TYPE_TILES}
                      layout="horizontalScroll"
                      density="compact"
                      labelPlacement="below"
                      value={field.value}
                      onValueChange={v => changeType(v)}
                      interaction="button"
                      idPrefix="qb-format"
                      className="mb-5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question prompt — a real bordered field, not an
                inline-editable headline. Larger heading-weight font keeps
                the question front-and-centre, but the visible border /
                padding tell the author "this is the field you type in"
                instead of suggesting a click-to-edit document. */}
            <FormField
              control={form.control}
              name="leadIn"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <Label
                    htmlFor="qb-lead-in"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Question
                  </Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="qb-lead-in"
                      placeholder={
                        isFillBlank
                          ? "Type your fill-in-the-blank question here. Use {{1}}, {{2}}, … to mark the blanks."
                          : isMatching
                            ? "Match each item on the left to its match on the right."
                            : isOrdering
                              ? "Place the following steps in the correct order."
                              : isHotspot
                                ? "Click the correct region of the image below."
                                : isNumeric
                                  ? "What is the calculated value? (Include units in the answer field.)"
                                  : AUTHORING_LEAD_IN_PLACEHOLDER
                      }
                      rows={3}
                      aria-required="true"
                      className={cn(
                        "min-h-[5rem] resize-y bg-background leading-snug",
                        "text-lg font-semibold tracking-tight md:text-xl",
                        "placeholder:font-medium placeholder:text-muted-foreground",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Choice family + True/False — bordered OptionRows. */}
            {showOptionsBlock ? (
              <FormField
                control={form.control}
                name="options"
                render={() => (
                  <FormItem>
                    <BuilderSection
                      title="Answer choices"
                      hint={`${watchedOptions.length} options · ${correctCount} correct`}
                    >
                      <p className="text-xs text-muted-foreground">
                        {isMulti
                          ? "Click each letter to toggle correct responses. Use ⋯ for comment or remove."
                          : isTrueFalse
                            ? "Click True or False to mark the correct response."
                            : "Click a letter to mark the single best answer. Use ⋯ for comment or remove."}
                      </p>
                      <BuilderOptionList aria-label="Answer choices">
                        {watchedOptions.map((opt, idx) => (
                          <OptionRow
                            key={opt.id}
                            letter={OPTION_LETTERS[idx] ?? `${idx + 1}`}
                            optionNumber={idx + 1}
                            option={opt}
                            locked={isTrueFalse}
                            isMulti={isMulti}
                            canRemove={
                              !isTrueFalse &&
                              watchedOptions.length > AUTHORING_MIN_OPTION_COUNT
                            }
                            onTextChange={t => patchOption(opt.id, { text: t })}
                            onSelectLetter={() => selectOptionLetter(opt.id)}
                            onToggleCorrect={() => toggleCorrect(opt.id)}
                            onRationaleChange={r => patchOption(opt.id, { rationale: r })}
                            onRemove={() => removeOption(opt.id)}
                          />
                        ))}
                      </BuilderOptionList>
                      {!isTrueFalse ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          disabled={
                            watchedOptions.length >= AUTHORING_MAX_OPTION_COUNT
                          }
                          className="self-start"
                        >
                          <i className="fa-light fa-plus" aria-hidden="true" />
                          Add option
                        </Button>
                      ) : null}
                      <FormMessage />
                    </BuilderSection>
                  </FormItem>
                )}
              />
            ) : null}

            {/* Numeric — value, tolerance, units. */}
            {isNumeric ? (
              <BuilderSection
                title="Correct value"
                required
                hint="Auto-graded on submit — accept ± tolerance band"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <FormField
                    control={form.control}
                    name="numericValue"
                    render={({ field }) => (
                      <FormItem className="gap-1.5">
                        <Label htmlFor="qb-numeric-value" className="text-xs text-muted-foreground">
                          Answer
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="qb-numeric-value"
                            inputMode="decimal"
                            placeholder="e.g. 12"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Decimal number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numericTolerance"
                    render={({ field }) => (
                      <FormItem className="gap-1.5">
                        <Label htmlFor="qb-numeric-tol" className="text-xs text-muted-foreground">
                          Tolerance ±
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="qb-numeric-tol"
                            inputMode="decimal"
                            placeholder="e.g. 0.5"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Absolute tolerance in the same unit as the answer, e.g. 0.5
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numericUnits"
                    render={({ field }) => (
                      <FormItem className="gap-1.5">
                        <Label htmlFor="qb-numeric-unit" className="text-xs text-muted-foreground">
                          Units
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="qb-numeric-unit"
                            placeholder="e.g. mEq/L"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Unit label (free text), e.g. mEq/L
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </BuilderSection>
            ) : null}

            {/* Fill in the blank — accepted answers per blank. */}
            {isFillBlank ? (
              <BuilderSection
                title="Accepted answers"
                required
                hint={`${watchedFillBlankAnswers.length} blank${watchedFillBlankAnswers.length === 1 ? "" : "s"}`}
              >
                <p className="text-xs text-muted-foreground">
                  One row per blank — separate accepted variants with a comma. Numbered
                  to match the <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{{1}}`}</code>{" "}
                  markers in the lead-in.
                </p>
                <BuilderOptionList aria-label="Accepted answers per blank">
                  {watchedFillBlankAnswers.map((ans, idx) => (
                    <BuilderListRow key={ans.id}>
                      <span className={builderListIndexClass(7)} aria-hidden="true">
                        {idx + 1}
                      </span>
                      <Input
                        value={ans.accepted}
                        onChange={e => patchFillBlank(ans.id, e.target.value)}
                        placeholder="e.g. STEMI, ST-elevation MI"
                        aria-label={`Blank ${idx + 1} accepted answers`}
                        className={BUILDER_LIST_FIELD}
                      />
                      {watchedFillBlankAnswers.length > 1 ? (
                        <BuilderListRowActions>
                          <Tip side="top" label={`Remove blank ${idx + 1}`}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="icon-button-chrome"
                              onClick={() => removeFillBlank(ans.id)}
                              aria-label={`Remove blank ${idx + 1}`}
                            >
                              <i className="fa-light fa-xmark" aria-hidden="true" />
                            </Button>
                          </Tip>
                        </BuilderListRowActions>
                      ) : null}
                    </BuilderListRow>
                  ))}
                </BuilderOptionList>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFillBlank}
                  className="self-start"
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add blank
                </Button>
                <FormMessage />
              </BuilderSection>
            ) : null}

            {/* Matching — pair editor. */}
            {isMatching ? (
              <BuilderSection
                title="Pairs"
                required
                hint={`${watchedPairs.length} pair${watchedPairs.length === 1 ? "" : "s"} · learners drag right side to match left`}
              >
                <p className="text-xs text-muted-foreground">
                  Left column = prompt; right column = match text.
                </p>
                <BuilderOptionList aria-label="Matching pairs">
                  {watchedPairs.map((p, idx) => (
                    <BuilderListRow key={p.id}>
                      <span className={builderListIndexClass(7)} aria-hidden="true">
                        {idx + 1}
                      </span>
                      <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                        <Input
                          value={p.left}
                          onChange={e => patchPair(p.id, { left: e.target.value })}
                          placeholder="Prompt — e.g. β-blocker"
                          aria-label={`Pair ${idx + 1} prompt`}
                          className={BUILDER_LIST_FIELD}
                        />
                        <i
                          className="fa-light fa-arrow-right hidden text-muted-foreground sm:block"
                          aria-hidden="true"
                        />
                        <Input
                          value={p.right}
                          onChange={e => patchPair(p.id, { right: e.target.value })}
                          placeholder="Match — e.g. blocks β1 receptors"
                          aria-label={`Pair ${idx + 1} match`}
                          className={BUILDER_LIST_FIELD}
                        />
                      </div>
                      {watchedPairs.length > 2 ? (
                        <BuilderListRowActions>
                          <Tip side="top" label={`Remove pair ${idx + 1}`}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="icon-button-chrome"
                              onClick={() => removePair(p.id)}
                              aria-label={`Remove pair ${idx + 1}`}
                            >
                              <i className="fa-light fa-xmark" aria-hidden="true" />
                            </Button>
                          </Tip>
                        </BuilderListRowActions>
                      ) : null}
                    </BuilderListRow>
                  ))}
                </BuilderOptionList>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPair}
                  className="self-start"
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add pair
                </Button>
                <FormMessage />
              </BuilderSection>
            ) : null}

            {/* Ordering — ordered list editor with up/down moves. */}
            {isOrdering ? (
              <BuilderSection
                title="Items in correct order"
                required
                hint={`${watchedOrderedItems.length} step${watchedOrderedItems.length === 1 ? "" : "s"} · the order shown here is the answer key`}
              >
                <p className="text-xs text-muted-foreground">
                  Enter each step in correct order — one step per row.
                </p>
                <BuilderOptionList aria-label="Steps in correct order">
                  {watchedOrderedItems.map((item, idx) => (
                    <BuilderListRow key={item.id}>
                      <span className={builderListIndexClass(7)} aria-hidden="true">
                        {idx + 1}
                      </span>
                      <Input
                        value={item.text}
                        onChange={e => patchOrdered(item.id, e.target.value)}
                        placeholder={`Step ${idx + 1} — e.g. Check responsiveness`}
                        aria-label={`Step ${idx + 1}`}
                        className={BUILDER_LIST_FIELD}
                      />
                      <BuilderListRowActions>
                        <Tip side="top" label="Move up">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              "icon-button-chrome",
                              idx === 0 &&
                                "opacity-100 disabled:text-muted-foreground/40",
                            )}
                            disabled={idx === 0}
                            onClick={() => moveOrdered(item.id, -1)}
                            aria-label={`Move step ${idx + 1} up`}
                          >
                            <i className="fa-light fa-arrow-up" aria-hidden="true" />
                          </Button>
                        </Tip>
                        <Tip side="top" label="Move down">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                              "icon-button-chrome",
                              idx === watchedOrderedItems.length - 1 &&
                                "opacity-100 disabled:text-muted-foreground/40",
                            )}
                            disabled={idx === watchedOrderedItems.length - 1}
                            onClick={() => moveOrdered(item.id, 1)}
                            aria-label={`Move step ${idx + 1} down`}
                          >
                            <i className="fa-light fa-arrow-down" aria-hidden="true" />
                          </Button>
                        </Tip>
                        {watchedOrderedItems.length > 2 ? (
                          <Tip side="top" label="Remove step">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="icon-button-chrome"
                              onClick={() => removeOrdered(item.id)}
                              aria-label={`Remove step ${idx + 1}`}
                            >
                              <i className="fa-light fa-xmark" aria-hidden="true" />
                            </Button>
                          </Tip>
                        ) : null}
                      </BuilderListRowActions>
                    </BuilderListRow>
                  ))}
                </BuilderOptionList>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrdered}
                  className="self-start"
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add step
                </Button>
                <FormMessage />
              </BuilderSection>
            ) : null}

            {/* Hotspot — placeholder image picker (full region drawing
                arrives with the asset pipeline; this is a clean empty state). */}
            {isHotspot ? (
              <BuilderSection title="Reference image" hint="Upload + draw correct regions">
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                  <div
                    className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground"
                    aria-hidden="true"
                  >
                    <i className="fa-light fa-bullseye-pointer text-lg" />
                  </div>
                  <div className="max-w-md">
                    <p className="text-sm font-medium text-foreground">
                      Image hotspot authoring
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload an image, then draw the correct region(s). Image
                      upload + region drawing tools arrive in the next phase —
                      for now, describe the expected target in the explanation
                      below.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-disabled
                    className="pointer-events-none opacity-70"
                  >
                    <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
                    Upload image (coming soon)
                  </Button>
                </div>
              </BuilderSection>
            ) : null}

            <FormField
              control={form.control}
              name="rationale"
              render={({ field }) => (
                <FormItem>
                  <BuilderSection
                    title={
                      isShortAnswer
                        ? "Model answer"
                        : isEssay
                          ? "Grading rubric"
                          : "Explanation & rationale"
                    }
                    required={isShortAnswer || isEssay}
                    hint={
                      isShortAnswer
                        ? "Canonical answer + accepted variants"
                        : isEssay
                          ? "Criteria reviewers use to score"
                          : "Cite mechanism, guideline, or reference"
                    }
                  >
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          isShortAnswer
                            ? "e.g. 50 mg/dL\nAccepted: 50, 50.0, fifty milligrams per deciliter"
                            : isEssay
                              ? "Full marks (4): identifies DKA, orders ABG + serum ketones, starts isotonic fluids, replaces K+ before insulin.\nPartial (2-3): identifies DKA but misses K+ replacement.\nMinimal (0-1): misses DKA diagnosis."
                              : AUTHORING_RATIONALE_PLACEHOLDER
                        }
                        rows={isEssay ? 7 : 5}
                        className={cn(
                          "resize-y leading-relaxed",
                          isEssay ? "min-h-[160px]" : "min-h-[120px]",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </BuilderSection>
                </FormItem>
              )}
            />

            {!isShortAnswer && !isEssay ? (
              <FormField
                control={form.control}
                name="references"
                render={({ field }) => (
                  <FormItem>
                    <BuilderSection
                      title="References"
                      hint={
                        field.value.length === 0
                          ? "Optional"
                          : `${field.value.length} cited`
                      }
                    >
                      {field.value.length === 0 ? (
                        <FormDescription>
                          Add Harrison&apos;s, UpToDate, AHA / ATS guidelines, or
                          a journal article a reviewer can verify against.
                        </FormDescription>
                      ) : (
                        <div className="space-y-2">
                          <FormDescription>
                            Full citation — e.g. Harrison&apos;s Internal Medicine, 21st ed., ch. 269
                          </FormDescription>
                          {field.value.map((r, idx) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <span
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground"
                                aria-hidden="true"
                              >
                                {idx + 1}
                              </span>
                              <Input
                                value={r.citation}
                                onChange={e =>
                                  form.setValue(
                                    "references",
                                    field.value.map(x =>
                                      x.id === r.id
                                        ? { ...x, citation: e.target.value }
                                        : x,
                                    ),
                                    { shouldDirty: true },
                                  )
                                }
                                placeholder='e.g. Harrison&apos;s Internal Medicine, 21st ed., ch. 269'
                                aria-label={`Reference ${idx + 1} citation`}
                              />
                              <Tip side="top" label="Remove reference">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeReference(r.id)}
                                  aria-label={`Remove reference ${idx + 1}`}
                                >
                                  <i className="fa-light fa-xmark" aria-hidden="true" />
                                </Button>
                              </Tip>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addReference}
                        className="self-start"
                      >
                        <i className="fa-light fa-plus" aria-hidden="true" />
                        Add reference
                      </Button>
                      <FormMessage />
                    </BuilderSection>
                  </FormItem>
                )}
              />
            ) : null}
            </QuestionBuilderCard>
            </NewFocusTemplate>
            </div>
      </form>

      {/* New folder — invoked from the location picker. Re-uses the
          shared `LibraryNewFolderSheet` (same shell as the folder
          hub) so the surface stays consistent. The created folder is
          appended to `localFolders` and immediately selected. */}
      <LibraryNewFolderSheet
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        parentFolderId={null}
        descriptionText="Drafts created from this composer can land in the new folder right away."
        onCreated={f => {
          const id = newFolderId()
          const created: LibraryFolder = { id, ...f }
          setLocalFolders(prev => [...prev, created])
          form.setValue("folderId", id, { shouldDirty: true, shouldValidate: false })
        }}
      />
    </Form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Option row — grouped list: letter chip marks correct, ⋯ menu for comment/remove.
// ─────────────────────────────────────────────────────────────────────────────

/** Shared list-row chrome — ordering, choices, blanks, pairs use the same card row. */
const BUILDER_LIST_ROW =
  "flex items-center gap-2 rounded-lg border border-border bg-muted/35 px-2.5 py-2"

const BUILDER_LIST_FIELD =
  "h-11 min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0 md:text-lg"

const BUILDER_LIST_LOCKED =
  "flex h-11 min-w-0 flex-1 items-center text-base font-medium text-muted-foreground md:text-lg"

/** Ordinal in builder lists — neutral surface + foreground ink (not brand-disc tokens). */
function builderListIndexClass(size: 6 | 7 = 7) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-muted font-semibold tabular-nums text-foreground",
    size === 6 ? "size-6 text-xs" : "size-7 text-xs",
  )
}

function BuilderOptionList({
  "aria-label": ariaLabel,
  children,
  className,
}: {
  "aria-label": string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

function BuilderListRow({
  children,
  className,
  highlighted,
}: {
  children: React.ReactNode
  className?: string
  highlighted?: boolean
}) {
  return (
    <div
      className={cn(
        BUILDER_LIST_ROW,
        highlighted && "border-brand/50 ring-1 ring-inset ring-brand/30",
        className,
      )}
    >
      {children}
    </div>
  )
}

function BuilderListRowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-0.5">{children}</div>
}

interface OptionRowProps {
  letter: string
  optionNumber: number
  option: { id: string; text: string; isCorrect: boolean; rationale: string }
  locked: boolean
  isMulti: boolean
  canRemove: boolean
  onTextChange: (t: string) => void
  onSelectLetter: () => void
  onToggleCorrect: () => void
  onRationaleChange: (t: string) => void
  onRemove: () => void
}

function OptionRow({
  letter,
  optionNumber,
  option,
  locked,
  isMulti,
  canRemove,
  onTextChange,
  onSelectLetter,
  onToggleCorrect,
  onRationaleChange,
  onRemove,
}: OptionRowProps) {
  const [rationaleOpen, setRationaleOpen] = React.useState(option.rationale.length > 0)

  return (
    <div className="space-y-2">
      <BuilderListRow highlighted={option.isCorrect}>
        <Tip
          side="top"
          label={
            option.isCorrect
              ? isMulti
                ? `Option ${letter} is correct — click to unmark`
                : `Option ${letter} is the correct answer`
              : `Mark option ${letter} as correct`
          }
        >
          <button
            type="button"
            onClick={onSelectLetter}
            aria-pressed={option.isCorrect}
            aria-label={
              option.isCorrect
                ? isMulti
                  ? `Option ${letter}, marked correct`
                  : `Option ${letter}, correct answer`
                : `Mark option ${letter} as correct`
            }
            className={cn(
              builderListIndexClass(7),
              "text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              option.isCorrect &&
                "border-brand bg-muted/40 ring-1 ring-brand dark:border-[var(--brand-color-light)] dark:bg-muted/50 dark:ring-[var(--brand-color-light)]",
            )}
          >
            {letter}
          </button>
        </Tip>

        {locked ? (
          <div
            className={BUILDER_LIST_LOCKED}
            aria-label={`Option ${letter} text, fixed label`}
          >
            {option.text}
          </div>
        ) : (
          <Input
            value={option.text}
            onChange={e => onTextChange(e.target.value)}
            placeholder={`Option ${optionNumber}`}
            aria-label={`Option ${letter} text`}
            className={BUILDER_LIST_FIELD}
          />
        )}

        {!locked ? (
          <BuilderListRowActions>
            <DropdownMenu>
              <Tip side="top" label="More actions">
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="icon-button-chrome"
                    aria-label={`More actions for option ${letter}`}
                  >
                    <i className="fa-light fa-ellipsis" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </Tip>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onSelect={() => onToggleCorrect()}>
                  <i
                    className={cn(
                      "fa-light",
                      option.isCorrect ? "fa-circle-xmark" : "fa-circle-check",
                    )}
                    aria-hidden="true"
                  />
                  {option.isCorrect ? "Unmark correct" : "Mark correct"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setRationaleOpen(open => !open)}
                >
                  <i
                    className={cn(
                      "fa-light",
                      rationaleOpen ? "fa-message-slash" : "fa-message-lines",
                    )}
                    aria-hidden="true"
                  />
                  {rationaleOpen ? "Hide comment" : "Add comment"}
                </DropdownMenuItem>
                {canRemove ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onRemove()}
                    >
                      <i className="fa-light fa-trash-can" aria-hidden="true" />
                      Remove option
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </BuilderListRowActions>
        ) : null}
      </BuilderListRow>

      {rationaleOpen && !locked ? (
        <div className={cn(BUILDER_LIST_ROW, "flex-col items-stretch gap-2 py-2.5 ps-11")}>
          <Textarea
            value={option.rationale}
            onChange={e => onRationaleChange(e.target.value)}
            placeholder={
              option.isCorrect
                ? "Why this is the single best answer (mechanism, guideline)…"
                : "Why this distractor is plausible but wrong (common confusion)…"
            }
            rows={2}
            className="min-h-[64px] resize-y border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
            aria-label={`Option ${letter} rationale`}
          />
        </div>
      ) : null}
    </div>
  )
}
