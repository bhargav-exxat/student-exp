"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"

export interface QuestionBankPageHeaderProps {
  questionCount: number
  onAddQuestion: () => void
  onExport: () => void
  onCreateAssessment?: () => void
  showMetrics?: boolean
  onToggleMetrics?: () => void
  program?: string
}

export function QuestionBankPageHeader({
  questionCount,
  onAddQuestion,
  onExport,
  onCreateAssessment,
  showMetrics,
  onToggleMetrics,
  program = "All Programs",
}: QuestionBankPageHeaderProps) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const subtitle = `${questionCount} ${questionCount === 1 ? "question" : "questions"} · ${program}`

  return (
    <PageHeader
      title="Question Bank"
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-2" role="group" aria-label="Question Bank actions">
          {onCreateAssessment ? (
            <Tip side="bottom" label="Add questions from this bank to a new assessment">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={onCreateAssessment}
              >
                <i className="fa-light fa-file-circle-plus" aria-hidden="true" />
                Create Assessment
              </Button>
            </Tip>
          ) : null}
          <Tip side="bottom" label="Add a new question to the bank">
            <Button type="button" size="lg" onClick={onAddQuestion}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Question
            </Button>
          </Tip>
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
              <DropdownMenuItem onSelect={() => window.setTimeout(() => onExport(), 0)}>
                <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                Export
              </DropdownMenuItem>
              {onToggleMetrics != null ? (
                <DropdownMenuItem onSelect={() => window.setTimeout(() => onToggleMetrics(), 0)}>
                  <i
                    className={`fa-light ${(showMetrics ?? false) ? "fa-eye-slash" : "fa-eye"}`}
                    aria-hidden="true"
                  />
                  {(showMetrics ?? false) ? "Hide metrics" : "Show metrics"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}
