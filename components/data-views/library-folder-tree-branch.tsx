"use client"

/**
 * Library **Folders** tree — shared outline primitives (`OutlineTree*`) so the rail
 * matches `HubTreePanelView` and shadcn sidebar file-tree rhythm.
 *
 * Indent model: flat `OutlineTreeSub` lists (full width) + `--outline-tree-depth-step`
 * (12px) on each row. Avoids compounding 24px sub-margins that crush deep labels.
 */

import * as React from "react"
import { Link } from "react-router-dom"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import {
  OutlineTreeCollapsibleContentRail,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  outlineTreeBranchDepthStyle,
} from "@/components/data-views/outline-tree-menu"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { LIBRARY_FOLDER_ICON_COLORS } from "@/lib/mock/library-folders"
import {
  isLibraryNavActive,
  libraryHubScopeHref,
  type LibraryNavState,
} from "@/lib/library-nav"

/** Root rows align with All/My (`px-2` on the link only); nested rows add depth step. */
function libraryFolderRowIndentStyle(depth: number): React.CSSProperties | undefined {
  if (depth <= 0) return undefined
  return {
    "--outline-tree-depth": depth,
    paddingInlineStart: `calc(${depth} * var(--outline-tree-depth-step))`,
  } as React.CSSProperties
}

export interface LibraryFolderPickFolderProps {
  selectedFolderId: string
  onSelect: (folderId: string) => void
  /** When set, branches with no name/descendant match are hidden. */
  searchQuery?: string
}

function libraryFolderMatchesSearch(
  folder: LibraryFolder,
  folders: LibraryFolder[],
  query: string,
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (folder.name.toLowerCase().includes(needle)) return true
  return folders.some(
    f => f.parentId === folder.id && libraryFolderMatchesSearch(f, folders, query),
  )
}

export interface LibraryFolderTreeBranchProps {
  folder: LibraryFolder
  folders: LibraryFolder[]
  pathname: string
  hubSearchParams: URLSearchParams
  nav: LibraryNavState
  canManageFolders: boolean
  canManageAccess: boolean
  onAddSubfolder: (parentId: string) => void
  onCustomizeFolder: (folder: LibraryFolder) => void
  onManageAccess: () => void
  onDeleteFolder: (folder: LibraryFolder) => void
  /** Nesting depth (0 = root folder under FOLDERS). */
  depth?: number
  /** Selection mode for folder pickers (e.g. new-question inspector). */
  pickFolder?: LibraryFolderPickFolderProps
}

function FolderRowActionsMenu({
  folder,
  folderActive,
  canManageAccess,
  onAddSubfolder,
  onCustomizeFolder,
  onManageAccess,
  onDeleteFolder,
  overlay = false,
  className,
}: {
  folder: LibraryFolder
  folderActive: boolean
  canManageAccess: boolean
  onAddSubfolder: (parentId: string) => void
  onCustomizeFolder: (folder: LibraryFolder) => void
  onManageAccess: () => void
  onDeleteFolder: (folder: LibraryFolder) => void
  overlay?: boolean
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={`Folder actions for ${folder.name}`}
          className={cn(
            overlay
              ? "icon-button-chrome absolute inset-0 size-6 shrink-0 shadow-none"
              : "icon-button-chrome size-6 shrink-0 shadow-none",
            "pointer-events-none opacity-0 transition-opacity",
            "group-hover/row:pointer-events-auto group-hover/row:opacity-100",
            "group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100",
            "data-[state=open]:pointer-events-auto data-[state=open]:opacity-100",
            folderActive && "hover:bg-sidebar-accent",
            className,
          )}
          onClick={event => event.stopPropagation()}
        >
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            window.setTimeout(() => onAddSubfolder(folder.id), 0)
          }}
        >
          <i className="fa-light fa-plus text-xs" aria-hidden="true" />
          Add folder
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            window.setTimeout(() => onCustomizeFolder(folder), 0)
          }}
        >
          <i className="fa-light fa-wand-magic-sparkles text-xs" aria-hidden="true" />
          Customize
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canManageAccess}
          onSelect={() => {
            window.setTimeout(() => onManageAccess(), 0)
          }}
        >
          <i className="fa-light fa-user-gear text-xs" aria-hidden="true" />
          Manage access
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            window.setTimeout(() => onDeleteFolder(folder), 0)
          }}
        >
          <i className="fa-light fa-trash text-xs" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LibraryFolderTreeBranchInner({
  folder,
  folders,
  pathname,
  hubSearchParams,
  nav,
  canManageFolders,
  canManageAccess,
  onAddSubfolder,
  onCustomizeFolder,
  onManageAccess,
  onDeleteFolder,
  depth = 0,
  pickFolder,
}: LibraryFolderTreeBranchProps) {
  if (
    pickFolder?.searchQuery?.trim() &&
    !libraryFolderMatchesSearch(folder, folders, pickFolder.searchQuery)
  ) {
    return null
  }

  const childFolders = React.useMemo(
    () =>
      folders
        .filter(f => f.parentId === folder.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders, folder.id],
  )

  const hasSubfolders = childFolders.length > 0

  const folderHref = libraryHubScopeHref(pathname, hubSearchParams, {
    scope: "folder",
    folderId: folder.id,
  })
  const folderActive = pickFolder
    ? pickFolder.selectedFolderId === folder.id
    : isLibraryNavActive(pathname, nav, "folder", folder.id, folders)

  return (
    <Collapsible defaultOpen={false} className="group/collapsible">
      <div
        className={cn(
          "group/row relative flex min-w-0 w-full items-start rounded-md transition-colors",
          folderActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground ring-1 ring-inset ring-sidebar-border/80"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        )}
        style={libraryFolderRowIndentStyle(depth)}
      >
        {hasSubfolders ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="icon-button-chrome mt-0.5 flex size-6 shrink-0 items-center justify-center transition-colors hover:text-interactive-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${folder.name} — expand or collapse`}
            >
              <i
                className="fa-light fa-chevron-right text-xs transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90"
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="mt-0.5 size-6 shrink-0" aria-hidden />
        )}
        <Tip label={folder.name} side="right" triggerClassName="min-w-0 flex-1">
          {pickFolder ? (
            <button
              type="button"
              role="option"
              aria-selected={folderActive}
              onClick={() => pickFolder.onSelect(folder.id)}
              className={cn(
                "flex min-w-0 flex-1 items-start gap-1.5 py-0.5 text-left text-sm transition-colors",
                hasSubfolders ? "pe-7" : "pe-0.5",
                depth === 0 && "ps-2",
                "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                !folderActive && "text-sidebar-foreground",
              )}
            >
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center"
                aria-hidden
              >
                <i
                  className={cn(
                    "fa-light block text-xs leading-none",
                    folder.icon,
                    LIBRARY_FOLDER_ICON_COLORS[folder.colorKey],
                  )}
                  aria-hidden
                />
              </span>
              <SidebarNavLabel className="min-w-0 leading-snug">{folder.name}</SidebarNavLabel>
              {folderActive ? (
                <span className="ms-auto shrink-0 pe-1 text-sidebar-accent-foreground" aria-hidden>
                  <i className="fa-solid fa-check text-[11px]" />
                </span>
              ) : null}
            </button>
          ) : (
            <Link
              to={folderHref}
              aria-current={folderActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-start gap-1.5 py-0.5 text-left text-sm transition-colors",
                hasSubfolders || canManageFolders ? "pe-7" : "pe-0.5",
                depth === 0 && "ps-2",
                "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                !folderActive && "text-sidebar-foreground",
              )}
            >
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center"
                aria-hidden
              >
                <i
                  className={cn(
                    "fa-light block text-xs leading-none",
                    folder.icon,
                    LIBRARY_FOLDER_ICON_COLORS[folder.colorKey],
                  )}
                  aria-hidden
                />
              </span>
              <SidebarNavLabel className="min-w-0 leading-snug">{folder.name}</SidebarNavLabel>
            </Link>
          )}
        </Tip>
        {hasSubfolders ? (
          <div className="relative mt-0.5 me-0.5 flex size-6 shrink-0 items-center justify-center">
            <span
              className={cn(
                "text-xs tabular-nums text-muted-foreground transition-opacity",
                canManageFolders &&
                  "group-hover/row:opacity-0 group-focus-within/row:opacity-0",
              )}
            >
              {childFolders.length}
            </span>
            {canManageFolders ? (
              <FolderRowActionsMenu
                folder={folder}
                folderActive={folderActive}
                canManageAccess={canManageAccess}
                onAddSubfolder={onAddSubfolder}
                onCustomizeFolder={onCustomizeFolder}
                onManageAccess={onManageAccess}
                onDeleteFolder={onDeleteFolder}
                overlay
              />
            ) : null}
          </div>
        ) : canManageFolders ? (
          <FolderRowActionsMenu
            folder={folder}
            folderActive={folderActive}
            canManageAccess={canManageAccess}
            onAddSubfolder={onAddSubfolder}
            onCustomizeFolder={onCustomizeFolder}
            onManageAccess={onManageAccess}
            onDeleteFolder={onDeleteFolder}
            className="absolute end-0.5 top-0.5 z-10"
          />
        ) : null}
      </div>
      {hasSubfolders ? (
        <OutlineTreeCollapsibleContentRail>
          <OutlineTreeSub surface="sidebar" guideLayout="chevronRail" className="gap-0 py-0">
            {childFolders.map(child => (
              <OutlineTreeMenuItem
                key={child.id}
                style={outlineTreeBranchDepthStyle(depth + 1)}
              >
                <LibraryFolderTreeBranch
                  depth={depth + 1}
                  folder={child}
                  folders={folders}
                  pathname={pathname}
                  hubSearchParams={hubSearchParams}
                  nav={nav}
                  canManageFolders={canManageFolders}
                  canManageAccess={canManageAccess}
                  onAddSubfolder={onAddSubfolder}
                  onCustomizeFolder={onCustomizeFolder}
                  onManageAccess={onManageAccess}
                  onDeleteFolder={onDeleteFolder}
                  pickFolder={pickFolder}
                />
              </OutlineTreeMenuItem>
            ))}
          </OutlineTreeSub>
        </OutlineTreeCollapsibleContentRail>
      ) : null}
    </Collapsible>
  )
}

/**
 * Memoized for the secondary panel: the tree re-renders on every navigation,
 * hash change, or searchParams flip in `LibrarySecondaryNav`. Without memo,
 * each level recurses through `Collapsible` + `Tip` + `DropdownMenu` per
 * branch (an inactive subtree of ~10–20 folders is ~30+ Radix instances) and
 * pegs frame budget on otherwise unrelated route changes.
 *
 * Memoization is safe with reference equality because the parent passes
 * stable refs:
 *   - `folder`, `folders` — from `libraryFolderBridge?.folders ?? DEFAULT…`
 *     (state, not recomputed each render).
 *   - `pathname` — string from `useLocation()`.
 *   - `hubSearchParams` — react-router-dom v7 `useSearchParams` memoizes
 *     via `useMemo` on `location.search` (see chunk-66UKHEGQ.js#L716).
 *   - `nav` — `useMemo` over `searchParams.toString()` in `LibrarySecondaryNav`.
 *   - `canManageFolders` / `canManageAccess` — booleans.
 *   - All four callbacks — wrapped in `useCallback` in `LibrarySecondaryNav`.
 *
 * Recursive children render `<LibraryFolderTreeBranch>` (the exported
 * memoized const), so memoization composes down the tree.
 */
export const LibraryFolderTreeBranch = React.memo(LibraryFolderTreeBranchInner)
