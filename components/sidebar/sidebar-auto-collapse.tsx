"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/**
 * Collapses the sidebar on mount. Restores previous state on unmount.
 * Use on focused full-page forms / wizards so the sidebar collapses when
 * entering and reverts to whatever it was when leaving.
 *
 * Both transitions pass `{ persist: false }` so the visual collapse never
 * overwrites the user's saved sidebar preference (the `sidebar_state_v2`
 * cookie). Only an explicit toggle (⌘B / sidebar button) persists.
 */
export function SidebarAutoCollapse() {
  const { open, setOpen } = useSidebar()
  const prevOpen = useRef(open)

  useEffect(() => {
    prevOpen.current = open
    setOpen(false, { persist: false })
    return () => { setOpen(prevOpen.current, { persist: false }) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
