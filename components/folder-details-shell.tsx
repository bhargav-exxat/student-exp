"use client"

/**
 * Folder details panel — OsFolderGlyph header + aggregates (`library-inspector` helpers today).
 * Reusable across list hubs that share `LibraryFolder` / `LibraryItem` shapes or adapters.
 */

import * as React from "react"
import { OsFolderGlyph } from "@/components/data-views/os-folder-glyph"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import type { LibraryItem } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import {
  aggregateFolderQuestions,
  BLOOM_LEVEL_ORDER,
  questionsInFolderSubtree,
} from "@/lib/mock/library-inspector"

function DetailBreadcrumbNav({ segments }: { segments: { id: string; label: string }[] }) {
  if (segments.length === 0) return null
  return (
    <nav aria-label="Path in folder tree" className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {segments.map((seg, idx) => (
        <React.Fragment key={seg.id}>
          {idx > 0 && <i className="fa-light fa-chevron-right shrink-0 text-[11px] leading-none opacity-40" aria-hidden="true" />}
          <span
            className={cn(
              "min-w-0 truncate",
              idx === segments.length - 1 ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {seg.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function InspectorSectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </p>
  )
}

export interface FolderDetailsShellProps {
  folder: LibraryFolder
  folders: LibraryFolder[]
  questions: LibraryItem[]
  /** Clears selection (tree inspector dismiss). */
  onClearSelection?: () => void
}

export function FolderDetailsShell({
  folder,
  folders,
  questions,
  onClearSelection,
}: FolderDetailsShellProps) {
  const subtreeQuestions = questionsInFolderSubtree(folders, questions, folder.id)
  const agg = aggregateFolderQuestions(subtreeQuestions)
  const { totalQuestions, difficulty: diffAgg, bloom, avgPbi, scoredCount } = agg
  const diffSum = diffAgg.easy + diffAgg.medium + diffAgg.hard
  const maxBloomCount = Math.max(1, ...BLOOM_LEVEL_ORDER.map(level => bloom[level] ?? 0))

  const breadcrumbs: LibraryFolder[] = []
  let cur: LibraryFolder | undefined = folder
  while (cur) {
    breadcrumbs.unshift(cur)
    cur = folders.find(f => f.id === cur?.parentId)
  }
  const pathSegments = breadcrumbs.map(f => ({ id: f.id, label: f.name }))

  const diffHeadingId = `folder-details-difficulty-${folder.id}`
  const bloomHeadingId = `folder-details-bloom-${folder.id}`

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card">
      <header className="shrink-0 border-b border-border/60 bg-card px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <OsFolderGlyph
              colorKey={folder.colorKey}
              icon={folder.icon}
              size="xs"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">
                <span className="truncate">{folder.name}</span>
                <span className="font-normal text-muted-foreground"> · Library</span>
              </h2>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {onClearSelection ? (
            <Tip label="Close details" side="bottom">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onClearSelection}
                aria-label="Close details"
              >
                <i className="fa-light fa-xmark text-[13px] leading-none" aria-hidden="true" />
              </Button>
            </Tip>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
        <div className="space-y-5 px-4 py-4">
          <section aria-labelledby={diffHeadingId}>
            <InspectorSectionTitle id={diffHeadingId}>Difficulty</InspectorSectionTitle>
            <div
              className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Difficulty mix: ${diffAgg.easy} easy, ${diffAgg.medium} medium, ${diffAgg.hard} hard of ${diffSum || 0} questions`}
            >
              {diffSum === 0 ? (
                <div className="h-full w-full bg-muted" />
              ) : (
                <>
                  <div
                    className="h-full bg-emerald-400/85 dark:bg-emerald-500/70"
                    style={{ width: `${(diffAgg.easy / diffSum) * 100}%` }}
                  />
                  <div
                    className="h-full bg-amber-400/90 dark:bg-amber-500/75"
                    style={{ width: `${(diffAgg.medium / diffSum) * 100}%` }}
                  />
                  <div className="h-full bg-slate-500 dark:bg-slate-600" style={{ width: `${(diffAgg.hard / diffSum) * 100}%` }} />
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-sm bg-emerald-400/85 dark:bg-emerald-500/70" aria-hidden />
                Easy: <span className="tabular-nums font-medium">{diffAgg.easy}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-sm bg-amber-400/90 dark:bg-amber-500/75" aria-hidden />
                Medium: <span className="tabular-nums font-medium">{diffAgg.medium}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-sm bg-slate-500 dark:bg-slate-600" aria-hidden />
                Hard: <span className="tabular-nums font-medium">{diffAgg.hard}</span>
              </span>
            </div>
          </section>

          <Separator className="bg-border/60" />

          <section aria-labelledby={bloomHeadingId}>
            <InspectorSectionTitle id={bloomHeadingId}>Bloom&apos;s</InspectorSectionTitle>
            <ul className="flex flex-col gap-2.5" aria-label="Bloom taxonomy counts">
              {BLOOM_LEVEL_ORDER.map(level => {
                const count = bloom[level] ?? 0
                const barPct = maxBloomCount ? (count / maxBloomCount) * 100 : 0
                return (
                  <li key={level} className="grid grid-cols-[minmax(5.5rem,auto)_1fr_auto] items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{level}</span>
                    <div className="min-w-0">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-pink-500/75 dark:bg-pink-500/65"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-7 shrink-0 text-right tabular-nums font-medium text-foreground">{count}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          <Separator className="bg-border/60" />

          <p className="text-xs text-muted-foreground">
            Avg. pBIS:{" "}
            <span className="font-semibold text-foreground">{avgPbi != null ? avgPbi.toFixed(2) : "—"}</span>{" "}
            <span className="tabular-nums">
              ({scoredCount} of {totalQuestions} scored)
            </span>
          </p>

          {pathSegments.length > 0 ? (
            <>
              <Separator className="bg-border/60" />
              <DetailSection title="Location">
                <DetailBreadcrumbNav segments={pathSegments} />
              </DetailSection>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
