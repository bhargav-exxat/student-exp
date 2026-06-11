"use client"

/**
 * CommandMenu — ⌘K palette shell (Dialog + Command). Data comes from `CommandMenuProvider`
 * (`lib/command-menu-config.ts`); no hard-coded nav or copy here.
 */

import { useRouter } from "@/lib/router-compat"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useAskLeo } from "@/components/ask-leo-sidebar"
import { useCommandMenuConfig } from "@/contexts/command-menu-context"
import type { CommandMenuItem } from "@/lib/command-menu-config"

/** Dispatched to open the palette from sidebar and other callers (avoid synthetic ⌘K). */
export const OPEN_COMMAND_MENU_EVENT = "exxat:open-command-menu"

export function requestOpenCommandMenu() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_MENU_EVENT))
}

function CommandMenuItemRow({
  item,
  onLink,
  onLeo,
}: {
  item: CommandMenuItem
  onLink: (href: string) => void
  onLeo: (prompt: string) => void
}) {
  const isLeo = Boolean(item.askLeoPrompt)
  const iconClass = isLeo
    ? "fa-duotone fa-solid fa-star-christmas w-5 shrink-0 text-center text-brand"
    : `${item.icon ?? "fa-light fa-arrow-right"} w-5 shrink-0 text-center`

  return (
    <CommandItem
      className="mx-2 rounded-lg py-2.5"
      keywords={item.keywords ? [item.keywords] : undefined}
      onSelect={() => {
        if (item.askLeoPrompt) onLeo(item.askLeoPrompt)
        else if (item.href) onLink(item.href)
      }}
    >
      <i className={iconClass} aria-hidden="true" />
      <span>{item.label}</span>
    </CommandItem>
  )
}

export function CommandMenu() {
  const config = useCommandMenuConfig()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { openWithPrompt } = useAskLeo()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const onOpenRequest = () => setOpen(true)
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, onOpenRequest)
    return () => window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onOpenRequest)
  }, [])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      setInputValue("")
      router.push(href)
    },
    [router],
  )

  const sendLeoSuggestion = useCallback(
    (prompt: string) => {
      setOpen(false)
      setInputValue("")
      openWithPrompt(prompt)
    },
    [openWithPrompt],
  )

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setInputValue("")
      }}
      open={open}
    >
      <DialogContent
        overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          requestAnimationFrame(() => searchInputRef.current?.focus())
        }}
        className="max-w-[min(42rem,calc(100%-2rem))] gap-0 overflow-hidden rounded-xl border-border/50 p-0 ring-0 shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand-color)_48%,transparent),0_0_72px_-14px_color-mix(in_oklch,var(--brand-color)_58%,transparent),0_10px_15px_-3px_oklch(0_0_0_/_0.1)] dark:shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand-color)_55%,transparent),0_0_80px_-12px_color-mix(in_oklch,var(--brand-color)_65%,transparent),0_10px_15px_-3px_oklch(0_0_0_/_0.35)] sm:max-w-3xl md:max-w-4xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{config.dialogTitle}</DialogTitle>
          <DialogDescription>{config.dialogDescription}</DialogDescription>
        </DialogHeader>
        <Command
          loop
          label={config.commandLabel}
          className="flex h-full w-full flex-col overflow-hidden bg-popover p-0"
        >
          <div className="flex h-12 items-center gap-2 border-border/50 border-b px-4">
            <CommandInput
              ref={searchInputRef}
              variant="palette"
              aria-label={config.inputAriaLabel}
              onValueChange={setInputValue}
              placeholder={config.inputPlaceholder}
              value={inputValue}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              tabIndex={-1}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={config.closeMenuAriaLabel}
              onClick={() => setOpen(false)}
            >
              <Kbd>Esc</Kbd>
            </Button>
          </div>

          <CommandList className="max-h-[min(640px,72vh)] py-2">
            <CommandEmpty>{config.emptyMessage}</CommandEmpty>

            {config.groups.map((group) => {
              if (group.items.length === 0) return null
              if (group.searchOnly && !inputValue.trim()) return null
              return (
                <CommandGroup key={group.id} heading={group.heading}>
                  {group.items.map((item) => (
                    <CommandMenuItemRow
                      key={item.id}
                      item={item}
                      onLeo={sendLeoSuggestion}
                      onLink={navigate}
                    />
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
