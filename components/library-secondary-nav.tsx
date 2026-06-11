"use client"

/**
 * Library secondary sidebar — All / My / folder tree (Font Awesome only).
 * Scope syncs to the main hub via `?scope=` + optional `folderId=` (`lib/library-nav.ts`).
 */

import * as React from "react"
import { Link } from "react-router-dom"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tip } from "@/components/ui/tip"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { DEFAULT_LIBRARY_FOLDERS, newFolderId, collectFolderDescendantIds } from "@/lib/mock/library-folders"
import { useSecondaryPanel } from "@/components/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import {
  isLibraryNavActive,
  parseLibraryNav,
  coerceLibraryNav,
  libraryNavStatesEqual,
  LIBRARY_FAVORITES_FOLDER_ID,
  libraryFavoritesFolderHref,
  libraryHubScopeHref,
} from "@/lib/library-nav"
import { LibraryFolderTreeBranch } from "@/components/data-views/library-folder-tree-branch"
import { outlineTreeBranchDepthStyle } from "@/components/data-views/outline-tree-menu"

function NavRow({
  href,
  active,
  iconClass,
  label,
  onClick,
}: {
  href: string
  active: boolean
  iconClass: string
  label: string
  /** e.g. reopen secondary panel on same-route “All questions” */
  onClick?: () => void
}) {
  const { dismissNavFlyout } = useSidebar()
  return (
    <li className="min-w-0">
      <Tip label={label} side="right">
        <Link
          to={href}
          onClick={() => {
            onClick?.()
            dismissNavFlyout()
          }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex w-full min-w-0 min-h-8 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
            <i
              className={cn(
                active ? "fa-solid" : "fa-light",
                iconClass,
                "block text-xs leading-none",
              )}
              aria-hidden
            />
          </span>
          <SidebarNavLabel className="leading-snug">{label}</SidebarNavLabel>
        </Link>
      </Tip>
    </li>
  )
}

/** Icon-rail row — matches primary sidebar collapsed hit target (`size-9`). */
function IconNavRow({
  href,
  active,
  iconClass,
  label,
  onClick,
}: {
  href: string
  active: boolean
  iconClass: string
  label: string
  onClick?: () => void
}) {
  const { dismissNavFlyout } = useSidebar()
  return (
    <li className="flex w-full justify-center" role="none">
      <Tip label={label} side="right">
        <Link
          to={href}
          onClick={() => {
            onClick?.()
            dismissNavFlyout()
          }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <span className="text-center text-[15px] leading-none" aria-hidden>
            <i className={cn(active ? "fa-solid" : "fa-light", iconClass)} aria-hidden />
          </span>
        </Link>
      </Tip>
    </li>
  )
}

export function LibrarySecondaryNav() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const { openPanel, libraryFolderBridge, libraryAccessBridge, secondaryPanelCompact } =
    useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const showCompactRail = secondaryPanelCompact && !navFlyout
  const { dismissNavFlyout } = useSidebar()
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const [newFolderParentId, setNewFolderParentId] = React.useState<string | null>(null)
  const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)
  const [deleteFolder, setDeleteFolder] = React.useState<LibraryFolder | null>(null)
  const folders = libraryFolderBridge?.folders ?? DEFAULT_LIBRARY_FOLDERS
  const nav = React.useMemo(() => {
    const parsed = parseLibraryNav(new URLSearchParams(searchParamsKey))
    return coerceLibraryNav(parsed, folders)
  }, [searchParamsKey, folders])

  React.useEffect(() => {
    const parsed = parseLibraryNav(new URLSearchParams(searchParamsKey))
    const coerced = coerceLibraryNav(parsed, folders)
    if (libraryNavStatesEqual(parsed, coerced)) return
    navigate(
      libraryHubScopeHref(pathname, searchParams, {
        scope: coerced.scope,
        folderId: coerced.folderId,
      }),
      { replace: true },
    )
  }, [folders, navigate, pathname, searchParams, searchParamsKey])

  const folderTreeScopeActive =
    nav.scope === "folder" &&
    nav.folderId != null &&
    nav.folderId !== LIBRARY_FAVORITES_FOLDER_ID

  const canManageFolders = libraryFolderBridge != null
  const canManageAccess = libraryAccessBridge != null

  /** Favorites is a primary nav row (with All / My), not under “Folders”. */
  const folderTreeRoots = React.useMemo(
    () =>
      folders
        .filter(f => f.parentId === null && f.id !== LIBRARY_FAVORITES_FOLDER_ID)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const openTopLevelFolder = React.useCallback(() => {
    setCustomizingFolder(null)
    setNewFolderParentId(nav.scope === "folder" ? nav.folderId : null)
    setNewFolderOpen(true)
  }, [nav.folderId, nav.scope])

  const openSubfolder = React.useCallback((parentId: string) => {
    setCustomizingFolder(null)
    setNewFolderParentId(parentId)
    setNewFolderOpen(true)
  }, [])

  const openCustomizeFolder = React.useCallback((folder: LibraryFolder) => {
    setCustomizingFolder(folder)
    setNewFolderParentId(folder.parentId)
    setNewFolderOpen(true)
  }, [])

  const openManageAccess = React.useCallback(() => {
    libraryAccessBridge?.openManageAccess()
  }, [libraryAccessBridge])

  const openDeleteFolder = React.useCallback((folder: LibraryFolder) => {
    setDeleteFolder(folder)
  }, [])

  const commitDeleteFolder = React.useCallback(() => {
    if (!deleteFolder || !libraryFolderBridge) return
    const victim = deleteFolder
    const parent = victim.parentId
    const desc = collectFolderDescendantIds(folders, victim.id)
    const remaining = folders.filter(f => !desc.has(f.id))
    if (remaining.length === 0) {
      setDeleteFolder(null)
      return
    }
    const parentStillExists = parent !== null && remaining.some(f => f.id === parent)
    const fallbackRoot = remaining.find(f => f.parentId === null)?.id
    const reassignTarget =
      parentStillExists ? parent : (fallbackRoot ?? remaining[0]!.id)

    libraryFolderBridge.onFoldersChange(remaining)
    libraryFolderBridge.onItemsChange(prev =>
      prev.map(item => (desc.has(item.folderId) ? { ...item, folderId: reassignTarget } : item)),
    )

    if (nav.scope === "folder" && nav.folderId && desc.has(nav.folderId)) {
      navigate(
        libraryHubScopeHref(
          pathname,
          new URLSearchParams(searchParamsKey),
          parentStillExists
            ? { scope: "folder", folderId: parent! }
            : { scope: "all" },
        ),
        { replace: true },
      )
    }

    setDeleteFolder(null)
  }, [deleteFolder, folders, nav.folderId, nav.scope, pathname, libraryFolderBridge, navigate, searchParamsKey])

  const sheetParentId = customizingFolder?.parentId ?? newFolderParentId

  const flattenedFolderLinks = React.useMemo(() => {
    const out: LibraryFolder[] = []
    const walk = (folder: LibraryFolder) => {
      out.push(folder)
      folders
        .filter(c => c.parentId === folder.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(walk)
    }
    folderTreeRoots.forEach(walk)
    return out
  }, [folderTreeRoots, folders])

  const hubNavModals = (
    <>
      <LibraryNewFolderSheet
        open={newFolderOpen}
        onOpenChange={open => {
          setNewFolderOpen(open)
          if (!open) {
            setCustomizingFolder(null)
            setNewFolderParentId(null)
          }
        }}
        parentFolderId={sheetParentId}
        customizingFolder={customizingFolder}
        descriptionText={
          customizingFolder
            ? "Update the folder name, color, and icon shown in the navigation and folder views."
            : sheetParentId
              ? "The folder is created inside the folder selected in the navigation."
              : "Add a top-level folder to the library."
        }
        onCreated={folder => {
          if (customizingFolder) {
            libraryFolderBridge?.onFoldersChange(prev =>
              prev.map(item =>
                item.id === customizingFolder.id
                  ? {
                      ...item,
                      name: folder.name,
                      icon: folder.icon,
                      colorKey: folder.colorKey,
                    }
                  : item,
              ),
            )
          } else {
            libraryFolderBridge?.onFoldersChange(prev => [...prev, { ...folder, id: newFolderId() }])
          }
          setNewFolderOpen(false)
          setCustomizingFolder(null)
          setNewFolderParentId(null)
        }}
      />
      {deleteFolder ? <Shortcut keys="Enter" onInvoke={commitDeleteFolder} /> : null}
      <Dialog open={deleteFolder != null} onOpenChange={open => !open && setDeleteFolder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
            <DialogDescription>
              {deleteFolder
                ? `${deleteFolder.name} and its subfolders will be removed. Questions inside move to the parent folder (or the first top-level folder).`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteFolder(null)}>
              Cancel
              <KbdGroup className="ms-1.5">
                <Kbd variant="bare">Esc</Kbd>
              </KbdGroup>
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={commitDeleteFolder}>
              Delete
              <KbdGroup className="ms-1.5">
                <Kbd variant="bare">⏎</Kbd>
              </KbdGroup>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  if (showCompactRail) {
    return (
      <>
        <nav className="flex min-h-0 flex-1 flex-col" aria-label="Library">
          <div className="flex flex-col items-center border-b border-sidebar-border/60 px-1 py-2">
            <Tip label="Show labels" side="right">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 shrink-0"
                aria-label="Show labels"
                onClick={() => openPanel("library")}
              >
                <i className="fa-light fa-angles-right text-[15px]" aria-hidden="true" />
              </Button>
            </Tip>
          </div>
          <ul className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-2">
            <IconNavRow
              href={libraryHubScopeHref(pathname, searchParams, { scope: "all" })}
              active={isLibraryNavActive(pathname, nav, "all", null, folders)}
              iconClass="fa-table-list"
              label="All questions"
              onClick={() => openPanel("library")}
            />
            <IconNavRow
              href={libraryHubScopeHref(pathname, searchParams, { scope: "my" })}
              active={isLibraryNavActive(pathname, nav, "my", null, folders)}
              iconClass="fa-user"
              label="My questions"
              onClick={() => openPanel("library")}
            />
            <IconNavRow
              href={libraryFavoritesFolderHref(pathname, searchParams)}
              active={isLibraryNavActive(pathname, nav, "folder", LIBRARY_FAVORITES_FOLDER_ID, folders)}
              iconClass="fa-star"
              label="Favorites"
              onClick={() => openPanel("library")}
            />
            <li className="flex w-full justify-center pt-1" role="none">
              <DropdownMenu>
                <Tip label="Folders" side="right">
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "size-9 shrink-0 text-sidebar-foreground",
                        folderTreeScopeActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                      aria-current={folderTreeScopeActive ? "page" : undefined}
                      aria-label="Folders"
                    >
                      <i className="fa-light fa-folder-tree text-[15px]" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </Tip>
                <DropdownMenuContent side="right" align="start" className="max-h-72 overflow-y-auto">
                  {flattenedFolderLinks.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No folders</div>
                  ) : (
                    flattenedFolderLinks.map(folder => {
                      const href = libraryHubScopeHref(pathname, searchParams, {
                        scope: "folder",
                        folderId: folder.id,
                      })
                      const active = isLibraryNavActive(pathname, nav, "folder", folder.id, folders)
                      return (
                        <DropdownMenuItem key={folder.id} asChild>
                          <Link
                            to={href}
                            className={cn(active && "bg-accent")}
                            onClick={() => {
                              openPanel("library")
                              dismissNavFlyout()
                            }}
                          >
                            {folder.name}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
          {canManageFolders ? (
            <div className="flex flex-col items-center border-t border-sidebar-border/60 px-1 py-2">
              <Tip label="Add folder" side="right">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="icon-button-chrome size-9 shrink-0"
                  aria-label="Add folder"
                  onClick={openTopLevelFolder}
                >
                  <i className="fa-light fa-plus text-[15px]" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
          ) : null}
        </nav>
        {hubNavModals}
      </>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" role="navigation" aria-label="Library">
        <ul className="space-y-0.5">
          <NavRow
            href={libraryHubScopeHref(pathname, searchParams, { scope: "all" })}
            active={isLibraryNavActive(pathname, nav, "all", null, folders)}
            iconClass="fa-table-list"
            label="All questions"
            onClick={() => openPanel("library")}
          />
          <NavRow
            href={libraryHubScopeHref(pathname, searchParams, { scope: "my" })}
            active={isLibraryNavActive(pathname, nav, "my", null, folders)}
            iconClass="fa-user"
            label="My questions"
          />
          <NavRow
            href={libraryFavoritesFolderHref(pathname, searchParams)}
            active={isLibraryNavActive(pathname, nav, "folder", LIBRARY_FAVORITES_FOLDER_ID, folders)}
            iconClass="fa-star"
            label="Favorites"
            onClick={() => openPanel("library")}
          />
          <li role="presentation" className="select-none">
            <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary-action-foreground">
                Folders
              </span>
              <Tip label="Add folder" side="right">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="icon-button-chrome shrink-0"
                  aria-label="Add folder"
                  disabled={!canManageFolders}
                  onClick={openTopLevelFolder}
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
          </li>
          {folderTreeRoots.map(folder => (
            <li
              key={folder.id}
              className="min-w-0 w-full list-none py-0"
              style={outlineTreeBranchDepthStyle(0)}
            >
              <LibraryFolderTreeBranch
                folder={folder}
                folders={folders}
                pathname={pathname}
                hubSearchParams={searchParams}
                nav={nav}
                canManageFolders={canManageFolders}
                canManageAccess={canManageAccess}
                onAddSubfolder={openSubfolder}
                onCustomizeFolder={openCustomizeFolder}
                onManageAccess={openManageAccess}
                onDeleteFolder={openDeleteFolder}
              />
            </li>
          ))}
        </ul>
      </div>
      {hubNavModals}
    </>
  )
}
