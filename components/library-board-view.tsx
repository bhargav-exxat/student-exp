"use client"

import * as React from "react"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import type {
  LibraryLevel,
  LibraryItem,
  LibraryItemType,
} from "@/lib/mock/library"
import {
  LIST_HUB_STATUS_TINT_DANGER,
  LIST_HUB_STATUS_TINT_INFO,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
} from "@/lib/list-status-badges"
import { formatDateUS } from "@/lib/date-filter"
import { BoardCardTwoLineBlock } from "@/components/data-views/board-card-primitives"
import {
  ListPageBoardCard,
  ListPageBoardCardAvatar,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardTitleRow,
} from "@/components/data-views/list-page-board-card"
import {
  ListPageBoardTemplate,
  type ListPageBoardColumnDef,
} from "@/components/data-views/list-page-board-template"
import {
  LibraryFavoriteButton,
  LIBRARY_FAVORITE_HOVER_GROUP,
} from "@/components/library-favorite-button"
import { cn } from "@/lib/utils"

const NEUTRAL_COUNT_BADGE = "bg-muted/90 text-foreground"

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Type 1",
  true_false: "Type 2",
  short_answer: "Type 3",
}

const DIFF_LABEL: Record<LibraryLevel, string> = {
  easy: "Low",
  medium: "Normal",
  hard: "High",
}

const DIFF_BADGE: Record<LibraryLevel, string> = {
  easy: LIST_HUB_STATUS_TINT_SUCCESS,
  medium: LIST_HUB_STATUS_TINT_WARNING,
  hard: LIST_HUB_STATUS_TINT_DANGER,
}

const TYPE_BADGE: Record<LibraryItemType, string> = {
  multiple_choice: LIST_HUB_STATUS_TINT_NEUTRAL,
  true_false: LIST_HUB_STATUS_TINT_INFO,
  short_answer: LIST_HUB_STATUS_TINT_WARNING,
}

const DIFF_ORDER: LibraryLevel[] = ["easy", "medium", "hard"]
const TYPE_ORDER: LibraryItemType[] = ["multiple_choice", "true_false", "short_answer"]

function topicBoardColumns(rows: LibraryItem[]): {
  columns: ListPageBoardColumnDef<LibraryItem>[]
  badgeMap: Record<string, string>
} {
  const topics = [...new Set(rows.map(r => r.topic))].sort((a, b) => a.localeCompare(b))
  const columns: ListPageBoardColumnDef<LibraryItem>[] = topics.map(topic => ({
    id: `topic:${topic}`,
    label: topic,
    filter: (r: LibraryItem) => r.topic === topic,
  }))
  const badgeMap = Object.fromEntries(topics.map(t => [`topic:${t}`, NEUTRAL_COUNT_BADGE]))
  return { columns, badgeMap }
}

function difficultyBoardColumns(): {
  columns: ListPageBoardColumnDef<LibraryItem>[]
  badgeMap: Record<string, string>
} {
  const columns: ListPageBoardColumnDef<LibraryItem>[] = DIFF_ORDER.map(d => ({
    id: d,
    label: DIFF_LABEL[d],
    filter: (r: LibraryItem) => r.difficulty === d,
  }))
  const badgeMap = Object.fromEntries(DIFF_ORDER.map(d => [d, DIFF_BADGE[d]]))
  return { columns, badgeMap }
}

function typeBoardColumns(): {
  columns: ListPageBoardColumnDef<LibraryItem>[]
  badgeMap: Record<string, string>
} {
  const columns: ListPageBoardColumnDef<LibraryItem>[] = TYPE_ORDER.map(t => ({
    id: t,
    label: TYPE_LABEL[t],
    filter: (r: LibraryItem) => r.type === t,
  }))
  const badgeMap = Object.fromEntries(TYPE_ORDER.map(t => [t, TYPE_BADGE[t]]))
  return { columns, badgeMap }
}

function useLibraryBoardModel(rows: LibraryItem[], groupByColumnKey: string) {
  return React.useMemo(() => {
    if (groupByColumnKey === "topic") {
      const { columns, badgeMap } = topicBoardColumns(rows)
      return { columns, badgeMap }
    }
    if (groupByColumnKey === "difficulty") {
      const { columns, badgeMap } = difficultyBoardColumns()
      return { columns, badgeMap }
    }
    if (groupByColumnKey === "type") {
      const { columns, badgeMap } = typeBoardColumns()
      return { columns, badgeMap }
    }
    const { columns, badgeMap } = topicBoardColumns(rows)
    return { columns, badgeMap }
  }, [rows, groupByColumnKey])
}

function LibraryBoardCard({
  row,
  onToggleFavorite,
  onRowActivate,
}: {
  row: LibraryItem
  onToggleFavorite: (row: LibraryItem) => void
  onRowActivate?: (row: LibraryItem) => void
}) {
  const initials = initialsFromDisplayName(row.author)
  return (
    <ListPageBoardCard
      className={cn(LIBRARY_FAVORITE_HOVER_GROUP, "w-full")}
      onClick={onRowActivate ? () => onRowActivate(row) : undefined}
    >
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={(
            <span className="block">
              <span className="line-clamp-2">{row.stem}</span>
              <span className="mt-0.5 block font-mono text-xs font-normal text-muted-foreground">
                {row.questionId}
              </span>
            </span>
          )}
          trailing={(
            <div className="flex shrink-0 items-start gap-1">
              <LibraryFavoriteButton row={row} onToggleFavorite={onToggleFavorite} />
              <ListPageBoardCardAvatar initials={initials} />
            </div>
          )}
        />
        <ListPageBoardCardBody>
          <BoardCardTwoLineBlock
            iconClass="fa-tag"
            line1={row.topic}
            line2={row.type.replace(/_/g, " ")}
          />
          <BoardCardTwoLineBlock iconClass="fa-calendar-days" line1={formatDateUS(row.updatedAt)} line2="Updated" />
        </ListPageBoardCardBody>
      </ListPageBoardCardHeader>
    </ListPageBoardCard>
  )
}

export const LIBRARY_BOARD_GROUP_OPTIONS = [
  { key: "topic", label: "Topic" },
  { key: "difficulty", label: "Difficulty" },
  { key: "type", label: "Type" },
] as const

export function LibraryBoardView({
  rows,
  groupByColumnKey,
  onToggleFavorite,
  onRowActivate,
}: {
  rows: LibraryItem[]
  groupByColumnKey: string
  onToggleFavorite: (row: LibraryItem) => void
  onRowActivate?: (row: LibraryItem) => void
}) {
  const allowed = LIBRARY_BOARD_GROUP_OPTIONS.some(o => o.key === groupByColumnKey)
  const key = allowed ? groupByColumnKey : "topic"
  const { columns, badgeMap } = useLibraryBoardModel(rows, key)

  return (
    <ListPageBoardTemplate
      columns={columns}
      rows={rows}
      getRowKey={r => r.id}
      columnCountBadgeClassName={badgeMap}
      emptyColumnLabel="No questions"
      renderCard={row => (
        <LibraryBoardCard row={row} onToggleFavorite={onToggleFavorite} onRowActivate={onRowActivate} />
      )}
    />
  )
}
