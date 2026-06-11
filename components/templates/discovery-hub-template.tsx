"use client"

import * as React from "react"
import { Link } from "@/lib/router-compat"
import { useRouter } from "@/lib/router-compat"

import { useAskLeo } from "@/components/ask-leo-sidebar"
import { PrimaryPageTemplate, type PrimaryPageTemplateProps } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tip } from "@/components/ui/tip"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import type { DiscoveryHubSearchGroup, DiscoveryHubSearchItem } from "@/lib/discovery-hub"

export interface DiscoveryHubPrimaryAction {
  label: string
  onClick: () => void
  shortcutKeys?: string
}

export interface DiscoveryHubAskLeoPromo {
  title: string
  description: string
  prompts: readonly string[]
}

export interface DiscoveryHubTemplateProps
  extends Pick<PrimaryPageTemplateProps, "siteHeader" | "maxWidthClassName" | "contentClassName" | "bodyClassName"> {
  title: string
  description: string
  inputPlaceholder: string
  inputAriaLabel: string
  emptyMessage: string
  groups: DiscoveryHubSearchGroup[]
  primaryAction: DiscoveryHubPrimaryAction
  askLeoPromo: DiscoveryHubAskLeoPromo
  browseLibraryHref: string
  browseLibraryLabel?: string
}

const DiscoveryHubSearchRow = React.memo(function DiscoveryHubSearchRow({
  item,
  onLink,
  onLeo,
}: {
  item: DiscoveryHubSearchItem
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
})

/**
 * Discovery hub — centered command-style natural language search, create CTA, and Ask Leo promo.
 * Hubs can pass `groups` from a domain module (e.g. Ask Leo prompt suggestions from `lib/library-hub-search.ts`).
 */
export function DiscoveryHubTemplate({
  title,
  description,
  inputPlaceholder,
  inputAriaLabel,
  emptyMessage,
  groups,
  primaryAction,
  askLeoPromo,
  browseLibraryHref,
  browseLibraryLabel = "Browse library",
  siteHeader,
  maxWidthClassName = "max-w-3xl",
  contentClassName,
  bodyClassName,
}: DiscoveryHubTemplateProps) {
  const router = useRouter()
  const { openWithPrompt, toggle } = useAskLeo()
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  const [inputValue, setInputValue] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const navigate = React.useCallback(
    (href: string) => {
      setInputValue("")
      router.push(href)
    },
    [router],
  )

  const sendLeoSuggestion = React.useCallback(
    (prompt: string) => {
      setInputValue("")
      openWithPrompt(prompt)
    },
    [openWithPrompt],
  )

  React.useEffect(() => {
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [])

  const trimmedQuery = inputValue.trim()
  const leoShortcut = `${mod}${alt}K`
  const createShortcut = primaryAction.shortcutKeys ?? `${mod}${alt}N`

  return (
    <PrimaryPageTemplate
      siteHeader={siteHeader}
      maxWidthClassName={maxWidthClassName}
      contentClassName={contentClassName}
      bodyClassName={bodyClassName}
    >
      <Shortcut keys={createShortcut} onInvoke={primaryAction.onClick} />
      {/* ⌘⌥K (Ask Leo toggle) is bound globally in AskLeoProvider — do not double-bind here. */}

      <div className="flex min-h-0 flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto flex w-full min-w-0 flex-1 flex-col gap-8">
          <header className="space-y-2 text-center">
            <h1
              className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
          </header>

          <section
            aria-label="Natural language search"
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/10"
          >
            <Command
              loop
              label={inputAriaLabel}
              className="rounded-2xl border-0 bg-transparent p-0 shadow-none"
            >
              <div className="flex min-h-14 items-center gap-3 border-b border-border/50 px-4 md:min-h-16 md:px-5">
                <CommandInput
                  ref={searchInputRef}
                  variant="palette"
                  aria-label={inputAriaLabel}
                  onValueChange={setInputValue}
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  className="h-14 text-base md:h-16 md:text-lg"
                />
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  <KbdGroup>
                    <Kbd>{mod}</Kbd>
                    <Kbd>K</Kbd>
                  </KbdGroup>
                  <span className="ms-1.5">global search</span>
                </span>
              </div>

              <CommandList className="max-h-[min(420px,50vh)] py-2">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                {groups.map(group => {
                  if (group.items.length === 0) return null
                  if (group.searchOnly && !trimmedQuery) return null
                  return (
                    <CommandGroup key={group.id} heading={group.heading}>
                      {group.items.map(item => (
                        <DiscoveryHubSearchRow
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
          </section>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <section
              aria-labelledby="discovery-hub-ask-leo"
              className="rounded-2xl border border-brand/20 bg-brand/5 p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 id="discovery-hub-ask-leo" className="text-sm font-semibold text-foreground">
                    {askLeoPromo.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{askLeoPromo.description}</p>
                </div>
                <Tip
                  label={(
                    <span className="inline-flex items-center gap-1.5">
                      Ask Leo
                      <KbdGroup>
                        <Kbd>{mod}</Kbd>
                        <Kbd>{alt}</Kbd>
                        <Kbd>K</Kbd>
                      </KbdGroup>
                    </span>
                  )}
                >
                  <Button type="button" variant="outline" size="sm" onClick={toggle}>
                    <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
                    Ask Leo
                    <KbdGroup className="ms-1.5 hidden sm:inline-flex">
                      <Kbd variant="bare">{leoShortcut}</Kbd>
                    </KbdGroup>
                  </Button>
                </Tip>
              </div>
              <ul className="mt-4 flex flex-col gap-2" role="list">
                {askLeoPromo.prompts.map(prompt => (
                  <li key={prompt}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal px-3 py-2.5 text-left text-sm font-normal"
                      onClick={() => sendLeoSuggestion(prompt)}
                    >
                      <i className="fa-light fa-sparkles me-2 shrink-0 text-brand" aria-hidden="true" />
                      <span>{prompt}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-2 md:min-w-[14rem]">
              <Button type="button" size="lg" className="w-full" onClick={primaryAction.onClick}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                {primaryAction.label}
                <KbdGroup className="ms-1.5">
                  <Kbd variant="bare">{createShortcut}</Kbd>
                </KbdGroup>
              </Button>
              <Button type="button" variant="outline" size="lg" className="w-full" asChild>
                <Link href={browseLibraryHref}>
                  <i className="fa-light fa-table-list" aria-hidden="true" />
                  {browseLibraryLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PrimaryPageTemplate>
  )
}
