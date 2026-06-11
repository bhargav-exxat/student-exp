"use client"

/**
 * Thin re-export wrapper so layout files don't need to change if we ever
 * adjust the sidebar loading strategy. Renders the sidebar with full SSR
 * (no dynamic lazy loading) so it's present on the initial paint and the
 * Radix ID mismatch is suppressed at the CollapsibleContent level instead.
 */
import type { ComponentProps } from "react"
import { AppSidebar } from "./app-sidebar"
import type { Sidebar } from "@/components/ui/sidebar"

export function AppSidebarDynamic(props: ComponentProps<typeof Sidebar>) {
  return <AppSidebar {...props} />
}
