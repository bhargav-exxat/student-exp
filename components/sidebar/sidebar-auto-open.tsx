"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/** Reopens the sidebar once on mount — pair with `SidebarAutoCollapse` on focused
 *  full-page forms / wizards so leaving the form restores the sidebar. */
export function SidebarAutoOpen() {
  const { setOpen } = useSidebar()
  const ran = useRef(false)
  useEffect(() => {
    if (!ran.current) {
      ran.current = true
      setOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
