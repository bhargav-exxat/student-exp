"use client"

/**
 * OS-style icon folder view for Library — hierarchy, appearance (color + icon),
 * create (floating sheet drawer like `ExportDrawer` + preview), inline rename, move / delete, and move questions between folders.
 */

import * as React from "react"
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import type { LibraryItem } from "@/lib/mock/library"
import {
  collectFolderDescendantIds,
  isValidFolderMove,
  newFolderId,
  LIBRARY_FOLDER_COLOR_STYLES,
  LIBRARY_FOLDER_ICON_OPTIONS,
  type LibraryFolder,
  type LibraryFolderColorKey,
} from "@/lib/mock/library-folders"
import {
  ListPageViewFrame,
  LIST_PAGE_VIEW_FRAME_MAX_WIDE,
} from "@/components/data-views/list-page-view-frame"
import { OsFolderGlyph } from "@/components/data-views/os-folder-glyph"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"

const COLOR_OPTIONS: LibraryFolderColorKey[] = [
  "brand",
  "success",
  "warning",
  "destructive",
  "muted",
  "chart1",
  "chart2",
  "chart3",
]

export interface LibraryOsFolderViewProps {
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
  questions: LibraryItem[]
  onQuestionsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
}

function folderTrail(folders: LibraryFolder[], folderId: string | null): LibraryFolder[] {
  if (!folderId) return []
  const byId = new Map(folders.map(f => [f.id, f]))
  const trail: LibraryFolder[] = []
  let cur: string | null = folderId
  while (cur) {
    const f = byId.get(cur)
    if (!f) break
    trail.unshift(f)
    cur = f.parentId
  }
  return trail
}

function folderHoverCounts(
  folder: LibraryFolder,
  folders: LibraryFolder[],
  questions: LibraryItem[],
) {
  const subfolders = folders.filter(f => f.parentId === folder.id).length
  const questionsInFolder = questions.filter(q => q.folderId === folder.id).length
  return { subfolders, questionsInFolder }
}

function validMoveTargets(
  folders: LibraryFolder[],
  movingId: string,
): Array<{ id: string | null; label: string }> {
  const out: Array<{ id: string | null; label: string }> = [{ id: null, label: "Library (root)" }]
  for (const f of folders) {
    if (f.id === movingId) continue
    if (!isValidFolderMove(folders, movingId, f.id)) continue
    out.push({ id: f.id, label: f.name })
  }
  return out
}

export function LibraryOsFolderView({
  folders,
  onFoldersChange,
  questions,
  onQuestionsChange,
}: LibraryOsFolderViewProps) {
  const [currentId, setCurrentId] = React.useState<string | null>(null)

  const childFolders = React.useMemo(
    () => folders.filter(f => f.parentId === currentId),
    [folders, currentId],
  )

  const filesHere = React.useMemo(
    () => questions.filter(q => q.folderId === currentId),
    [questions, currentId],
  )

  const trail = React.useMemo(() => folderTrail(folders, currentId), [folders, currentId])

  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [customizeFolderOpen, setCustomizeFolderOpen] = React.useState(false)
  const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)

  const [renamingFolderId, setRenamingFolderId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")
  const renameInputRef = React.useRef<HTMLInputElement>(null)

  const [appearanceDialog, setAppearanceDialog] = React.useState<LibraryFolder | null>(null)
  const [moveFolderId, setMoveFolderId] = React.useState<string | null>(null)
  const [deleteFolderId, setDeleteFolderId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (renamingFolderId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingFolderId])

  function openCreateFolderPanel() {
    setCreateFolderOpen(true)
  }

  function startRename(folder: LibraryFolder) {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.name)
  }

  function commitRename() {
    if (!renamingFolderId) return
    const v = renameValue.trim()
    const folder = folders.find(f => f.id === renamingFolderId)
    if (!folder) {
      setRenamingFolderId(null)
      return
    }
    if (!v) {
      setRenameValue(folder.name)
      setRenamingFolderId(null)
      return
    }
    onFoldersChange(prev => prev.map(f => (f.id === renamingFolderId ? { ...f, name: v } : f)))
    setRenamingFolderId(null)
  }

  function cancelRename() {
    setRenamingFolderId(null)
    setRenameValue("")
  }

  function commitMoveFolder(targetParentId: string | null) {
    if (!moveFolderId) return
    if (!isValidFolderMove(folders, moveFolderId, targetParentId)) return
    onFoldersChange(prev =>
      prev.map(f => (f.id === moveFolderId ? { ...f, parentId: targetParentId } : f)),
    )
    setMoveFolderId(null)
  }

  function commitDeleteFolder() {
    if (!deleteFolderId) return
    const victim = folders.find(f => f.id === deleteFolderId)
    if (!victim) return
    const parent = victim.parentId
    const desc = collectFolderDescendantIds(folders, deleteFolderId)
    const remaining = folders.filter(f => !desc.has(f.id))
    if (remaining.length === 0) {
      setDeleteFolderId(null)
      return
    }
    const parentStillExists = parent !== null && remaining.some(f => f.id === parent)
    const fallbackRoot = remaining.find(f => f.parentId === null)?.id
    const reassignTarget =
      parentStillExists ? parent : (fallbackRoot ?? remaining[0]!.id)

    onFoldersChange(remaining)
    onQuestionsChange(prev =>
      prev.map(q => (desc.has(q.folderId) ? { ...q, folderId: reassignTarget } : q)),
    )
    if (currentId && desc.has(currentId)) setCurrentId(parentStillExists ? parent : null)
    setDeleteFolderId(null)
  }

  function moveQuestionToFolder(questionId: string, folderId: string) {
    onQuestionsChange(prev =>
      prev.map(q => (q.id === questionId ? { ...q, folderId } : q)),
    )
  }

  return (
    <ListPageViewFrame
      className="flex min-h-0 flex-1 flex-col gap-3"
      maxWidthClassName={LIST_PAGE_VIEW_FRAME_MAX_WIDE}
    >
      {/* Breadcrumb navigation */}
      <nav aria-label="Folder breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden pb-4">
        <span className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentId(null)}
            className="font-sans text-sm text-muted-foreground hover:text-interactive-hover-foreground transition-colors tracking-normal"
          >
            Library
          </button>
          {trail.length > 0 && (
            <i className="fa-light fa-chevron-right text-xs text-muted-foreground/50" aria-hidden="true" />
          )}
        </span>
        {trail.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentId(f.id)}
              className="font-sans text-sm text-muted-foreground hover:text-interactive-hover-foreground transition-colors tracking-normal"
            >
              {f.name}
            </button>
            {i < trail.length - 1 && (
              <i className="fa-light fa-chevron-right text-xs text-muted-foreground/50" aria-hidden="true" />
            )}
          </span>
        ))}
      </nav>

      {/* Icon grid — new folder first, then folders + question files */}
      <div
        className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        role="list"
        aria-label="Folders and questions in this location"
      >
        {/* First tile: create folder */}
        <div role="listitem" className="relative">
          <Tip
            side="bottom"
            label={(
              <span className="flex max-w-[14rem] flex-col gap-1.5 text-start">
                <span className="text-xs font-semibold text-background">New folder</span>
                <span className="text-[11px] leading-snug text-background/85">
                  Opens the same floating panel as Export to name the folder, pick tint and icon, then create it here.
                </span>
              </span>
            )}
          >
            <button
              type="button"
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-muted-foreground/45 bg-muted/10 p-3 text-center transition-all",
                "hover:border-muted-foreground/70 hover:bg-muted/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              onClick={openCreateFolderPanel}
              aria-label="Create new folder"
            >
              <OsFolderGlyph
                colorKey="muted"
                icon="fa-folder-plus"
                size="md"
                variant="outline"
              />
              <span className="line-clamp-2 w-full text-xs font-medium text-muted-foreground">
                New folder
              </span>
            </button>
          </Tip>
        </div>

        {childFolders.map(folder => {
          const isRenaming = renamingFolderId === folder.id
          const { subfolders, questionsInFolder } = folderHoverCounts(folder, folders, questions)

          return (
            <div key={folder.id} role="listitem" className="group relative">
              {isRenaming ? (
                <div
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-xl border border-border/70 bg-card/40 p-3 text-center shadow-sm",
                  )}
                >
                  <OsFolderGlyph
                    colorKey={folder.colorKey}
                    icon={folder.icon}
                    size="md"
                  />
                  <Label htmlFor={`rename-${folder.id}`} className="sr-only">
                    Rename folder {folder.name}
                  </Label>
                  <Input
                    id={`rename-${folder.id}`}
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        commitRename()
                      }
                      if (e.key === "Escape") {
                        e.preventDefault()
                        cancelRename()
                      }
                    }}
                    className="h-8 text-center text-xs font-medium"
                    aria-describedby={`rename-hint-${folder.id}`}
                  />
                  <p id={`rename-hint-${folder.id}`} className="sr-only">
                    Press Enter to save, Escape to cancel.
                  </p>
                </div>
              ) : (
                <Tip
                  side="bottom"
                  label={(
                    <span className="flex max-w-[14rem] flex-col gap-1.5 text-start">
                      <span className="text-xs font-semibold text-background">{folder.name}</span>
                      <span className="text-[11px] leading-snug text-background/85">
                        Double-click to open. Use the menu (⋯) for rename, appearance, move, or delete.
                      </span>
                      <span className="text-[11px] text-background/80">
                        {questionsInFolder} question{questionsInFolder === 1 ? "" : "s"} in this folder
                        {" · "}
                        {subfolders} subfolder{subfolders === 1 ? "" : "s"}
                      </span>
                    </span>
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col items-center gap-2 rounded-xl border border-transparent p-3 text-center transition-all",
                      "hover:border-border/80 hover:bg-muted/35",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    onDoubleClick={() => setCurrentId(folder.id)}
                    aria-label={`Open folder ${folder.name}`}
                  >
                    <OsFolderGlyph
                      colorKey={folder.colorKey}
                      icon={folder.icon}
                      size="md"
                    />
                    <span className="line-clamp-2 w-full text-xs font-medium text-foreground">
                      {folder.name}
                    </span>
                  </button>
                </Tip>
              )}
              {!isRenaming && (
                <div className="absolute end-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <DropdownMenu>
                    <Tip label="Folder actions" side="bottom">
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Actions for folder ${folder.name}`}
                        >
                          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                    </Tip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setTimeout(() => startRename(folder), 0)
                        }}
                      >
                        <i className="fa-light fa-pen text-xs" aria-hidden="true" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => {
                        setCustomizingFolder(folder)
                        setCustomizeFolderOpen(true)
                      }}>
                        <i className="fa-light fa-wand-magic-sparkles text-xs" aria-hidden="true" />
                        Customize
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setMoveFolderId(folder.id)}>
                        <i className="fa-light fa-arrow-right-arrow-left text-xs" aria-hidden="true" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleteFolderId(folder.id)}
                      >
                        <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )
        })}

        {filesHere.map(q => (
          <div key={q.id} role="listitem" className="group relative">
            <div
              className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm"
            >
              <div className="flex size-[4.5rem] items-center justify-center rounded-xl bg-muted">
                <i className="fa-solid fa-file-lines text-3xl text-muted-foreground" aria-hidden="true" />
              </div>
              <span className="line-clamp-2 w-full text-xs font-medium text-foreground">{q.stem}</span>
              <span className="w-full font-mono text-xs text-muted-foreground">{q.questionId}</span>
            </div>
            <div className="absolute end-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <DropdownMenu>
                <Tip label="Question actions" side="bottom">
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Move question ${q.stem}`}
                    >
                      <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </Tip>
                <DropdownMenuContent align="end">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <i className="fa-solid fa-folder-arrow-up me-2 text-xs" aria-hidden="true" />
                      Move to folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                      {folders
                        .filter(f => f.id !== q.folderId)
                        .map(f => (
                          <DropdownMenuItem key={f.id} onSelect={() => moveQuestionToFolder(q.id, f.id)}>
                            <i className={cn("fa-solid me-2 text-xs", f.icon)} aria-hidden="true" />
                            {f.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {childFolders.length === 0 && filesHere.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          This folder is empty. Add a folder with the first tile, or open another location.
        </p>
      )}

      <LibraryNewFolderSheet
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentFolderId={currentId}
        onCreated={data =>
          onFoldersChange(prev => [...prev, { ...data, id: newFolderId() }])
        }
      />

      {/* Customize folder */}
      <LibraryNewFolderSheet
        open={customizeFolderOpen}
        onOpenChange={setCustomizeFolderOpen}
        parentFolderId={customizingFolder?.parentId ?? null}
        customizingFolder={customizingFolder}
        onCreated={data => {
          if (customizingFolder) {
            onFoldersChange(prev =>
              prev.map(f =>
                f.id === customizingFolder.id
                  ? {
                      ...f,
                      name: data.name,
                      icon: data.icon,
                      colorKey: data.colorKey,
                    }
                  : f,
              ),
            )
          }
          setCustomizingFolder(null)
          setCustomizeFolderOpen(false)
        }}
      />

      {/* Appearance (existing folders) */}
      <Dialog open={!!appearanceDialog} onOpenChange={open => !open && setAppearanceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Folder appearance</DialogTitle>
            <DialogDescription>
              Pick a tint and icon. These are demo-only until wired to your API.
            </DialogDescription>
          </DialogHeader>
          {appearanceDialog && (
            <div className="flex flex-col gap-4 py-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      aria-pressed={appearanceDialog.colorKey === c}
                      className={cn(
                        "size-9 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        LIBRARY_FOLDER_COLOR_STYLES[c].tile,
                        appearanceDialog.colorKey === c ? "ring-2 ring-ring" : "border-transparent opacity-80 hover:opacity-100",
                      )}
                      onClick={() =>
                        onFoldersChange(prev =>
                          prev.map(f =>
                            f.id === appearanceDialog.id ? { ...f, colorKey: c } : f,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Icon</p>
                <div className="grid max-h-40 grid-cols-5 gap-2 overflow-y-auto rounded-md border border-border p-2">
                  {LIBRARY_FOLDER_ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      aria-label={`Icon ${ic}`}
                      aria-pressed={appearanceDialog.icon === ic}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
                        appearanceDialog.icon === ic
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-transparent hover:bg-muted",
                      )}
                      onClick={() =>
                        onFoldersChange(prev =>
                          prev.map(f =>
                            f.id === appearanceDialog.id ? { ...f, icon: ic } : f,
                          ),
                        )
                      }
                    >
                      <i className={cn("fa-solid", ic)} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" size="sm" onClick={() => setAppearanceDialog(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move folder */}
      <Dialog open={moveFolderId !== null} onOpenChange={open => !open && setMoveFolderId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move folder</DialogTitle>
            <DialogDescription>Choose a new parent. Subfolders stay with this folder.</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto py-2">
            {moveFolderId &&
              validMoveTargets(folders, moveFolderId).map(t => (
                <Button
                  key={t.id ?? "root"}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal"
                  onClick={() => commitMoveFolder(t.id)}
                >
                  {t.label}
                </Button>
              ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setMoveFolderId(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteFolderId !== null} onOpenChange={open => !open && setDeleteFolderId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
            <DialogDescription>
              Subfolders are removed. Questions inside move to the parent folder (or the first top-level folder).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteFolderId(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={commitDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageViewFrame>
  )
}
