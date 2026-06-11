"use client"

/**
 * LeoThinkingBackdrop — ambient thinking chrome from Leo AI Q2:
 * gradient blobs (rest vs thinking tempo) + drifting dot cloud overlay.
 */

import * as React from "react"

import {
  AnimatedBlobBackground,
  type BlobIntensity,
} from "@/components/animated-blob-background"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { cn } from "@/lib/utils"

export type LeoThinkingBackdropProps = {
  /** Show blob layer (disable on very small surfaces if needed). */
  blobsEnabled?: boolean
  /** Faster blob drift while the model is working. */
  thinking?: boolean
  /** Drifting dot pattern overlay. */
  dotsActive?: boolean
  /** `high` on empty hero; `normal` in conversation. */
  intensity?: BlobIntensity
  /**
   * `landing` — blobs anchor under the hero composer when idle.
   * `panel` — blobs fill the aside (Ask Leo sidebar).
   */
  variant?: "landing" | "panel"
  className?: string
}

export function LeoThinkingBackdrop({
  blobsEnabled = true,
  thinking = false,
  dotsActive = false,
  intensity = "normal",
  variant = "landing",
  className,
}: LeoThinkingBackdropProps) {
  const hasConversation = intensity === "normal"
  const showDots = dotsActive

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {blobsEnabled ? (
        <div
          className={cn(
            "leo-ai-blob-layer absolute inset-x-0 z-0 motion-reduce:transition-none",
            variant === "landing" && !hasConversation
              ? "leo-ai-blob-layer--idle-anchor bottom-0 top-auto opacity-100"
              : "inset-0",
            thinking && "opacity-80 transition-opacity duration-700 ease-out",
            !thinking && hasConversation && "opacity-60 transition-opacity duration-700 ease-out",
            !thinking && !hasConversation && "opacity-100",
          )}
        >
          <AnimatedBlobBackground
            enabled
            intensity={intensity}
            thinking={thinking}
          />
        </div>
      ) : null}
      <AiThinkingOverlay
        active={showDots}
        fillClassName="fill-brand/25 dark:fill-brand/35"
        className="z-[1]"
      />
    </div>
  )
}
