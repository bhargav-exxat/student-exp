import { useSearchParams } from "react-router-dom"

import { NewLibraryItemForm } from "@/components/new-library-item-form"
import {
  DEFAULT_LIBRARY_FOLDERS,
  type LibraryFolder,
} from "@/lib/mock/library-folders"
import { generateDraftQuestionId } from "@/lib/library-authoring"
import { newQuestionBackNav } from "@/lib/library-nav"

/**
 * `/library/new` — reads `?folderId=...` via `useSearchParams()` and passes
 * the same prop shape down to `NewLibraryItemForm`.
 */
export default function NewQuestionPage() {
  const [searchParams] = useSearchParams()
  const folders: LibraryFolder[] = DEFAULT_LIBRARY_FOLDERS

  const requested = searchParams.get("folderId") ?? undefined
  const matched = requested ? folders.find(f => f.id === requested) : undefined
  const defaultFolderId = matched?.id

  const back = newQuestionBackNav(folders, defaultFolderId)
  const draftQuestionId = generateDraftQuestionId()

  return (
    <NewLibraryItemForm
      draftQuestionId={draftQuestionId}
      defaultFolderId={defaultFolderId}
      backHref={back.href}
      backLabel={back.label}
      folders={folders}
    />
  )
}
