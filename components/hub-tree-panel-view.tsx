"use client"

/**
 * **Tree view** — `ListPageTreePanelShell` + outline tree + read-only details (`FolderDetailsShell`).
 * Hub wiring (folders, mock sheet) stays in the caller; this module hosts library demo wiring only.
 */

import * as React from "react"
import { LIST_HUB_INSPECTOR_CHIP_SHELL } from "@/components/list-hub-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Tip } from "@/components/ui/tip"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  OutlineTreeCollapsibleContentRail,
  OutlineTreeLeafButton,
  OutlineTreeMenu,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  OutlineTreeSubItem,
} from "@/components/data-views/outline-tree-menu"
import { ListPageTreePanelShell } from "@/components/data-views/list-page-tree-panel-shell"
import { ListPageSplitDetailsPlaceholder } from "@/components/data-views/list-page-split-details-placeholder"
import { ListPageTreeColumnHeader } from "@/components/data-views/list-page-tree-column-header"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import type {
  LibraryItem,
  LibraryLevel,
} from "@/lib/mock/library"
import type { LibraryFolder, LibraryFolderColorKey } from "@/lib/mock/library-folders"
import { formatDateUS } from "@/lib/date-filter"
import {
  deriveBloomLevel,
  deriveLastEditedLine,
  deriveQuestionItemCode,
  deriveTags,
  QUESTION_TYPE_ABBREV,
} from "@/lib/mock/library-inspector"
import { FolderDetailsShell } from "@/components/folder-details-shell"
import { initialsFromDisplayName } from "@/lib/initials-from-name"

const DIFFICULTY_LABEL: Record<LibraryLevel, string> = {
  easy: "Low",
  medium: "Normal",
  hard: "High",
}

// ============================================================================
// TreeItem — recursive folder/question renderer using Collapsible
// ============================================================================

interface TreeItemProps {
  folder: LibraryFolder
  folders: LibraryFolder[]
  questions: LibraryItem[]
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
}

function TreeItem({
  folder,
  folders,
  questions,
  selectedItemId,
  onSelectItem,
}: TreeItemProps) {
  const childFolders = folders
    .filter(f => f.parentId === folder.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const childQuestions = questions
    .filter(q => q.folderId === folder.id)

  const hasChildren = childFolders.length > 0 || childQuestions.length > 0
  const isFolderSelected = selectedItemId === folder.id

  return (
    <Collapsible className="group/collapsible">
      {/* Folder row — chevron column + row body (icons align with shadcn tree pattern) */}
      <div
        className={cn(
          "flex min-h-8 items-center rounded-md px-2 hover:bg-muted/50",
          isFolderSelected && "bg-accent text-accent-foreground",
        )}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={folder.name ? `${folder.name} — expand or collapse` : "Expand or collapse folder"}
            >
              <i
                className="fa-light fa-chevron-right shrink-0 text-[13px] leading-none transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90"
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <div className="size-8 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => onSelectItem(folder.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-1.5 pe-3 text-left text-sm transition-colors duration-75",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            !isFolderSelected && "text-foreground",
          )}
          aria-selected={isFolderSelected}
          role="option"
        >
          <i
            className={cn(
              "fa-light fa-folder shrink-0 text-[13px] leading-none",
              isFolderSelected ? "fa-solid opacity-80" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="truncate leading-tight">{folder.name}</span>
          {hasChildren && (
            <span className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">
              {childFolders.length + childQuestions.length}
            </span>
          )}
        </button>
      </div>

      {hasChildren && (
        <OutlineTreeCollapsibleContentRail>
          <OutlineTreeSub surface="panel" guideLayout="chevronRail">
            {childFolders.map(child => (
              <OutlineTreeMenuItem key={child.id}>
                <TreeItem
                  folder={child}
                  folders={folders}
                  questions={questions}
                  selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem}
                />
              </OutlineTreeMenuItem>
            ))}
            {childQuestions.map(question => {
              const isSelected = selectedItemId === question.id
              return (
                <OutlineTreeSubItem key={question.id}>
                  <OutlineTreeLeafButton
                    surface="panel"
                    isActive={isSelected}
                    onClick={() => onSelectItem(question.id)}
                    aria-selected={isSelected}
                    role="option"
                    className="h-auto min-h-8 items-start py-1.5"
                  >
                    <i
                      className={cn(
                        "fa-light fa-file mt-0.5 shrink-0 text-[13px] leading-none",
                        isSelected ? "fa-solid opacity-80" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate leading-tight">{question.stem}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {question.questionId}
                      </span>
                    </span>
                  </OutlineTreeLeafButton>
                </OutlineTreeSubItem>
              )
            })}
          </OutlineTreeSub>
        </OutlineTreeCollapsibleContentRail>
      )}
    </Collapsible>
  )
}

// ============================================================================
// DetailsPanel — right panel content (folder or question details)
// ============================================================================

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

interface DetailsPanelProps {
  selectedItemId: string | null
  folders: LibraryFolder[]
  questions: LibraryItem[]
  /** Clears tree selection (header dismiss). */
  onClearSelection?: () => void
}

function DetailsPanel({ selectedItemId, folders, questions, onClearSelection }: DetailsPanelProps) {
  if (!selectedItemId) {
    return (
      <ListPageSplitDetailsPlaceholder title="Nothing selected" />
    )
  }

  const folder = folders.find(f => f.id === selectedItemId)
  if (folder) {
    return (
      <FolderDetailsShell
        folder={folder}
        folders={folders}
        questions={questions}
        onClearSelection={onClearSelection}
      />
    )
  }

  const question = questions.find(q => q.id === selectedItemId)
  if (question) {
    const parentFolder = folders.find(f => f.id === question.folderId)
    const folderLeafName = parentFolder?.name ?? "—"
    const itemCode = deriveQuestionItemCode(question)
    const bloom = deriveBloomLevel(question)
    const tags = deriveTags(question)
    const createdBy = question.createdBy ?? question.author
    const creatorInitials = initialsFromDisplayName(createdBy)
    const createdAtLabel = formatDateUS(question.createdAt ?? question.updatedAt)
    const lastEditedLine = deriveLastEditedLine(question)
    const versionLabel = question.version ?? "v1"

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card">
        <header className="shrink-0 border-b border-border/60 bg-card px-4 pb-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs text-muted-foreground">{question.questionId}</p>
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
          <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-foreground">{question.stem}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tip label="Opens the full editor when your bank workflow is connected." side="bottom">
              <span className="inline-flex">
                <Button type="button" size="sm" className="gap-1.5 shadow-sm" disabled>
                  <i className="fa-light fa-pencil text-[13px] leading-none" aria-hidden="true" />
                  Edit question
                </Button>
              </span>
            </Tip>
            <Tip label="Revert connects when your assessments API is wired." side="bottom">
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
                  <i className="fa-light fa-hourglass text-[13px] leading-none" aria-hidden="true" />
                  Revert to draft
                </Button>
              </span>
            </Tip>
            <Tip label="Move question connects when folder APIs are wired." side="bottom">
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
                  <i className="fa-light fa-right-left text-[13px] leading-none" aria-hidden="true" />
                  Move
                </Button>
              </span>
            </Tip>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="space-y-5 px-4 py-4">
            <dl className="space-y-2.5 text-sm">
              <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Bloom&apos;s</dt>
                <dd className="font-medium text-foreground">{bloom}</dd>
              </div>
              <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Difficulty</dt>
                <dd className="font-medium text-foreground">{DIFFICULTY_LABEL[question.difficulty]}</dd>
              </div>
              <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium text-foreground">{QUESTION_TYPE_ABBREV[question.type]}</dd>
              </div>
              <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Folder</dt>
                <dd className="min-w-0 font-medium text-foreground">{folderLeafName}</dd>
              </div>
              <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Code</dt>
                <dd>
                  <span className="inline-flex rounded-md border border-rose-200/90 bg-rose-50 px-2 py-0.5 font-mono text-xs font-medium leading-none text-rose-950 shadow-sm dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-50">
                    {itemCode}
                  </span>
                </dd>
              </div>
            </dl>

            {tags.length > 0 ? (
              <div>
                <InspectorSectionTitle>Tags</InspectorSectionTitle>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Question tags">
                  {tags.map(raw => {
                    const label = raw.replace(/^#/, "").trim()
                    return (
                      <Badge
                        key={label}
                        variant="outline"
                        role="listitem"
                        className={cn(
                          LIST_HUB_INSPECTOR_CHIP_SHELL,
                          "border-border/60 bg-muted/15 font-normal text-foreground",
                        )}
                      >
                        #{label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <Separator className="bg-border/60" />

            <section className="min-w-0">
              <InspectorSectionTitle>Creator &amp; history</InspectorSectionTitle>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-xs font-semibold text-pink-950 dark:bg-pink-500/25 dark:text-pink-50"
                    aria-hidden
                  >
                    {creatorInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="font-medium leading-snug text-foreground">{createdBy}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{createdAtLabel}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last edited</p>
                  <p className="font-medium text-foreground">{lastEditedLine}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Version </span>
                    <span className="font-medium tabular-nums text-foreground">{versionLabel}</span>
                  </p>
                  <Tip label="Version history opens when connected to your CMS.">
                    <span className="inline-flex">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto gap-1 px-0 py-0 text-xs font-normal"
                        disabled
                      >
                        Version history
                        <i className="fa-light fa-chevron-right text-[13px] leading-none opacity-70" aria-hidden="true" />
                      </Button>
                    </span>
                  </Tip>
                </div>
              </div>
            </section>

            <Separator className="bg-border/60" />

            <section className="min-w-0">
              <InspectorSectionTitle>Usage</InspectorSectionTitle>
              <dl className="space-y-2 text-sm">
                <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
                  <dt className="text-muted-foreground">Used in</dt>
                  <dd className="font-medium text-foreground">
                    {question.examUsageCount != null ? `${question.examUsageCount} exams` : "—"}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
                  <dt className="text-muted-foreground">PBI</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {question.pbi != null ? question.pbi.toFixed(2) : "—"}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
                  <dt className="text-muted-foreground">Avg score</dt>
                  <dd className="font-medium text-foreground">
                    {question.avgScoreCorrectPct != null ? `${question.avgScoreCorrectPct}% correct` : "—"}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
                  <dt className="text-muted-foreground">Last used</dt>
                  <dd className="font-medium text-foreground">{question.lastUsedLabel ?? "—"}</dd>
                </div>
              </dl>
            </section>

            {question.type === "multiple_choice" && question.options && question.options.length > 0 ? (
              <>
                <Separator className="bg-border/60" />
                <DetailSection title="Answer choices">
                  <ul className="flex flex-col gap-2" aria-label="Multiple choice options">
                    {question.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const isCorrect = Boolean(opt.isCorrect)
                      return (
                        <li
                          key={`${question.id}-opt-${idx}`}
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                            isCorrect
                              ? "border-emerald-500/40 bg-emerald-500/10 shadow-[inset_0_0_0_1px] shadow-emerald-500/15"
                              : "border-border/50 bg-muted/10",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums",
                              isCorrect
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
                                : "border-border/60 bg-background text-muted-foreground",
                            )}
                          >
                            {letter}
                          </span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 leading-snug",
                              isCorrect ? "font-medium text-foreground" : "text-foreground/90",
                            )}
                          >
                            {opt.text}
                          </span>
                          {isCorrect ? (
                            <span className="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <i className="fa-light fa-circle-check text-[13px] leading-none" aria-hidden="true" />
                              <span className="sr-only">Correct answer</span>
                            </span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </DetailSection>
              </>
            ) : null}

            {question.type === "true_false" ? (
              <>
                <Separator className="bg-border/60" />
                <DetailSection title="Response format">
                  <p className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    Learners choose <span className="font-medium text-foreground">True</span> or{" "}
                    <span className="font-medium text-foreground">False</span>. No options list is shown in the bank
                    preview.
                  </p>
                </DetailSection>
              </>
            ) : null}

            {question.type === "short_answer" ? (
              <>
                <Separator className="bg-border/60" />
                <DetailSection title="Response format">
                  <p className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    Free-text response; grading rules and sample answers are managed when the question is edited in the
                    full editor.
                  </p>
                </DetailSection>
              </>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-card px-6 py-10 text-center text-muted-foreground">
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/60 bg-card">
        <i className="fa-light fa-file text-2xl leading-none opacity-50" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">Item not found</p>
      <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
        This selection is no longer in the tree. Choose another folder or question.
      </p>
    </div>
  )
}

// ============================================================================
// HubTreePanelView — tree + details wiring (library demo; reusable shell above)
// ============================================================================

export interface HubTreePanelViewProps {
  items: LibraryItem[]
  folders: LibraryFolder[]
  onItemsChange: (items: LibraryItem[]) => void
  onFoldersChange: (folders: LibraryFolder[]) => void
}

export function HubTreePanelView({
  items,
  folders,
  onFoldersChange,
}: HubTreePanelViewProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null)
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const [newFolderParentId, setNewFolderParentId] = React.useState<string | null>(null)
  const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)

  const rootFolders = React.useMemo(
    () => folders.filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const handleNewFolderCreated = React.useCallback(
    (newFolder: { name: string; icon: string; colorKey: LibraryFolderColorKey; parentId: string | null }) => {
      if (customizingFolder) {
        onFoldersChange(
          folders.map(f =>
            f.id === customizingFolder.id
              ? { ...f, name: newFolder.name, icon: newFolder.icon, colorKey: newFolder.colorKey }
              : f,
          ),
        )
        setCustomizingFolder(null)
      } else {
        onFoldersChange([
          ...folders,
          {
            id: `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            name: newFolder.name,
            icon: newFolder.icon,
            colorKey: newFolder.colorKey,
            parentId: newFolder.parentId,
          },
        ])
      }
      setNewFolderOpen(false)
    },
    [customizingFolder, folders, onFoldersChange],
  )

  return (
    <>
      <ListPageTreePanelShell
        resizableGroupId="hub-tree-panel"
        ariaLabel="Folder tree and details"
        tree={
          <>
            <ListPageTreeColumnHeader
              title="Questions"
              trailing={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setNewFolderParentId(null)
                        setCustomizingFolder(null)
                        setNewFolderOpen(true)
                      }}
                      aria-label="Add folder"
                    >
                      <i className="fa-light fa-folder-plus text-xs" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}>
                    Add folder
                  </TooltipContent>
                </Tooltip>
              }
            />

            <OutlineTreeMenu
              className="min-h-0 flex-1 overflow-y-auto py-1"
              role="listbox"
              aria-label="Folder tree"
            >
              {rootFolders.length === 0 ? (
                <li className="list-none px-3 py-4 text-sm text-muted-foreground">No folders</li>
              ) : (
                rootFolders.map(folder => (
                  <OutlineTreeMenuItem key={folder.id}>
                    <TreeItem
                      folder={folder}
                      folders={folders}
                      questions={items}
                      selectedItemId={selectedItemId}
                      onSelectItem={setSelectedItemId}
                    />
                  </OutlineTreeMenuItem>
                ))
              )}
            </OutlineTreeMenu>
          </>
        }
        details={
          <DetailsPanel
            selectedItemId={selectedItemId}
            folders={folders}
            questions={items}
            onClearSelection={() => setSelectedItemId(null)}
          />
        }
      />

      <LibraryNewFolderSheet
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        parentFolderId={customizingFolder?.parentId ?? newFolderParentId}
        customizingFolder={customizingFolder}
        onCreated={handleNewFolderCreated}
      />
    </>
  )
}
