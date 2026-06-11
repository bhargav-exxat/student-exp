"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Two-column settings row: label + helper on the left, controls on the right.
 */
export function SettingsFormRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10 lg:items-start",
        "border-b border-border/70 pb-8 last:border-0 last:pb-0",
        className,
      )}
    >
      <div className="space-y-1 lg:pt-1 text-start">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground leading-snug text-start">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 space-y-2">{children}</div>
    </div>
  )
}
