"use client"

import * as React from "react"

import { isChunkLoadError } from "@/lib/chunk-load-error"

const RELOAD_FLAG = "exxat-ds:chunk-reload-attempted"

/**
 * Dev-only: auto-reload once when the dev server (Vite, Turbopack, webpack)
 * serves a stale module / chunk so users are not stuck on a blank shell
 * before the route error boundary mounts.
 */
export function DevChunkLoadRecovery() {
  React.useEffect(() => {
    if (!import.meta.env.DEV) return

    function maybeReload(error: unknown) {
      if (!isChunkLoadError(error)) return
      if (typeof window === "undefined") return
      if (window.sessionStorage.getItem(RELOAD_FLAG) === "1") return
      window.sessionStorage.setItem(RELOAD_FLAG, "1")
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      maybeReload(event.error ?? event.message)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      maybeReload(event.reason)
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
