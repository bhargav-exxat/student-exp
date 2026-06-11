"use client"

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { OsFolderGlyph } from "@/components/data-views/os-folder-glyph"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { LibraryHubCreateTileButton } from "@/components/library-hub-create-tile-button"
import { useAskLeo, useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import {
  DEFAULT_LIBRARY_FOLDERS,
  type LibraryFolder,
  type LibraryFolderColorKey,
} from "@/lib/mock/library-folders"
import { LIBRARY_ITEMS, type LibraryItem } from "@/lib/mock/library"
import { LIBRARY_HUB_ASK_LEO_PROMPTS } from "@/lib/library-hub-search"
import {
  LIBRARY_ALL_PATH,
  LIBRARY_NAV_MY_AUTHOR,
  currentLibraryBasePath,
  libraryNavHref,
  libraryRouteHref,
} from "@/lib/library-nav"
import { libraryDedicatedSearchRecents, recordLibraryRecentSearch } from "@/lib/library-recent-searches"
import { LIBRARY_DRAFT_WITH_AI_PROMPT } from "@/lib/library-authoring"
import { cn } from "@/lib/utils"

const NEW_QUESTION_AUTHORING_PATH = "/library/new"

const TEMPLATE_PROMPT =
  "Walk me through choosing an item template (single choice, multi-select, short answer, true / false) and produce a starter item with name, options, notes, and tags."

const IMPORT_PROMPT =
  "Guide me through importing assessment questions in bulk. Ask about source format (CSV, QTI, copy/paste), then outline what columns and mappings I need."

/** Rotating example queries — read like something a user would actually type into search. */
const HUB_COMPOSER_PLACEHOLDERS = [
  "items tagged with Tag 1 and Manual Therapy",
  "everything Owner A edited this month",
  "PT 520 items tagged Gait & Posture",
  "find LIB-2026-001 and anything like it",
  "drafts from the most recent reference set",
  "Type 1 items I still need for the demo block",
] as const

interface ScopeChip {
  id: string
  label: string
  href: string
  count: number
  folderGlyph: {
    colorKey: LibraryFolderColorKey
    icon: string
    variant?: "solid" | "outline"
  }
}

interface CreateTile {
  id: string
  label: string
  description: string
  icon: string
  iconTint: string
  onClick: () => void
  badge?: "AI" | null
  shortcutKeys?: string
}

interface FolderTile extends LibraryFolder {
  count: number
}

function buildScopeChips(items: LibraryItem[], libraryBasePath: string): ScopeChip[] {
  const mine = items.filter(
    i => i.author === LIBRARY_NAV_MY_AUTHOR || i.createdBy === LIBRARY_NAV_MY_AUTHOR,
  ).length
  return [
    {
      id: "all",
      label: "All",
      count: items.length,
      href: libraryRouteHref(LIBRARY_ALL_PATH, libraryBasePath),
      folderGlyph: { colorKey: "muted", icon: "fa-layer-group", variant: "outline" },
    },
    {
      id: "my",
      label: "Mine",
      count: mine,
      href: libraryNavHref({ scope: "my", basePath: libraryBasePath }),
      folderGlyph: { colorKey: "brand", icon: "fa-user" },
    },
  ]
}

function buildFolderTiles(items: LibraryItem[], folders: LibraryFolder[]): FolderTile[] {
  const byFolder = new Map<string, number>()
  for (const i of items) byFolder.set(i.folderId, (byFolder.get(i.folderId) ?? 0) + 1)
  return folders
    .filter(f => f.parentId === null)
    .map(f => ({ ...f, count: byFolder.get(f.id) ?? 0 }))
}

// Static derivations of immutable mock data — computed once at module load,
// not per render of the hub. Re-derive only if the underlying mock arrays change.
const HUB_FOLDER_TILES = buildFolderTiles(LIBRARY_ITEMS, DEFAULT_LIBRARY_FOLDERS)

function isMineLibraryItem(i: LibraryItem): boolean {
  return i.author === LIBRARY_NAV_MY_AUTHOR || i.createdBy === LIBRARY_NAV_MY_AUTHOR
}

const HUB_MINE_RECENTS = [...LIBRARY_ITEMS]
  .filter(isMineLibraryItem)
  .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  .slice(0, 3)

const HUB_ASK_LEO_PAGE_CONTEXT = {
  title: "Question hub",
  description:
    "Browse and organize assessment items with AI-assisted workflows. The hub search field opens discovery results on `/library/find` with your wording applied to the list; use the library’s Search in the sidebar for `/library/list`. Pick a suggestion below when you want a full Ask Leo thread.",
  suggestions: [...LIBRARY_HUB_ASK_LEO_PROMPTS],
  data: { surface: "library-discovery-hub" as const },
}

function formatRelativeDate(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const diffDays = Math.round((now - t) / 86_400_000)
  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.round(diffDays / 30)}mo ago`
  return `${Math.round(diffDays / 365)}y ago`
}

export function LibraryHubClient() {
  const dashboardHref = useProductDashboardHref()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const libraryBasePath = currentLibraryBasePath(pathname)
  const { openWithPrompt } = useAskLeo()
  const { setOpen: setMainSidebarOpen } = useSidebar()
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  const [hubComposerValue, setHubComposerValue] = React.useState("")

  const scopes = React.useMemo(
    () => buildScopeChips(LIBRARY_ITEMS, libraryBasePath),
    [libraryBasePath],
  )
  const folderTiles = HUB_FOLDER_TILES
  const recents = HUB_MINE_RECENTS

  useAskLeoPageContext(HUB_ASK_LEO_PAGE_CONTEXT)

  const sendLeoSuggestion = React.useCallback(
    (prompt: string) => {
      openWithPrompt(prompt)
    },
    [openWithPrompt],
  )

  /**
   * Navigate to the full-page authoring composer (`/library/new`).
   * Mirrors the Placements "New placement" pre-collapse: animates the sidebar
   * closed first so the user sees one smooth transition into the focused flow
   * (the route also mounts `SidebarAutoCollapse` to lock it shut while there).
   */
  const openCreateQuestion = React.useCallback(() => {
    setMainSidebarOpen(false)
    window.setTimeout(() => navigate(libraryRouteHref(NEW_QUESTION_AUTHORING_PATH, libraryBasePath)), 260)
  }, [libraryBasePath, navigate, setMainSidebarOpen])

  const openDraftWithLeo = React.useCallback(() => {
    openWithPrompt(LIBRARY_DRAFT_WITH_AI_PROMPT)
  }, [openWithPrompt])

  const onHubComposerSubmit = React.useCallback(
    (message: string) => {
      const trimmed = message.trim()
      if (trimmed) recordLibraryRecentSearch(trimmed)
      navigate(libraryNavHref({ scope: "all", q: trimmed, hubFind: true, basePath: libraryBasePath }))
    },
    [libraryBasePath, navigate],
  )

  const onHubRecentSelect = React.useCallback(
    (query: string) => {
      setHubComposerValue(query)
      onHubComposerSubmit(query)
    },
    [onHubComposerSubmit],
  )

  const createShortcut = `${mod}${alt}N`

  const hubFolderBrowserTileClass = cn(
    "flex w-full flex-col items-center gap-2 rounded-xl border border-transparent p-3 text-center transition-colors",
    "hover:border-border/80 hover:bg-muted/35",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  )

  const createTiles = React.useMemo<CreateTile[]>(
    () => [
      {
        id: "scratch",
        label: "Start from scratch",
        description: "Start with an empty editor and build the item by hand.",
        icon: "fa-plus",
        iconTint: "bg-brand/15 text-brand",
        onClick: openCreateQuestion,
        shortcutKeys: createShortcut,
      },
      {
        id: "ask-leo",
        label: "Draft with Leo",
        description: "Describe the outcome and let Leo propose stem, options, and rationale.",
        icon: "fa-star-christmas",
        iconTint: "bg-brand/15 text-brand",
        badge: "AI",
        onClick: openDraftWithLeo,
      },
      {
        id: "template",
        label: "From template",
        description: "Pick choice-style, multi-select, short answer or true / false — Leo fills the scaffold.",
        icon: "fa-clone",
        iconTint: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        onClick: () => sendLeoSuggestion(TEMPLATE_PROMPT),
      },
      {
        id: "import",
        label: "Import",
        description: "Bring in CSV, QTI, or paste from another tool — Leo will map the columns.",
        icon: "fa-file-import",
        iconTint: "bg-muted text-muted-foreground",
        onClick: () => sendLeoSuggestion(IMPORT_PROMPT),
      },
    ],
    [openCreateQuestion, openDraftWithLeo, sendLeoSuggestion, createShortcut],
  )

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Question hub",
      }}
      maxWidthClassName="max-w-none"
      contentClassName="px-4 py-8 md:px-6 md:py-10"
    >
      <Shortcut keys={createShortcut} onInvoke={openCreateQuestion} />
      {/* ⌘⌥K (Ask Leo toggle) is bound globally in AskLeoProvider — do not double-bind here. */}

      <div className="flex min-h-0 flex-1 flex-col gap-10">
        <header className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            Question hub
          </h1>
        </header>

        <section
          aria-label="Search and create questions"
          className="-mx-4 overflow-hidden px-4 py-6 md:-mx-6 md:px-6"
          style={{
            background: "var(--key-metrics-flat-band-radial)",
            boxShadow: "var(--key-metrics-flat-band-shadow)",
          }}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 md:px-6">
            <div className="min-w-0">
              <p className="sr-only">
                Example searches rotate in the field. Type your own request in plain language, then press Enter to open
                the library with that AI search applied to the question list. This control does not open Ask Leo.
              </p>
              <AskLeoComposer
                value={hubComposerValue}
                onChange={setHubComposerValue}
                onSubmit={onHubComposerSubmit}
                animatedPlaceholders={[...HUB_COMPOSER_PLACEHOLDERS]}
                animatedPlaceholderIntervalMs={4800}
                animatedPlaceholderMaxLines={2}
                leadingSlot="ai-mark"
                inputLabel="AI search"
                submitAppearance="search"
                submitButtonAriaLabel="Run AI search"
                placeholder="Search the bank…"
                searchRecents={{
                  recents: libraryDedicatedSearchRecents,
                  onSelect: onHubRecentSelect,
                }}
              />
            </div>

            {/* Create a question */}
            <section aria-labelledby="qb-create" className="space-y-3">
              <h2 id="qb-create" className="text-base font-semibold tracking-tight text-foreground">
                Create a question
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {createTiles.map(tile => (
                  <LibraryHubCreateTileButton
                    key={tile.id}
                    label={tile.label}
                    icon={tile.icon}
                    badge={tile.badge ?? null}
                    onClick={tile.onClick}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>

        {recents.length > 0 && (
          <section aria-labelledby="qb-recent" className="mx-auto w-full max-w-5xl space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="qb-recent" className="text-base font-semibold tracking-tight text-foreground">
                Continue where you left off
              </h2>
              <Link
                to={libraryNavHref({ scope: "my", basePath: libraryBasePath })}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <i className="fa-light fa-arrow-right ms-1.5 text-xs" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-3 md:grid-cols-3">
              {recents.map(item => (
                <li key={item.id}>
                  <Link
                    to={libraryNavHref({ scope: "my", basePath: libraryBasePath })}
                    className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-interactive-hover hover:bg-interactive-hover/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-xs text-muted-foreground">{item.questionId}</span>
                      <span className="truncate text-xs text-muted-foreground">{item.topic}</span>
                    </div>
                    <p className="line-clamp-3 text-sm font-medium text-foreground group-hover:text-foreground">
                      {item.stem}
                    </p>
                    <div className="mt-auto flex justify-end text-xs text-muted-foreground">
                      <span className="shrink-0">{formatRelativeDate(item.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="qb-browse" className="mx-auto w-full max-w-5xl space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="qb-browse" className="text-base font-semibold tracking-tight text-foreground">
              Browse the library
            </h2>
            <Link
              to={libraryRouteHref(LIBRARY_ALL_PATH, libraryBasePath)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open full library
              <i className="fa-light fa-arrow-right ms-1.5 text-xs" aria-hidden="true" />
            </Link>
          </div>

          <div
            className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            role="list"
            aria-label="Library scopes and top folders"
          >
            {scopes.map(s => (
              <div key={s.id} role="listitem" className="min-w-0">
                <Link
                  to={s.href}
                  className={hubFolderBrowserTileClass}
                >
                  <OsFolderGlyph
                    colorKey={s.folderGlyph.colorKey}
                    icon={s.folderGlyph.icon}
                    size="md"
                    variant={s.folderGlyph.variant ?? "solid"}
                  />
                  <span className="line-clamp-2 w-full text-xs font-medium text-foreground">{s.label}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground tabular-nums">
                    {s.count} {s.count === 1 ? "question" : "questions"}
                  </span>
                </Link>
              </div>
            ))}
            {folderTiles.map(f => (
              <div key={f.id} role="listitem" className="min-w-0">
                <Link
                  to={libraryNavHref({ scope: "folder", folderId: f.id, basePath: libraryBasePath })}
                  className={hubFolderBrowserTileClass}
                >
                  <OsFolderGlyph colorKey={f.colorKey} icon={f.icon} size="md" />
                  <span className="line-clamp-2 w-full text-xs font-medium text-foreground">{f.name}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground tabular-nums">
                    {f.count} {f.count === 1 ? "question" : "questions"}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>

      </div>
    </PrimaryPageTemplate>
  )
}
