"use client"

import * as React from "react"
import { rafThrottle } from "@/lib/raf-throttle"

type Listener = () => void

let listeners: Set<Listener> | null = null
let cachedValue = false
let mql: MediaQueryList | null = null
let scheduled: ReturnType<typeof rafThrottle> | null = null

function compute(): boolean {
  if (typeof window === "undefined") return false
  const vv = window.visualViewport
  const scale = vv?.scale ?? 1
  if (!mql) mql = window.matchMedia("(max-height: 640px)")
  const short = mql.matches
  const veryShort = window.innerHeight <= 420
  return scale >= 1.99 || short || veryShort
}

function ensureInitialized() {
  if (listeners) return
  listeners = new Set()
  if (typeof window === "undefined") return
  cachedValue = compute()
  scheduled = rafThrottle(() => {
    const next = compute()
    if (next === cachedValue) return
    cachedValue = next
    listeners?.forEach((cb) => cb())
  })
  const vv = window.visualViewport
  vv?.addEventListener("resize", scheduled, { passive: true })
  vv?.addEventListener("scroll", scheduled, { passive: true })
  window.addEventListener("resize", scheduled, { passive: true })
  mql?.addEventListener("change", scheduled)
}

function subscribe(callback: Listener): () => void {
  ensureInitialized()
  listeners!.add(callback)
  return () => {
    listeners!.delete(callback)
  }
}

function getSnapshot(): boolean {
  ensureInitialized()
  return cachedValue
}

function getServerSnapshot(): boolean {
  return false
}

export function useSidebarReflowZoom(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
