"use client"

import { SecondaryPanelHubActivator } from "@/components/templates/secondary-panel-hub-template"

/** Opens the Library secondary panel while this route is mounted. */
export function LibraryPanelActivator() {
  return <SecondaryPanelHubActivator panelId="library" />
}
