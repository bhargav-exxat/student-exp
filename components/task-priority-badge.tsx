"use client"

import { Badge } from "@/components/ui/badge"
import {
  normalizeTaskPriority,
  TASK_PRIORITY_BADGE_CLASS,
  TASK_PRIORITY_LABEL,
} from "@/lib/list-status-badges"
import { cn } from "@/lib/utils"

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const level = normalizeTaskPriority(priority)
  if (!level) {
    return (
      <Badge variant="outline" className="capitalize text-xs">
        {priority}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", TASK_PRIORITY_BADGE_CLASS[level])}
    >
      {TASK_PRIORITY_LABEL[level]}
    </Badge>
  )
}
