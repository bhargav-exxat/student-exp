"use client"

/**
 * SecondaryPanel — nested rail between the primary icon sidebar and content.
 * Full width shows hub scope nav; **compact** matches the primary sidebar icon rail (`w-12`).
 *
 * Chrome uses {@link NestedSecondaryPanelShell}. Library body stays in
 * `library-secondary-nav.tsx` (domain-specific), not duplicated here.
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { useRegisterNavFlyoutToggle, useSidebar } from "@/components/ui/sidebar"
import { Tip } from "@/components/ui/tip"
import { Button } from "@/components/ui/button"
import { LibrarySecondaryNav } from "@/components/library-secondary-nav"
import { NestedSecondaryPanelShell } from "@/components/templates/nested-secondary-panel-shell"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import {
  isLibrarySecondaryPanelRoute,
  shouldLibrarySecondaryPanelBeOpen,
} from "@/lib/library-nav"
import type { LibraryItem } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"

export type LibraryFolderBridge = {
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
  items: LibraryItem[]
  onItemsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
}

export type LibraryAccessBridge = {
  openManageAccess: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export type ClosePanelOptions = {
  /**
   * Main app sidebar after the secondary panel closes.
   * - `restore` (default): snap back to the user's saved preference
   *   (`sidebar_state_v2` cookie, or `defaultOpen` if unset). Use this when
   *   leaving a page whose secondary panel caused an incidental collapse — the
   *   rail returns to the state the user explicitly set elsewhere via ⌘B / the
   *   sidebar button.
   * - `leave`: only clear the active panel — keep the rail in whatever state it
   *   was in (rare; prefer `restore`).
   * - `expand`: force the full primary rail open. Use only when the product
   *   explicitly wants the wide rail after dismiss.
   * - `collapse`: keep the icon rail. Use when the next route also wants compact.
   */
  mainSidebar?: "restore" | "expand" | "collapse" | "leave"
}

interface SecondaryPanelContextValue {
  /** Currently active panel id, or null if none */
  activePanel: string | null
  /** Open a panel by id (always exits compact / full-width). */
  openPanel: (id: string) => void
  /** Close the panel (programmatic / route cleanup). */
  closePanel: (opts?: ClosePanelOptions) => void
  /** Icon-only nested rail while the panel stays “open”. Cleared by {@link openPanel} / {@link closePanel}. */
  secondaryPanelCompact: boolean
  /** Narrow icon rail (primary-sidebar-style); keeps {@link activePanel} mounted. */
  collapseActiveSecondaryPanel: () => void
  /** Library folder tree shared with the secondary nav while the hub is mounted. */
  libraryFolderBridge: LibraryFolderBridge | null
  setLibraryFolderBridge: (bridge: LibraryFolderBridge | null) => void
  /** Opens the hub collaborators sheet from the secondary nav. */
  libraryAccessBridge: LibraryAccessBridge | null
  setLibraryAccessBridge: (bridge: LibraryAccessBridge | null) => void
  /**
   * Flyout stack (mobile / ≥200% zoom): temporarily hide the secondary overlay
   * so the primary sidebar underneath is reachable. Cleared by {@link openPanel}.
   */
  secondaryFlyoutHidden: boolean
  hideSecondaryFlyout: () => void
  showSecondaryFlyout: () => void
  /** Flyout sheet visible (mobile / high zoom). False when user closed the sheet but stayed on the hub. */
  secondaryFlyoutVisible: boolean
  /** Hide the scope sheet only — keeps {@link activePanel} for `/library/all`. */
  closeSecondaryFlyout: () => void
}

const SecondaryPanelContext = React.createContext<SecondaryPanelContextValue>({
  activePanel: null,
  openPanel: () => {},
  closePanel: () => {},
  secondaryPanelCompact: false,
  collapseActiveSecondaryPanel: () => {},
  libraryFolderBridge: null,
  setLibraryFolderBridge: () => {},
  libraryAccessBridge: null,
  setLibraryAccessBridge: () => {},
  secondaryFlyoutHidden: false,
  hideSecondaryFlyout: () => {},
  showSecondaryFlyout: () => {},
  secondaryFlyoutVisible: true,
  closeSecondaryFlyout: () => {},
})

export function useSecondaryPanel() {
  return React.useContext(SecondaryPanelContext)
}

export function SecondaryPanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = React.useState<string | null>(null)
  const [secondaryPanelCompact, setSecondaryPanelCompact] = React.useState(false)
  const [libraryFolderBridge, setLibraryFolderBridge] =
    React.useState<LibraryFolderBridge | null>(null)
  const [libraryAccessBridge, setLibraryAccessBridge] =
    React.useState<LibraryAccessBridge | null>(null)
  const [secondaryFlyoutHidden, setSecondaryFlyoutHidden] = React.useState(false)
  const [secondaryFlyoutVisible, setSecondaryFlyoutVisible] = React.useState(true)
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const librarySecondaryPanelRoute = isLibrarySecondaryPanelRoute(pathname)
  const { setOpen, restoreSavedOpen, open: mainSidebarOpen } = useSidebar()

  /**
   * Browser zoom ≥ 200% (or very short viewport) — same `useSidebarReflowZoom`
   * signal the primary sidebar uses (WCAG 1.4.10). At that scale the nested
   * rail must **not** stay pinned as an icon strip beside content. Hide it
   * until the user opens Back / Main menu (one flyout layer at a time).
   */
  const wasReflowZoomRef = React.useRef(false)
  React.useEffect(() => {
    if (reflowZoom && !wasReflowZoomRef.current && activePanel) {
      setOpen(false, { persist: false })
    }
    wasReflowZoomRef.current = reflowZoom
  }, [reflowZoom, activePanel, setOpen])

  /** Icon-only compact rail is desktop-only — flyout sheets always show labels. */
  React.useEffect(() => {
    if (navFlyout && secondaryPanelCompact) {
      setSecondaryPanelCompact(false)
    }
  }, [navFlyout, secondaryPanelCompact])

  const hideSecondaryFlyout = React.useCallback(() => {
    setSecondaryFlyoutHidden(true)
    setOpen(true, { persist: false })
  }, [setOpen])

  const showSecondaryFlyout = React.useCallback(() => {
    setSecondaryFlyoutHidden(false)
    setSecondaryPanelCompact(false)
    setOpen(false, { persist: false })
  }, [setOpen])

  /** Scope sheet visible → keep primary flyout closed (not stacked). */
  React.useEffect(() => {
    if (!navFlyout || !activePanel || secondaryFlyoutHidden || !secondaryFlyoutVisible) {
      return
    }
    setOpen(false, { persist: false })
  }, [navFlyout, activePanel, secondaryFlyoutHidden, secondaryFlyoutVisible, setOpen])

  const closeSecondaryFlyout = React.useCallback(() => {
    setSecondaryPanelCompact(false)
    setSecondaryFlyoutHidden(false)
    setSecondaryFlyoutVisible(false)
    setOpen(false, { persist: false })
  }, [setOpen])

  const openPanel = React.useCallback(
    (id: string) => {
      setSecondaryPanelCompact(false)
      setSecondaryFlyoutHidden(false)
      setSecondaryFlyoutVisible(true)
      setActivePanel(id)
      setOpen(false, { persist: false })
    },
    [setOpen],
  )

  const closePanel = React.useCallback((opts?: ClosePanelOptions) => {
    setSecondaryPanelCompact(false)
    setSecondaryFlyoutHidden(false)
    setSecondaryFlyoutVisible(true)
    setActivePanel(null)
    const mainSidebar = opts?.mainSidebar ?? "restore"
    if (mainSidebar === "leave") return
    if (mainSidebar === "restore") {
      restoreSavedOpen()
      return
    }
    if (mainSidebar === "collapse") {
      setOpen(false, { persist: false })
      return
    }
    setOpen(true, { persist: false })
  }, [restoreSavedOpen, setOpen])

  /** URL is source of truth for the library scope rail (avoids empty shell / stuck panel races). */
  React.useEffect(() => {
    if (shouldLibrarySecondaryPanelBeOpen(pathname)) {
      if (activePanel !== "library") {
        openPanel("library")
      }
      return
    }
    if (activePanel === "library") {
      closePanel({ mainSidebar: "leave" })
    }
  }, [pathname, activePanel, openPanel, closePanel])

  const handleSecondaryNavFlyoutToggle = React.useCallback((): boolean => {
    if (!navFlyout) return false

    if (librarySecondaryPanelRoute && activePanel !== "library") {
      openPanel("library")
      return true
    }

    if (activePanel !== "library") return false

    if (secondaryFlyoutHidden) {
      if (mainSidebarOpen) {
        setOpen(false, { persist: false })
      } else {
        showSecondaryFlyout()
      }
      return true
    }

    if (secondaryFlyoutVisible) {
      closeSecondaryFlyout()
    } else {
      setSecondaryPanelCompact(false)
      setSecondaryFlyoutVisible(true)
      setOpen(false, { persist: false })
    }
    return true
  }, [
    navFlyout,
    librarySecondaryPanelRoute,
    activePanel,
    secondaryFlyoutHidden,
    secondaryFlyoutVisible,
    mainSidebarOpen,
    showSecondaryFlyout,
    closeSecondaryFlyout,
    openPanel,
    setOpen,
  ])

  useRegisterNavFlyoutToggle(handleSecondaryNavFlyoutToggle)

  const collapseActiveSecondaryPanel = React.useCallback(() => {
    setSecondaryPanelCompact(true)
  }, [])

  const value = React.useMemo(
    () => ({
      activePanel,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge,
      setLibraryFolderBridge,
      libraryAccessBridge,
      setLibraryAccessBridge,
      secondaryFlyoutHidden,
      hideSecondaryFlyout,
      showSecondaryFlyout,
      secondaryFlyoutVisible,
      closeSecondaryFlyout,
    }),
    [
      activePanel,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge,
      libraryAccessBridge,
      secondaryFlyoutHidden,
      hideSecondaryFlyout,
      showSecondaryFlyout,
      secondaryFlyoutVisible,
      closeSecondaryFlyout,
    ],
  )

  return (
    <SecondaryPanelContext.Provider value={value}>
      {children}
    </SecondaryPanelContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryPanel — the actual rendered panel
// ─────────────────────────────────────────────────────────────────────────────

function SecondaryPanelFlyoutHeader({
  title,
  flyout,
}: {
  title: string
  flyout: boolean
}) {
  const { collapseActiveSecondaryPanel, closeSecondaryFlyout, hideSecondaryFlyout } =
    useSecondaryPanel()

  return (
    <div className="flex flex-col gap-1 px-2 pt-2 pb-2">
      {flyout ? (
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-full justify-start gap-2 px-2 text-sidebar-foreground"
          onClick={hideSecondaryFlyout}
          aria-label="Main menu"
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">Main menu</span>
        </Button>
      ) : null}
      <div className="flex items-center justify-between gap-2 px-2">
        <h2
          className="text-xl font-semibold leading-tight text-sidebar-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        {flyout ? (
          <Tip label="Close navigation" side="bottom">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => closeSecondaryFlyout()}
              aria-label="Close navigation"
            >
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </Tip>
        ) : (
          <Tip label="Collapse to icons" side="bottom">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => collapseActiveSecondaryPanel()}
              aria-label="Collapse to icons"
            >
              <i className="fa-light fa-angles-left" aria-hidden="true" />
            </Button>
          </Tip>
        )}
      </div>
    </div>
  )
}

function LibraryPanel() {
  const { secondaryPanelCompact } = useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const showCompactRail = secondaryPanelCompact && !navFlyout

  if (showCompactRail) {
    return <LibrarySecondaryNav />
  }

  return (
    <>
      <SecondaryPanelFlyoutHeader title="Library" flyout={navFlyout} />
      <LibrarySecondaryNav />
    </>
  )
}

/** Register panel components by id when a route opts into `secondaryPanel` in nav. */
const PANELS: Record<string, React.FC> = {
  "library": LibraryPanel,
}

export function SecondaryPanel() {
  const { pathname } = useLocation()
  const {
    activePanel,
    secondaryPanelCompact,
    secondaryFlyoutHidden,
    secondaryFlyoutVisible,
    closeSecondaryFlyout,
  } = useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  /** Render from the route when on a scoped library hub even if `activePanel` lags (Strict Mode / nav races). */
  const panelId = shouldLibrarySecondaryPanelBeOpen(pathname)
    ? "library"
    : activePanel
  const PanelContent = panelId ? PANELS[panelId] : null

  const navFlyout = (isMobile || reflowZoom) && Boolean(panelId)
  const showScopeFlyout =
    navFlyout && secondaryFlyoutVisible && !secondaryFlyoutHidden

  if (navFlyout && !showScopeFlyout) {
    return null
  }

  const shellOpen = Boolean(panelId) && (!navFlyout || secondaryFlyoutVisible)
  const overlay: false | "mobile" | "desktop" = navFlyout
    ? isMobile
      ? "mobile"
      : "desktop"
    : false
  const compact = overlay ? false : secondaryPanelCompact

  return (
    <>
      {showScopeFlyout ? (
        <Shortcut keys="Escape" onInvoke={closeSecondaryFlyout} />
      ) : null}
      <NestedSecondaryPanelShell
        open={shellOpen}
        compact={compact}
        overlay={overlay}
      >
        {PanelContent ? <PanelContent /> : null}
      </NestedSecondaryPanelShell>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-open hook — pages call this to show/hide a panel on mount/unmount
// ─────────────────────────────────────────────────────────────────────────────

export function useAutoPanel(panelId: string) {
  const { openPanel, closePanel } = useSecondaryPanel()

  React.useEffect(() => {
    openPanel(panelId)
    return () => {
      closePanel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId])
}

/** Sync hub folder state into the library secondary nav while the route is mounted. */
export function LibraryFolderBridge({
  folders,
  onFoldersChange,
  items,
  onItemsChange,
}: LibraryFolderBridge) {
  const { setLibraryFolderBridge } = useSecondaryPanel()

  React.useEffect(() => {
    setLibraryFolderBridge({ folders, onFoldersChange, items, onItemsChange })
    return () => setLibraryFolderBridge(null)
  }, [folders, onFoldersChange, items, onItemsChange, setLibraryFolderBridge])

  return null
}

export function LibraryAccessBridge({ openManageAccess }: LibraryAccessBridge) {
  const { setLibraryAccessBridge } = useSecondaryPanel()

  React.useEffect(() => {
    setLibraryAccessBridge({ openManageAccess })
    return () => setLibraryAccessBridge(null)
  }, [openManageAccess, setLibraryAccessBridge])

  return null
}
