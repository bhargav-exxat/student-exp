"use client"

import * as React from "react"

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function getHashSnapshot() {
  return window.location.hash
}

function getServerHashSnapshot() {
  return ""
}

/** Current `window.location.hash` (including `#`), updated on `hashchange`. */
export function useLocationHash(): string {
  return React.useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot)
}
