"use client"

/**
 * Shared “new folder” floating sheet (same shell as Export) — used by OS folder grid and column panel.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tip } from "@/components/ui/tip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  FLOATING_SHEET_CHROME_CLASS,
  floatingSheetWidthClass,
  useCompactFloatingSheet,
} from "@/lib/floating-sheet-panel"
import { cn } from "@/lib/utils"
import {
  LIBRARY_FOLDER_COLOR_STYLES,
  LIBRARY_FOLDER_ICON_OPTIONS,
  type LibraryFolderColorKey,
} from "@/lib/mock/library-folders"
import { OsFolderGlyph } from "@/components/data-views/os-folder-glyph"

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

function FolderTilePreview({
  name,
  colorKey,
  icon,
  className,
}: {
  name: string
  colorKey: LibraryFolderColorKey
  icon: string
  className?: string
}) {
  const display = name.trim() || "Untitled"
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-muted/20 p-6 shadow-sm",
        className,
      )}
    >
      <OsFolderGlyph
        colorKey={colorKey}
        icon={icon}
        size="lg"
        decorative={false}
        label={`Folder preview: ${display}`}
      />
      <p className="line-clamp-2 min-h-[2.5rem] w-full text-center text-sm font-medium text-foreground">
        {display}
      </p>
    </div>
  )
}

export interface LibraryNewFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Parent folder id for the new folder (`null` = top level). */
  parentFolderId: string | null
  /** Replaces default helper copy under the title. */
  descriptionText?: string
  /** When provided, the sheet is in "customize" mode with these initial values. */
  customizingFolder?: {
    name: string
    icon: string
    colorKey: LibraryFolderColorKey
    parentId: string | null
  } | null
  onCreated: (folder: {
    name: string
    icon: string
    colorKey: LibraryFolderColorKey
    parentId: string | null
  }) => void
}

export function LibraryNewFolderSheet({
  open,
  onOpenChange,
  parentFolderId,
  customizingFolder,
  descriptionText = "Name, color, and icon update the preview. The folder is created in the location shown in the breadcrumb above the grid.",
  onCreated,
}: LibraryNewFolderSheetProps) {
  const compactSheet = useCompactFloatingSheet()
  const [draft, setDraft] = React.useState<{
    name: string
    colorKey: LibraryFolderColorKey
    icon: string
  }>({ name: "Untitled", colorKey: "brand", icon: "fa-folder" })

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setDraft(
          customizingFolder
            ? {
                name: customizingFolder.name,
                colorKey: customizingFolder.colorKey,
                icon: customizingFolder.icon,
              }
            : { name: "Untitled", colorKey: "brand", icon: "fa-folder" },
        )
      }
      onOpenChange(next)
    },
    [customizingFolder, onOpenChange],
  )

  const createDisabled = !draft.name.trim()

  function commit() {
    const v = draft.name.trim()
    if (!v) return
    onCreated({
      name: v,
      icon: draft.icon,
      colorKey: draft.colorKey,
      parentId: parentFolderId,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        data-slot="new-folder-drawer"
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className={cn("z-[80]", FLOATING_SHEET_CHROME_CLASS, floatingSheetWidthClass(compactSheet))}
        style={{ top: "0.5rem", bottom: "0.5rem", right: "0.5rem", height: "calc(100svh - 1rem)" }}
      >
        <Shortcut keys="Enter" disabled={createDisabled} onInvoke={commit} />

        <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
          <SheetTitle className="text-base font-semibold leading-tight">
            {customizingFolder ? "Customize folder" : "New folder"}
          </SheetTitle>
          <Tip label="Close" side="bottom">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
            </Button>
          </Tip>
        </div>

        <p id="new-folder-panel-desc" className="px-4 pb-3 text-sm text-muted-foreground -mt-1">
          {descriptionText}
        </p>

        <form
          id="new-folder-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={event => {
            event.preventDefault()
            commit()
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col items-center gap-4">
                <FolderTilePreview
                  name={draft.name}
                  colorKey={draft.colorKey}
                  icon={draft.icon}
                  className="w-full max-w-[280px]"
                />
                <div className="w-full max-w-[280px] space-y-2">
                  <Label htmlFor="new-folder-name-shared">Folder name</Label>
                  <Input
                    id="new-folder-name-shared"
                    value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    autoComplete="off"
                    aria-describedby="new-folder-panel-desc new-folder-name-hint-shared"
                    aria-invalid={createDisabled}
                  />
                  <p id="new-folder-name-hint-shared" className="text-sm text-muted-foreground">
                    Shown under the folder icon in the grid or column.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      aria-pressed={draft.colorKey === c}
                      className={cn(
                        "size-10 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        LIBRARY_FOLDER_COLOR_STYLES[c].tile,
                        draft.colorKey === c
                          ? "ring-2 ring-ring"
                          : "border-transparent opacity-85 hover:opacity-100",
                      )}
                      onClick={() => setDraft(d => ({ ...d, colorKey: c }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Icon</p>
                <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto rounded-xl border border-border p-3">
                  {LIBRARY_FOLDER_ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      aria-label={`Icon ${ic.replace(/^fa-/, "").replace(/-/g, " ")}`}
                      aria-pressed={draft.icon === ic}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg border text-sm transition-colors",
                        draft.icon === ic
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-transparent hover:bg-muted",
                      )}
                      onClick={() => setDraft(d => ({ ...d, icon: ic }))}
                    >
                      <i className={cn("fa-light", ic)} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
              <KbdGroup className="ms-1.5"><Kbd variant="bare">Esc</Kbd></KbdGroup>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createDisabled}
            >
              <i className="fa-light fa-folder text-[13px]" aria-hidden="true" />
              {customizingFolder ? "Update folder" : "Create folder"}
              <KbdGroup className="ms-1.5"><Kbd variant="bare">⏎</Kbd></KbdGroup>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
