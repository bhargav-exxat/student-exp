import type * as React from "react"

import { cn } from "@/lib/utils"

/** Visible label for primary / secondary sidebar rows — MUST NOT truncate. */
export function SidebarNavLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-sidebar-nav-label
      className={cn(
        "min-w-0 flex-1 leading-normal",
        "!overflow-visible !whitespace-normal [text-overflow:clip] break-words",
        className,
      )}
      {...props}
    />
  )
}
