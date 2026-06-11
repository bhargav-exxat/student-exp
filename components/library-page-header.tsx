"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  PageHeader,
  type PageHeaderCollaborator,
  type PageHeaderVariant,
} from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { COLLABORATION_HEADER_ADD_LABEL } from "@/lib/collaborator-access"
import { LIBRARY_HEADER_COLLABORATORS } from "@/lib/mock/library-header-collaborators"

export interface LibraryPageHeaderProps {
  /** Scoped hub title (All / My / folder name) — keep in sync with `SiteHeader`. */
  title: string
  questionCount: number
  onNewQuestion: () => void
  onExport: () => void
  /** Omitted on surfaces without a metric strip (e.g. dedicated search). */
  showMetrics?: boolean
  onToggleMetrics?: () => void
  showTitleBlock?: boolean
  /** `collaboration` adds access line + collaborator face row before CTAs. */
  variant?: PageHeaderVariant
  /** Optional role / access row when `variant="collaboration"` (badge + copy). */
  accessInfo?: React.ReactNode
  collaborators?: PageHeaderCollaborator[]
  collaboratorDisplayLimit?: number
  onAddCollaborator?: () => void
  onCollaboratorsOpen?: () => void
  /** Empty-roster header CTA — default **Add collaborator**. */
  collaborationAddLabel?: string
  addCollaboratorLabel?: string
  /** When false, the primary “New question” button is omitted (e.g. search landing). */
  hideNewQuestion?: boolean
  /** Replaces the default “N questions · Last updated…” subtitle when set. */
  subtitleOverride?: string
  /** Omits the action column (e.g. search landing before first query). */
  hideActions?: boolean
  /**
   * When provided, the **More** menu includes **Customize folder** (opens the hub folder sheet).
   * Wire this when the library is scoped to a folder (`?scope=folder&folderId=…`).
   */
  onCustomizeFolder?: () => void
}

export function LibraryPageHeader({
  title,
  questionCount,
  onNewQuestion,
  onExport,
  showMetrics,
  onToggleMetrics,
  showTitleBlock = true,
  variant = "default",
  accessInfo,
  collaborators = LIBRARY_HEADER_COLLABORATORS,
  collaboratorDisplayLimit = 3,
  onAddCollaborator = () => {},
  onCollaboratorsOpen,
  collaborationAddLabel = COLLABORATION_HEADER_ADD_LABEL,
  addCollaboratorLabel = "Invite people",
  hideNewQuestion = false,
  subtitleOverride,
  hideActions = false,
  onCustomizeFolder,
}: LibraryPageHeaderProps) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const countLine =
    subtitleOverride ??
    `${questionCount} ${questionCount === 1 ? "question" : "questions"} · Last updated now`
  const resolvedAccess = variant === "collaboration" ? accessInfo : undefined

  return (
    <PageHeader
      title={title}
      subtitle={countLine}
      variant={variant}
      accessInfo={resolvedAccess}
      collaborators={variant === "collaboration" ? collaborators : undefined}
      collaboratorDisplayLimit={collaboratorDisplayLimit}
      onCollaboratorsOpen={onCollaboratorsOpen ?? onAddCollaborator}
      addCollaboratorLabel={collaborationAddLabel}
      showTitleBlock={showTitleBlock}
      actions={
        hideActions ? undefined : (
          <div className="flex items-center gap-2" role="group" aria-label="Library actions">
            {!hideNewQuestion ? (
              <Tip side="bottom" label="Create a new question (demo)">
                <Button type="button" size="lg" onClick={onNewQuestion}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  New question
                </Button>
              </Tip>
            ) : null}
            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <Tip side="bottom" label="More actions">
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon-lg"
                    variant="outline"
                    aria-label="More actions"
                  >
                    <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </Tip>
              <DropdownMenuContent align="end">
                {variant === "collaboration" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      window.setTimeout(() => onAddCollaborator(), 0)
                    }}
                  >
                    <i className="fa-light fa-user-plus" aria-hidden="true" />
                    {addCollaboratorLabel}
                  </DropdownMenuItem>
                ) : null}
                {onCustomizeFolder ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      window.setTimeout(() => onCustomizeFolder(), 0)
                    }}
                  >
                    <i className="fa-light fa-wand-magic-sparkles" aria-hidden="true" />
                    Customize folder
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onSelect={() => {
                    window.setTimeout(() => onExport(), 0)
                  }}
                >
                  <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                  Export
                </DropdownMenuItem>
                {onToggleMetrics != null ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      window.setTimeout(() => onToggleMetrics(), 0)
                    }}
                  >
                    <i
                      className={`fa-light ${(showMetrics ?? false) ? "fa-eye-slash" : "fa-eye"}`}
                      aria-hidden="true"
                    />
                    {(showMetrics ?? false) ? "Hide metric section" : "Show metric section"}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    />
  )
}
