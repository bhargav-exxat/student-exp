"use client"

import * as React from "react"
import type { CommandMenuConfig } from "@/lib/command-menu-config"

const CommandMenuContext = React.createContext<CommandMenuConfig | null>(null)

export function CommandMenuProvider({
  value,
  children,
}: {
  value: CommandMenuConfig
  children: React.ReactNode
}) {
  return (
    <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>
  )
}

export function useCommandMenuConfig(): CommandMenuConfig {
  const ctx = React.useContext(CommandMenuContext)
  if (!ctx) {
    throw new Error(
      "useCommandMenuConfig must be used within CommandMenuProvider (wrap the app shell and pass command menu config).",
    )
  }
  return ctx
}
