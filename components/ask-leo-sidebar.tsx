"use client"

/**
 * AskLeoSidebar — app-wide right sidebar for the AI assistant.
 * Mirrors the left sidebar behavior: slides in/out with a toggle button.
 * Lives in the (app) layout so it persists across all pages.
 */

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useProduct } from "@/contexts/product-context"
import { productSlug } from "@/stores/app-store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage, AvatarLeoAssistant } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { StatusBadge } from "@/components/ui/status-badge"

// React.lazy + Suspense for the chart bundle.
// PR-6. Same call-site shape (`<LeoIcon />`) — Suspense boundary is internal.
const LeoIconLazy = React.lazy(() =>
  import("@/components/ui/leo-icon").then(m => ({ default: m.LeoIcon })),
)

function LeoIcon(props: React.ComponentProps<typeof LeoIconLazy>) {
  return (
    <React.Suspense
      fallback={<div className="size-20" aria-hidden="true" />}
    >
      <LeoIconLazy {...props} />
    </React.Suspense>
  )
}
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { ASK_LEO_GENERIC_SUGGESTIONS, getAskLeoRouteContext } from "@/lib/ask-leo-route-context"
import { isEditableTarget } from "@/lib/editable-target"
import { NAV_USER } from "@/lib/mock/navigation"
import { useLeoThread } from "@/lib/use-leo-thread"

// ─────────────────────────────────────────────────────────────────────────────
// Context — share open state with any page (e.g. "Ask Leo" buttons on cards)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page context that pages register with `useAskLeoPageContext` so Leo knows
 * what the user is currently looking at. Title is shown in the welcome
 * bubble; `suggestions` replace the generic prompt list when present; and
 * `data` is an opaque payload the downstream API call can echo back.
 */
export interface AskLeoPageContext {
  /** Human-readable page name, e.g. "Placements" or "Compliance dashboard". */
  title: string
  /** Optional one-line description ("42 active placements, 3 pending review"). */
  description?: string
  /** Page-specific starter prompts — replace the generic 4 when provided. */
  suggestions?: string[]
  /** Arbitrary payload handed to the assistant API at send time. */
  data?: Record<string, unknown>
}

interface AskLeoContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  /** Open the sidebar and prefill the composer (e.g. command palette AI suggestions). */
  openWithPrompt: (prompt: string) => void
  /** Internal — AskLeoSidebar consumes pending text when opening. */
  consumePendingComposerPrompt: () => string | null
  /** Current page context (or null if no page has registered one). */
  pageContext: AskLeoPageContext | null
  /** Register/replace the current page's context. */
  setPageContext: (ctx: AskLeoPageContext | null) => void
}

const AskLeoContext = React.createContext<AskLeoContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  openWithPrompt: () => {},
  consumePendingComposerPrompt: () => null,
  pageContext: null,
  setPageContext: () => {},
})

export function useAskLeo() {
  return React.useContext(AskLeoContext)
}

/**
 * Pages call this at the top of their client component to tell Leo what
 * surface the user is on. Unregisters on unmount (so route changes clear
 * stale context). Memoize `ctx` to avoid update loops — use `React.useMemo`.
 *
 * @example
 *   useAskLeoPageContext(React.useMemo(() => ({
 *     title: "Placements",
 *     description: `${rows.length} rows, ${filters.active} filters active`,
 *     suggestions: [
 *       "Summarize placements ending this month",
 *       "Which sites are at capacity?",
 *     ],
 *   }), [rows.length, filters.active]))
 */
export function useAskLeoPageContext(ctx: AskLeoPageContext | null) {
  const { setPageContext } = React.useContext(AskLeoContext)
  React.useEffect(() => {
    setPageContext(ctx)
    return () => setPageContext(null)
  }, [ctx, setPageContext])
}

export function AskLeoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [pageContext, setPageContext] = React.useState<AskLeoPageContext | null>(null)
  const toggle = React.useCallback(() => setOpen(v => !v), [])
  const pendingComposerPromptRef = React.useRef<string | null>(null)

  const openWithPrompt = React.useCallback((prompt: string) => {
    pendingComposerPromptRef.current = prompt
    setOpen(true)
  }, [])

  const consumePendingComposerPrompt = React.useCallback(() => {
    const p = pendingComposerPromptRef.current
    pendingComposerPromptRef.current = null
    return p
  }, [])

  const value = React.useMemo(
    () => ({ open, setOpen, toggle, openWithPrompt, consumePendingComposerPrompt, pageContext, setPageContext }),
    [open, toggle, openWithPrompt, consumePendingComposerPrompt, pageContext],
  )

  /** ⌘⌥K / Ctrl+Alt+K — avoids browser ⌘⇧N (incognito), ⌘⇧O (bookmarks), and Ctrl+Alt+L (lock on some Linux). */
  React.useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      if (!e.altKey || (!e.metaKey && !e.ctrlKey)) return
      if (e.key.toLowerCase() !== "k") return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      toggle()
    }
    document.addEventListener("keydown", onGlobalKeyDown)
    return () => document.removeEventListener("keydown", onGlobalKeyDown)
  }, [toggle])

  return (
    <AskLeoContext.Provider value={value}>
      {children}
    </AskLeoContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────────────────────────────────────

export function AskLeoSidebar() {
  const { open, setOpen, consumePendingComposerPrompt, pageContext } = useAskLeo()
  const { setOpen: setSidebarOpen, isMobile } = useSidebar()
  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`
  const isOnLeoLanding = useLocation().pathname === leoHref
  const [composerValue, setComposerValue] = React.useState("")
  const [composerExpanded, setComposerExpanded] = React.useState(false)
  const composerTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const {
    messages: threadMessages,
    isThinking,
    send,
    stop,
    reset,
    scrollRef: conversationScrollRef,
  } = useLeoThread()
  const pathname = useLocation().pathname
  const routeContext = React.useMemo(() => getAskLeoRouteContext(pathname), [pathname])

  const suggestions =
    pageContext?.suggestions && pageContext.suggestions.length > 0
      ? pageContext.suggestions
      : routeContext.suggestions ?? []

  const suggestionChips =
    suggestions.length > 0 ? suggestions : ASK_LEO_GENERIC_SUGGESTIONS

  const appendUserTurn = React.useCallback(
    (text: string) => {
      send(text)
    },
    [send],
  )

  React.useEffect(() => {
    if (!open) {
      reset()
      setComposerValue("")
      return
    }
    const pending = consumePendingComposerPrompt()
    if (pending !== null) {
      setComposerValue(pending)
      queueMicrotask(() => composerTextareaRef.current?.focus())
    } else {
      setComposerValue("")
    }
  }, [open, consumePendingComposerPrompt, reset])

  // Collapse main sidebar when Ask Leo opens, expand when it closes
  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpen.current) setSidebarOpen(false)
    if (!open && prevOpen.current) setSidebarOpen(true)
    prevOpen.current = open
  }, [open, setSidebarOpen])

  return (
    <>
      {/* Mobile/zoomed-in: tap-outside scrim — WCAG aria-hidden, closes on click */}
      {isMobile && open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    <aside
      aria-label="Ask Leo — AI assistant"
      data-ask-leo-panel
      data-state={open ? "open" : "closed"}
      // Cursor IDE browser preview injects `data-cursor-ref` here before
      // hydration — see commentary in NestedSecondaryPanelShell. Suppression
      // is scoped to this element's own attributes only.
      suppressHydrationWarning
      className={cn(
        "relative flex flex-col overflow-hidden",
        isMobile
          ? open
            // Mobile/zoomed: fixed floating panel on the right, same inset style as left sidebar
            ? "fixed z-50 right-2 top-2 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none rounded-2xl border border-border/60 shadow-2xl ring-1 ring-border/20"
            : "hidden"
          : cn(
              "transition-[width,margin,opacity] duration-200 ease-linear",
              open
                ? "relative w-64 md:w-80 shrink-0 self-start m-2 mx-2 min-h-0 h-[min(calc(100dvh-2rem),800px)] overflow-hidden rounded-xl border border-sidebar-border/80 shadow-[0_18px_48px_-16px_rgba(15,23,42,0.2),0_8px_20px_-10px_rgba(15,23,42,0.12)] ring-1 ring-sidebar-border dark:shadow-[0_22px_56px_-12px_rgba(0,0,0,0.5),0_10px_28px_-12px_rgba(0,0,0,0.35)] md:sticky md:top-2 md:ms-0 md:h-[calc(100dvh-1.25rem)]"
                : "h-0 min-h-0 shrink overflow-hidden border-0 p-0 m-0 min-w-0 w-0 max-w-0 opacity-0 pointer-events-none",
            )
      )}
      style={
        open
          ? {
              background: "var(--leo-surface-gradient)",
            }
          : undefined
      }
    >
      {/* min-w only when open — avoids flex min-width:auto stealing width / hit-testing when closed */}
      <div
        className={cn(
          "relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col",
          open ? "min-w-0" : "hidden min-w-0 w-0"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 shrink-0">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <i className="fa-duotone fa-solid fa-star-christmas text-brand shrink-0" aria-hidden="true" />
              <h2
                className="m-0 text-lg font-semibold tracking-tight leading-tight text-sidebar-foreground truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Ask Leo
              </h2>
              <StatusBadge status="beta" size="xs" className="shrink-0" />
            </div>
            <p className="text-[11px] leading-snug text-sidebar-foreground/60">
              Powered by AI · responses may vary
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Promote quick-ask → focused landing. Hidden when already on /leo. */}
            {!isOnLeoLanding && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={leoHref}
                    onClick={() => setOpen(false)}
                    className="icon-button-chrome inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="hidden sm:inline">Open in Leo</span>
                    <i className="fa-light fa-arrow-up-right-from-square text-[10px]" aria-hidden="true" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Open the focused Leo workspace
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="icon-button-chrome inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close Ask Leo"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="flex max-w-xs flex-wrap items-center gap-1.5 text-xs">
                <span>Close Ask Leo</span>
                <AskLeoShortcutKbds />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Conversation scrolls behind composer; composer is absolutely pinned to the bottom. */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={conversationScrollRef}
            className={cn(
              "absolute inset-0 scroll-smooth overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pt-4 pb-28 [-webkit-overflow-scrolling:touch]",
              threadMessages.length === 0 && "flex items-center justify-center",
            )}
            role="log"
            aria-label="Conversation with Leo"
            aria-live="polite"
          >
            <div
              className={cn(
                "flex w-full min-w-0 flex-col gap-4",
                threadMessages.length === 0 && "items-center",
              )}
            >
              {threadMessages.length === 0 ? (
                <>
                  <LeoIcon variant="interactive" size="xl" />
                  <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" aria-label="Suggested prompts">
                  {suggestionChips.map((q, i) => (
                    <li
                      key={`${i}-${q.slice(0, 24)}`}
                      className="max-w-full list-none"
                    >
                      <Badge
                        asChild
                        variant="outline"
                        className="h-auto min-h-8 max-w-full items-stretch whitespace-normal rounded-4xl border-border/90 bg-card p-0 font-normal text-card-foreground shadow-sm transition-transform duration-150 hover:-translate-y-0.5 dark:border-border dark:bg-card"
                      >
                        <button
                          type="button"
                          onClick={() => appendUserTurn(q)}
                          className="inline-flex min-h-8 w-full max-w-full cursor-pointer text-start text-xs leading-snug transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/40"
                        >
                          <span className="line-clamp-4 px-3 py-2">{q}</span>
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
                </>
              ) : (
                threadMessages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex w-full min-w-0 flex-row-reverse gap-3">
                      <Avatar size="sm" className="mt-0.5 shrink-0">
                        <AvatarImage src={NAV_USER.avatar} alt="" />
                        <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                          {NAV_USER.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Reserve avatar (~2rem) + gap-3 so max-w 100% does not include sibling width (overflow). */}
                      <div className="min-w-0 max-w-[min(18rem,calc(100%-3rem))] break-words rounded-lg rounded-tr-sm bg-primary px-3 py-2.5 text-start text-sm leading-relaxed text-primary-foreground shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex w-full min-w-0 gap-3">
                      <AvatarLeoAssistant className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 pt-0.5 text-start text-sm leading-relaxed text-sidebar-foreground">
                        {m.pending ? (
                          <p className="m-0 text-muted-foreground">Thinking…</p>
                        ) : (
                          <p className="m-0 break-words">{m.content}</p>
                        )}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-sidebar/90 px-3 pb-4 pt-10 sm:pb-5">
            <div className="pointer-events-auto">
              <AskLeoComposer
                ref={composerTextareaRef}
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={appendUserTurn}
                onExpandedChange={setComposerExpanded}
                isAnalyzing={isThinking}
                onStop={stop}
                placeholder="Ask Leo anything…"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle button — can be placed anywhere (e.g. in SiteHeader or floating)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Keyboard shortcut hint for Ask Leo (⌘⌥K / Ctrl+Alt+K).
 *
 * • `variant="tile"` (default) — three separate tile kbds, for use in tooltip
 *   content / standalone surfaces where the tile chrome is welcome.
 * • `variant="bare"` — single inline kbd with no background/border that
 *   inherits the parent's currentColor (see Kbd "bare" variant). Use this
 *   whenever the kbds are rendered INSIDE a button (e.g. primary Ask Leo
 *   button in a popover footer). Matches the `<Kbd variant="bare">` pattern
 *   used by the Next / Back buttons in the new placement flow.
 */
export function AskLeoShortcutKbds({
  className,
  variant = "tile",
}: {
  className?: string
  variant?: "tile" | "bare"
}) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  if (variant === "bare") {
    return (
      <KbdGroup className={className}>
        <Kbd variant="bare">{mod}{alt}K</Kbd>
      </KbdGroup>
    )
  }
  return (
    <KbdGroup className={className}>
      <Kbd>{mod}</Kbd>
      <Kbd>{alt}</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  )
}

export function AskLeoToggle({ className }: { className?: string }) {
  const { toggle, open } = useAskLeo()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          className={cn("gap-1.5 md:aspect-auto aspect-square", open && "bg-brand/10 border-brand/30 text-brand", className)}
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
          <span className="hidden md:inline">Ask Leo</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{open ? "Close Ask Leo" : "Ask Leo"}</span>
        <AskLeoShortcutKbds />
      </TooltipContent>
    </Tooltip>
  )
}
