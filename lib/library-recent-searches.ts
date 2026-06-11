import { createDedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"

const controller = createDedicatedSearchRecentsController("library", {
  storageKey: "exxat-ds.library.recent-searches.v1",
  eventName: "exxat-library-recent-searches",
})

export const LIBRARY_RECENT_SEARCHES_EVENT = controller.eventName

export const libraryDedicatedSearchRecents = controller

export function readLibraryRecentSearches(): string[] {
  return controller.read()
}

export function recordLibraryRecentSearch(query: string): void {
  controller.record(query)
}

export function clearLibraryRecentSearches(): void {
  controller.clear()
}
