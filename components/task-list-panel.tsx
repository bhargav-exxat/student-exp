"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { TaskPriorityBadge } from "@/components/task-priority-badge"
import { DashboardSectionTitle } from "@/components/dashboard-section-heading"
import { cn } from "@/lib/utils"

export interface TaskListItem {
  id: number
  label: string
  due: string
  priority: "high" | "medium" | "low"
  done: boolean
}

export function TaskListPanel({
  title = "Tasks",
  headingId,
  headingLevel = "h2",
  plain = false,
  defaultTasks,
}: {
  title?: string
  headingId?: string
  headingLevel?: "h1" | "h2"
  plain?: boolean
  defaultTasks: TaskListItem[]
}) {
  const [tasks, setTasks] = React.useState<TaskListItem[]>(defaultTasks)
  const pending = tasks.filter((task) => !task.done).length

  const header = (
    <div className="flex items-center justify-between gap-2">
      <DashboardSectionTitle as={headingLevel} id={headingId}>
        {title}
      </DashboardSectionTitle>
      <Badge variant="outline" className="text-xs tabular-nums">
        {pending} pending
      </Badge>
    </div>
  )

  const rows = tasks.map((task) => {
    const taskDomId = `task-${task.id}`
    return (
      <div
        key={task.id}
        className={cn(
          "flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-interactive-hover-medium",
          task.done && "opacity-80",
        )}
      >
        <Checkbox
          id={taskDomId}
          checked={task.done}
          onCheckedChange={(checked) =>
            setTasks((prev) =>
              prev.map((current) =>
                current.id === task.id ? { ...current, done: checked === true } : current,
              ),
            )
          }
          className="mt-0.5"
          aria-label={`${task.done ? "Mark incomplete" : "Mark complete"}: ${task.label}`}
        />
        <Label htmlFor={taskDomId} className="min-w-0 flex-1 cursor-pointer flex-col items-stretch gap-0.5 font-normal">
          <span className={cn("text-xs font-medium leading-snug text-foreground", task.done && "text-muted-foreground line-through")}>
            {task.label}
          </span>
          <span className="text-xs text-muted-foreground">{task.due}</span>
        </Label>
        <div className="shrink-0 pt-0.5">
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>
    )
  })

  if (plain) {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        {header}
        <div className="flex flex-col gap-0.5">{rows}</div>
      </section>
    )
  }

  return (
    <Card size="sm">
      <CardHeader>{header}</CardHeader>
      <CardContent className="flex flex-col gap-0.5">{rows}</CardContent>
    </Card>
  )
}
