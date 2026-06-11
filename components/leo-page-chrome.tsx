"use client"

/**
 * Floating sidebar toggle for the Leo canvas — no header bar, no layout shift.
 * Overlays the canvas; only the icon button is interactive.
 */

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"

export function LeoSidebarToggle() {
  const mod = useModKeyLabel()

  return (
    <div className="pointer-events-none absolute start-0 top-0 z-50 p-3 lg:p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="pointer-events-auto bg-transparent shadow-none hover:bg-sidebar-accent/60" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
          <span>Toggle sidebar</span>
          <KbdGroup>
            <Kbd>{mod}</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
