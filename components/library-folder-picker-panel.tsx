"use client"

/**
 * Folder location picker — same search chrome + folder tree as Library secondary panel.
 * Used by `new-library-item-form` inspector (selection, not navigation).
 */

import * as React from "react"
import { useLocation, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { LIBRARY_FOLDER_ICON_COLORS } from "@/lib/mock/library-folders"
import { LibraryFolderTreeBranch } from "@/components/data-views/library-folder-tree-branch"
import { outlineTreeBranchDepthStyle } from "@/components/data-views/outline-tree-menu"
import {
  LIBRARY_FAVORITES_FOLDER_ID,
  coerceLibraryNav,
  parseLibraryNav,
} from "@/lib/library-nav"

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

function FolderPickerSearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="relative">
      <i
        className="fa-light fa-magnifying-glass pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search folders…"
        aria-label="Search folders"
        className={cn(
          "h-7 w-full rounded-md border border-border bg-background ps-7 pe-2 text-xs",
          "placeholder:text-muted-foreground/70",
          "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring",
        )}
      />
    </div>
  )
}

function FolderPickerScopeRow({
  folder,
  active,
  onSelect,
}: {
  folder: LibraryFolder
  active: boolean
  onSelect: () => void
}) {
  return (
    <li className="min-w-0">
      <Tip label={folder.name} side="right">
        <button
          type="button"
          onClick={onSelect}
          aria-current={active ? "true" : undefined}
          className={cn(
            "flex w-full min-h-8 min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
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
                folder.icon,
                LIBRARY_FOLDER_ICON_COLORS[folder.colorKey],
                "block text-xs leading-none",
              )}
              aria-hidden
            />
          </span>
          <SidebarNavLabel className="leading-snug">{folder.name}</SidebarNavLabel>
          {active ? (
            <span className="ms-auto shrink-0 text-sidebar-accent-foreground" aria-hidden>
              <i className="fa-solid fa-check text-[11px]" />
            </span>
          ) : null}
        </button>
      </Tip>
    </li>
  )
}

export interface LibraryFolderPickerPanelProps {
  folders: LibraryFolder[]
  value: string
  onChange: (folderId: string) => void
  onRequestNewFolder: () => void
}

export function LibraryFolderPickerPanel({
  folders,
  value,
  onChange,
  onRequestNewFolder,
}: LibraryFolderPickerPanelProps) {
  const [query, setQuery] = React.useState("")
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()

  const nav = React.useMemo(() => {
    const parsed = parseLibraryNav(new URLSearchParams(searchParamsKey))
    return coerceLibraryNav(parsed, folders)
  }, [searchParamsKey, folders])

  const favoritesFolder = React.useMemo(
    () => folders.find(f => f.id === LIBRARY_FAVORITES_FOLDER_ID),
    [folders],
  )

  const folderTreeRoots = React.useMemo(
    () =>
      folders
        .filter(f => f.parentId === null && f.id !== LIBRARY_FAVORITES_FOLDER_ID)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const visibleRoots = React.useMemo(
    () =>
      folderTreeRoots.filter(f => libraryFolderMatchesSearch(f, folders, query)),
    [folderTreeRoots, folders, query],
  )

  const showFavorites =
    favoritesFolder &&
    libraryFolderMatchesSearch(favoritesFolder, folders, query)

  const pickFolder = React.useMemo(
    () => ({
      selectedFolderId: value,
      onSelect: onChange,
      searchQuery: query,
    }),
    [value, onChange, query],
  )

  const noop = React.useCallback(() => {}, [])

  return (
    <div className="flex max-h-[min(70vh,28rem)] min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-2 py-2">
        <FolderPickerSearchInput value={query} onChange={setQuery} />
      </div>

      <div
        data-slot="folder-picker-panel"
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2"
        role="listbox"
        aria-label="Folders"
      >
        <ul className="space-y-0.5">
          {showFavorites && favoritesFolder ? (
            <FolderPickerScopeRow
              folder={favoritesFolder}
              active={value === favoritesFolder.id}
              onSelect={() => onChange(favoritesFolder.id)}
            />
          ) : null}

          {visibleRoots.length > 0 ? (
            <li role="presentation" className="select-none">
              <div className="flex items-center px-2 pt-2 pb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary-action-foreground">
                  Folders
                </span>
              </div>
            </li>
          ) : null}

          {visibleRoots.map(folder => (
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
                canManageFolders={false}
                canManageAccess={false}
                onAddSubfolder={noop}
                onCustomizeFolder={noop}
                onManageAccess={noop}
                onDeleteFolder={noop}
                pickFolder={pickFolder}
              />
            </li>
          ))}

          {query.trim() && !showFavorites && visibleRoots.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">No folders match that search.</li>
          ) : null}
        </ul>
      </div>

      <div className="shrink-0 border-t border-border px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2 px-2"
          onClick={onRequestNewFolder}
        >
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--icon-disc-brand-bg)] text-[var(--icon-disc-brand-fg)]"
            aria-hidden
          >
            <i className="fa-light fa-folder-plus text-sm" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">New folder…</span>
        </Button>
      </div>
    </div>
  )
}
