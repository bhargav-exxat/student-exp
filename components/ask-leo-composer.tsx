"use client"

/**
 * AskLeoComposer — ChatGPT-style composer:
 * - Compact: one row (`+ | input | mic send` pill).
 * - Wrapped: full-width text row, icons on a footer row (text never runs beside mic).
 * - Autosize via scrollHeight (no grow-wrap / field-sizing conflicts).
 */

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { DictationSoundwave } from "@/components/dictation-soundwave"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SearchRecentsPopover } from "@/components/search-recents-popover"
import { useSpeechDictation } from "@/hooks/use-speech-dictation"
import type { DedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"
import { processDictationTranscript } from "@/lib/dictation-transcript"
import { cn } from "@/lib/utils"

const GHOST_ICON_BTN =
  "icon-button-chrome size-9 shrink-0 rounded-full hover:bg-accent hover:text-interactive-hover-foreground"

/** Matches `--exxat-composer-max-height: 13rem` in exxat-composer.css */
const COMPOSER_MAX_HEIGHT_PX = 208

export interface AskLeoComposerSearchRecents {
  recents: Pick<DedicatedSearchRecentsController, "read" | "clear" | "eventName">
  onSelect: (query: string) => void
}

export interface AskLeoComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (message: string) => void
  placeholder?: string
  animatedPlaceholders?: string[]
  animatedPlaceholderIntervalMs?: number
  animatedPlaceholderMaxLines?: 1 | 2
  leadingSlot?: "attachments" | "ai-mark"
  inputLabel?: string
  submitButtonAriaLabel?: string
  submitAppearance?: "send" | "search"
  onExpandedChange?: (expanded: boolean) => void
  searchRecents?: AskLeoComposerSearchRecents
  dictationDisabled?: boolean
  isAnalyzing?: boolean
  onStop?: () => void
  composerShellClassName?: string
  shellMaxWidth?: "2xl" | "full"
  className?: string
}

export const AskLeoComposer = React.forwardRef<HTMLTextAreaElement, AskLeoComposerProps>(
  function AskLeoComposer(
    {
      value,
      onChange,
      onSubmit,
      placeholder = "Ask Leo anything…",
      className,
      composerShellClassName,
      onExpandedChange,
      animatedPlaceholders,
      animatedPlaceholderIntervalMs = 4200,
      animatedPlaceholderMaxLines = 1,
      leadingSlot = "attachments",
      inputLabel = "Message to Leo",
      submitButtonAriaLabel = "Send message",
      submitAppearance = "send",
      searchRecents,
      dictationDisabled = false,
      isAnalyzing = false,
      onStop,
      shellMaxWidth = "full",
    },
    forwardedRef,
  ) {
    const [isWrapped, setIsWrapped] = React.useState(false)
    const [isOverflowing, setIsOverflowing] = React.useState(false)
    const [showBottomFade, setShowBottomFade] = React.useState(false)
    const [recentsOpen, setRecentsOpen] = React.useState(false)
    const [recentItems, setRecentItems] = React.useState<string[]>([])
    const [dictationError, setDictationError] = React.useState<string | null>(null)
    const reduceMotion = useReducedMotion()
    const fieldId = React.useId()
    const dictationBaseRef = React.useRef("")
    const innerRef = React.useRef<HTMLTextAreaElement>(null)
    const singleLineHeightRef = React.useRef(24)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const onExpandedChangeRef = React.useRef(onExpandedChange)
    onExpandedChangeRef.current = onExpandedChange

    const applyWrapped = React.useCallback((next: boolean | ((prev: boolean) => boolean)) => {
      setIsWrapped(prev => {
        const resolved = typeof next === "function" ? next(prev) : next
        if (resolved !== prev) onExpandedChangeRef.current?.(resolved)
        return resolved
      })
    }, [])

    const phrases = React.useMemo(
      () =>
        (animatedPlaceholders ?? []).flatMap(s => {
          const trimmed = s.trim()
          return trimmed ? [trimmed] : []
        }),
      [animatedPlaceholders],
    )
    const [phraseIndex, setPhraseIndex] = React.useState(0)

    const syncComposerLayout = React.useCallback((text: string) => {
      const textarea = innerRef.current
      if (!textarea) {
        applyWrapped(text.includes("\n"))
        return
      }

      textarea.style.minHeight = "0"
      textarea.style.height = "0px"
      const scrollHeight = textarea.scrollHeight
      const cappedHeight = Math.min(scrollHeight, COMPOSER_MAX_HEIGHT_PX)
      textarea.style.height = `${cappedHeight}px`

      const overflowing = scrollHeight > COMPOSER_MAX_HEIGHT_PX
      setIsOverflowing(overflowing)

      if (overflowing) {
        textarea.scrollTop = textarea.scrollHeight
      }
      setShowBottomFade(overflowing && textarea.scrollTop > 4)

      if (!text.trim()) {
        singleLineHeightRef.current = scrollHeight
        applyWrapped(false)
        return
      }

      if (text.includes("\n")) {
        applyWrapped(true)
        return
      }

      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24
      const lineCount = Math.max(1, Math.round(scrollHeight / lineHeight))
      const baseline = singleLineHeightRef.current || lineHeight
      const wrappedNow = lineCount > 1 || scrollHeight > baseline + 2

      // Stay wrapped once multiline — full-width reflow can collapse line count
      // back to 1 and would otherwise flip to compact with centered icons.
      applyWrapped(wasWrapped => wrappedNow || wasWrapped)
    }, [applyWrapped])

    const updateScrollFade = React.useCallback(() => {
      const textarea = innerRef.current
      if (!textarea) return
      const overflowing = textarea.scrollHeight > COMPOSER_MAX_HEIGHT_PX
      const atBottom = textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight - 4
      setShowBottomFade(overflowing && !atBottom)
    }, [])

    const appendDictation = React.useCallback(
      (chunk: string, isFinal: boolean) => {
        if (!chunk && !isFinal) return
        const base = dictationBaseRef.current
        const next = processDictationTranscript(base, chunk, isFinal)
        if (isFinal) {
          dictationBaseRef.current = next
        }
        onChange(next)
      },
      [onChange],
    )

    const {
      isSupported: dictationSupported,
      isListening,
      waveformLevels,
      start: startDictation,
      stop: stopDictation,
    } = useSpeechDictation({
      onTranscript: appendDictation,
      onError: () => {
        setDictationError("Could not capture speech. Check microphone permissions and try again.")
      },
    })

    const beginDictation = React.useCallback(() => {
      if (!dictationSupported || dictationDisabled || isAnalyzing) return
      setRecentsOpen(false)
      setDictationError(null)
      dictationBaseRef.current = value
      void startDictation()
    }, [dictationDisabled, dictationSupported, isAnalyzing, startDictation, value])

    const finishDictation = React.useCallback(() => {
      stopDictation()
    }, [stopDictation])

    const canSend = Boolean(value.trim())

    const showAnimatedPlaceholder =
      phrases.length > 0 && !value.trim() && !isWrapped && !isListening

    React.useEffect(() => {
      if (!showAnimatedPlaceholder) return
      const id = window.setInterval(() => {
        setPhraseIndex(i => (i + 1) % phrases.length)
      }, animatedPlaceholderIntervalMs)
      return () => window.clearInterval(id)
    }, [showAnimatedPlaceholder, phrases.length, animatedPlaceholderIntervalMs])

    React.useEffect(() => {
      if (!showAnimatedPlaceholder) setPhraseIndex(0)
    }, [showAnimatedPlaceholder])

    React.useEffect(() => {
      if (!searchRecents) return
      const sync = () => setRecentItems(searchRecents.recents.read())
      sync()
      window.addEventListener(searchRecents.recents.eventName, sync)
      window.addEventListener("storage", sync)
      return () => {
        window.removeEventListener(searchRecents.recents.eventName, sync)
        window.removeEventListener("storage", sync)
      }
    }, [searchRecents])

    React.useEffect(() => {
      if ((dictationDisabled || isAnalyzing) && isListening) {
        stopDictation({ playRelease: false })
      }
    }, [dictationDisabled, isAnalyzing, isListening, stopDictation])

    const dictationHotkeyRef = React.useRef<(e: KeyboardEvent) => void>(() => {})
    dictationHotkeyRef.current = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return
      if ((e.key === "m" || e.key === "M") && dictationSupported && !dictationDisabled && !isAnalyzing) {
        e.preventDefault()
        if (isListening) finishDictation()
        else beginDictation()
      }
    }

    React.useEffect(() => {
      const listener = (e: KeyboardEvent) => dictationHotkeyRef.current(e)
      window.addEventListener("keydown", listener)
      return () => window.removeEventListener("keydown", listener)
    }, [])

    React.useLayoutEffect(() => {
      syncComposerLayout(value)
    }, [value, isWrapped, syncComposerLayout])

    const setTextareaRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
        }
      },
      [forwardedRef],
    )

    function handleShellMouseDown(e: React.MouseEvent<HTMLDivElement>) {
      const target = e.target as HTMLElement
      if (target.closest("button, a, input, textarea, [role='button']")) return
      e.preventDefault()
      innerRef.current?.focus()
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      if (isListening) stopDictation({ playRelease: false })
      const trimmed = value.trim()
      if (!trimmed) return
      onSubmit?.(trimmed)
      onChange("")
      setIsWrapped(false)
      setIsOverflowing(false)
      setShowBottomFade(false)
      if (innerRef.current) {
        innerRef.current.style.height = "0px"
      }
    }

    function handleTextareaScroll() {
      updateScrollFade()
    }

    function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      if (isListening) stopDictation({ playRelease: false })
      onChange(e.target.value)
      syncComposerLayout(e.target.value)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    }

    function openComposerRecentsOnFocus() {
      if (!isListening && !value.trim() && recentItems.length > 0) {
        setRecentsOpen(true)
      }
    }

    function dismissComposerRecentsOnBlur() {
      window.setTimeout(() => setRecentsOpen(false), 120)
    }

    const leadingActions =
      leadingSlot === "ai-mark" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              role="img"
              aria-label="AI search"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <i
                className="fa-light fa-star-christmas text-lg text-[color:var(--brand-color-dark)] dark:text-[color:var(--brand-color-light)]"
                aria-hidden="true"
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="text-xs">
            AI search
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={GHOST_ICON_BTN}
                  aria-label="Add attachments"
                >
                  <i className="fa-light fa-plus text-lg leading-none" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-xs text-xs">
              Add photos, files, and more
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="max-w-xs rounded-2xl p-1.5">
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem
                className="flex items-center gap-2 rounded-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fa-light fa-paperclip w-4 shrink-0 text-center opacity-60" aria-hidden="true" />
                Add photos &amp; files
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-md" onClick={() => {}}>
                <i className="fa-light fa-robot w-4 shrink-0 text-center opacity-60" aria-hidden="true" />
                Agent mode
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-md" onClick={() => {}}>
                <i
                  className="fa-light fa-magnifying-glass w-4 shrink-0 text-center opacity-60"
                  aria-hidden="true"
                />
                Deep Research
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

    const trailingActions = (
      <>
        {isListening ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                className="h-9 shrink-0 gap-2 rounded-full border-2 border-brand/70 bg-brand px-3.5 text-[color:var(--brand-foreground)] shadow-sm hover:bg-brand/90"
                onClick={finishDictation}
                aria-label="Stop dictation"
              >
                <DictationSoundwave levels={waveformLevels} className="w-auto min-w-0 flex-none" aria-hidden />
                <span className="text-sm font-medium">Stop</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="text-xs">
              Stop dictation
            </TooltipContent>
          </Tooltip>
        ) : null}

        {!isAnalyzing && !isListening && !dictationDisabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!dictationSupported}
                className={cn(GHOST_ICON_BTN, !dictationSupported && "opacity-40")}
                aria-label="Start dictation"
                onClick={beginDictation}
              >
                <i className="fa-light fa-microphone text-lg leading-none" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="flex items-center gap-1.5 text-xs">
              {!dictationSupported ? (
                "Dictation is not supported in this browser"
              ) : (
                <>
                  Dictate <Kbd>M</Kbd>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {isAnalyzing ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                className="size-9 shrink-0 rounded-full"
                onClick={() => onStop?.()}
                aria-label="Stop generating"
              >
                <i className="fa-solid fa-stop text-lg italic" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="flex items-center gap-1.5 text-xs">
              Stop <Kbd>Esc</Kbd>
            </TooltipContent>
          </Tooltip>
        ) : !isListening ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                className="size-9 shrink-0 rounded-full"
                disabled={!canSend}
                aria-label={submitButtonAriaLabel}
              >
                <i
                  className={cn(
                    "text-lg leading-none",
                    submitAppearance === "search" ? "fa-light fa-magnifying-glass" : "fa-light fa-arrow-up",
                  )}
                  aria-hidden="true"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="flex items-center gap-1.5 text-xs">
              {submitButtonAriaLabel} <Kbd>↵</Kbd>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </>
    )

    const composerShell = (
      <form
        onSubmit={handleSubmit}
        className="group/composer min-w-0 w-full"
        noValidate
        aria-busy={isAnalyzing}
      >
        <label htmlFor={fieldId} className="sr-only">
          {inputLabel}
        </label>
        {leadingSlot === "attachments" ? (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            aria-label="Attach files"
            onChange={() => {}}
          />
        ) : null}

        {dictationError ? (
          <p className="mb-2 text-xs text-destructive" role="alert">
            {dictationError}
          </p>
        ) : null}

        <div
          role="presentation"
          onMouseDown={handleShellMouseDown}
          data-wrapped={isWrapped ? "" : undefined}
          className={cn(
            "exxat-composer-grid relative grid w-full cursor-text overflow-visible rounded-3xl border border-solid bg-clip-padding p-2.5 shadow-md transition-[background-color,border-color,box-shadow] duration-200 ease-in-out",
            isWrapped ? "exxat-composer-grid--wrapped" : "exxat-composer-grid--compact items-center",
            shellMaxWidth === "2xl" && "mx-auto max-w-2xl",
            "exxat-composer-idle",
            isListening && "exxat-composer-dictating",
            composerShellClassName,
          )}
        >
          {!isWrapped ? (
            <div className="exxat-composer-leading relative z-[2] shrink-0 pl-1">{leadingActions}</div>
          ) : null}

          <div
            className={cn(
              "exxat-composer-primary relative z-[2] min-w-0",
              isWrapped ? "px-2 pb-0.5 pt-0.5" : "px-1.5 -my-2.5",
            )}
          >
            <div
              className={cn(
                "exxat-composer-scroll relative min-w-0 w-full",
                isOverflowing && "exxat-composer-scroll--overflow",
                showBottomFade && "exxat-composer-scroll--fade-top",
              )}
            >
              <textarea
                id={fieldId}
                ref={setTextareaRef}
                value={value}
                onChange={handleTextareaChange}
                onScroll={handleTextareaScroll}
                onKeyDown={handleKeyDown}
                onFocus={openComposerRecentsOnFocus}
                onBlur={dismissComposerRecentsOnBlur}
                placeholder={
                  isListening ? "Listening…" : showAnimatedPlaceholder ? " " : placeholder
                }
                aria-live={isListening ? "polite" : undefined}
                autoComplete="off"
                rows={1}
                className={cn(
                  "exxat-composer-input placeholder-aa block w-full resize-none overflow-x-hidden overflow-y-auto border-0 bg-transparent p-0 text-base leading-[1.5] text-foreground outline-none placeholder:text-placeholder-foreground",
                  isOverflowing && "overscroll-y-contain",
                  showAnimatedPlaceholder && !isListening && "placeholder:text-transparent",
                )}
              />
              {showAnimatedPlaceholder ? (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 flex overflow-hidden",
                    animatedPlaceholderMaxLines === 2
                      ? "min-h-[2.5rem] items-start"
                      : "min-h-[1.5rem] items-center",
                  )}
                  aria-hidden="true"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={phraseIndex}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -3 }}
                      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "block w-full text-start text-base leading-[1.5] text-placeholder-foreground",
                        animatedPlaceholderMaxLines === 2
                          ? "line-clamp-2 whitespace-normal break-words"
                          : "truncate",
                      )}
                    >
                      {phrases[phraseIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ) : null}
            </div>
          </div>

          {isWrapped ? (
            <>
              <div className="exxat-composer-leading relative z-[2] shrink-0 pl-1 pb-0.5">
                {leadingActions}
              </div>
              <div className="exxat-composer-trailing relative z-[2] flex shrink-0 items-center gap-1.5 pb-0.5">
                {trailingActions}
              </div>
            </>
          ) : (
            <div className="exxat-composer-trailing relative z-[2] flex shrink-0 items-center gap-1.5">
              {trailingActions}
            </div>
          )}
        </div>
      </form>
    )

    return (
      <div className={cn("min-w-0 w-full", className)}>
        {searchRecents && recentItems.length > 0 ? (
          <SearchRecentsPopover
            open={recentsOpen}
            onOpenChange={setRecentsOpen}
            items={recentItems}
            onSelect={searchRecents.onSelect}
            onClear={() => searchRecents.recents.clear()}
            anchor={composerShell}
          />
        ) : (
          composerShell
        )}
      </div>
    )
  },
)
