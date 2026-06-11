"use client"

/**
 * useLeoThread — shared conversation state for the two Leo surfaces that
 * render a thread today:
 *
 *   1. `LeoLandingClient` — the focused `/<product>/leo` canvas. Empty
 *      state shows the hero composer; first send transitions the page
 *      into an inline conversation.
 *   2. `AskLeoSidebar` — the right-rail Sheet opened by ⌘⌥K and inline
 *      KPI/chart triggers. Ephemeral by design — recents are owned by
 *      the landing.
 *
 * The hook owns the message list, the mock streaming timeout, and the
 * scroll anchor. Today the assistant response is a stub
 * (`mockAssistantReply`); when a real model is wired the API call goes
 * here and both surfaces inherit it for free.
 */

import * as React from "react"

export type LeoThreadMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  /** Assistant-only: show thinking animation until the reply is applied. */
  pending?: boolean
}

const LEO_REPLY_DELAY_MS = 3500

function mockAssistantReply(userText: string): string {
  const trimmed = userText.length > 120 ? `${userText.slice(0, 120)}…` : userText
  return `Thanks — I received: "${trimmed}". Wire your assistant API here to return a real answer.`
}

export interface UseLeoThreadOptions {
  /**
   * Called every time the user submits a turn — typically used by the
   * landing surface to push the prompt onto the persisted recents list.
   * Stable identity required (memoize at the call site).
   */
  onUserTurn?: (prompt: string) => void
}

export interface UseLeoThread {
  messages: LeoThreadMessage[]
  isThinking: boolean
  /** Send a prompt — trims, no-ops on blank. Returns the user message row. */
  send: (prompt: string) => LeoThreadMessage | null
  /** Cancel in-flight reply timers and drop pending assistant rows. */
  stop: () => void
  /** Reset the thread + cancel any pending mock reply timers. */
  reset: () => void
  /** Imperative scroll anchor — attach to the scrollable conversation container. */
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export function useLeoThread(options: UseLeoThreadOptions = {}): UseLeoThread {
  const { onUserTurn } = options
  const [messages, setMessages] = React.useState<LeoThreadMessage[]>([])
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const pendingReplyTimeoutsRef = React.useRef<number[]>([])

  const clearPendingReplyTimeouts = React.useCallback(() => {
    pendingReplyTimeoutsRef.current.forEach(clearTimeout)
    pendingReplyTimeoutsRef.current = []
  }, [])

  const send = React.useCallback<UseLeoThread["send"]>(
    (prompt) => {
      const trimmed = prompt.trim()
      if (!trimmed) return null
      onUserTurn?.(trimmed)
      const userId = crypto.randomUUID()
      const asstId = crypto.randomUUID()
      const userRow: LeoThreadMessage = { id: userId, role: "user", content: trimmed }
      setMessages((prev) => [
        ...prev,
        userRow,
        { id: asstId, role: "assistant", content: "", pending: true },
      ])
      const tid = window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId && m.role === "assistant"
              ? { ...m, content: mockAssistantReply(trimmed), pending: false }
              : m,
          ),
        )
        pendingReplyTimeoutsRef.current = pendingReplyTimeoutsRef.current.filter(
          (t) => t !== tid,
        )
      }, LEO_REPLY_DELAY_MS)
      pendingReplyTimeoutsRef.current.push(tid)
      return userRow
    },
    [onUserTurn],
  )

  const stop = React.useCallback(() => {
    clearPendingReplyTimeouts()
    setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.pending)))
  }, [clearPendingReplyTimeouts])

  const reset = React.useCallback(() => {
    clearPendingReplyTimeouts()
    setMessages([])
  }, [clearPendingReplyTimeouts])

  // Auto-scroll on every message change (and on mount).
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [messages])

  // Cancel timers on unmount so a closed Sheet doesn't push state changes.
  React.useEffect(() => () => clearPendingReplyTimeouts(), [clearPendingReplyTimeouts])

  const isThinking = messages.some((m) => m.pending)

  return { messages, isThinking, send, stop, reset, scrollRef }
}
