"use client"

import { useAppStore } from "@/stores/app-store"

/**
 * Brief full-viewport overlay while the active product (and theme class) flips
 * after a switcher click or URL-driven product adoption.
 */
export function ProductSwitchOverlay() {
  const switching = useAppStore(s => s.productSwitching)
  if (!switching) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      aria-label="Switching product"
    >
      <i
        className="fa-light fa-spinner-third fa-spin text-2xl text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">Switching product…</p>
    </div>
  )
}
