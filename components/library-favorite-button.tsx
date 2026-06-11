"use client"

import type { LibraryItem } from "@/lib/mock/library"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import { isLibraryItemFavorite } from "@/lib/library-nav"

/** Parent must use this class so non-favorited stars show on row/cell hover (`group-hover/favcell`). */
export const LIBRARY_FAVORITE_HOVER_GROUP = "group/favcell"

export function LibraryFavoriteButton({
  row,
  onToggleFavorite,
  stopPropagation = true,
}: {
  row: LibraryItem
  onToggleFavorite: (row: LibraryItem) => void
  stopPropagation?: boolean
}) {
  const fav = isLibraryItemFavorite(row)
  const label = fav ? "Remove from favorites" : "Add to favorites"
  return (
    <Tip side="top" label={label}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-pressed={fav}
        aria-label={label}
        className={cn(
          "shrink-0 rounded-md transition-opacity duration-150",
          fav
            ? "text-amber-600 opacity-100 hover:bg-amber-500/15 hover:text-amber-700"
            : "text-muted-foreground opacity-0 hover:bg-muted hover:text-amber-600 group-hover/favcell:opacity-100 focus-visible:opacity-100",
        )}
        onClick={e => {
          if (stopPropagation) e.stopPropagation()
          onToggleFavorite(row)
        }}
      >
        <i className={cn("text-sm", fav ? "fa-solid fa-star" : "fa-light fa-star")} aria-hidden />
      </Button>
    </Tip>
  )
}
