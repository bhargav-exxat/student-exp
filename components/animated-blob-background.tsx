"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import { cn } from "@/lib/utils"

export type BlobIntensity = "high" | "normal"

export type AnimatedBlobBackgroundProps = {
  className?: string
  intensity?: BlobIntensity
  /** When false, unmounts entirely (saves GPU while Leo is hidden). */
  enabled?: boolean
  /** When true, blobs animate faster (thinking / analyzing). */
  thinking?: boolean
}

export function AnimatedBlobBackground({
  className,
  intensity = "normal",
  enabled = true,
  thinking = false,
}: AnimatedBlobBackgroundProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  if (!enabled) return null

  const animateFloat = !reduceMotion
  const isIntro = intensity === "high"
  const baseOpacity = isIntro ? 1 : isDark ? 0.55 : 0.85

  return (
    <div
      data-intensity={intensity}
      className={cn(
        "leo-ai-blob-root pointer-events-none absolute inset-0 z-0 overflow-hidden",
        thinking && "leo-ai-blob-thinking",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 top-0 mx-auto max-w-[600px]",
          animateFloat && "leo-ai-blob-spread",
        )}
      >
        <div
          className={cn(
            "leo-ai-blob leo-ai-blob-1 absolute rounded-full blur-3xl",
            animateFloat && "leo-ai-blob-1--animate",
          )}
          style={{
            bottom: "-5%",
            left: "-5%",
            width: "min(480px, 90vw)",
            height: "min(480px, 90vw)",
            opacity: baseOpacity,
          }}
        />
        <div
          className={cn(
            "leo-ai-blob leo-ai-blob-2 absolute rounded-full blur-3xl",
            animateFloat && "leo-ai-blob-2--animate",
          )}
          style={{
            bottom: "-8%",
            right: "-5%",
            width: "min(460px, 85vw)",
            height: "min(460px, 85vw)",
            opacity: isIntro ? 1 : isDark ? 0.5 : 0.82,
          }}
        />
        <div
          className={cn(
            "leo-ai-blob leo-ai-blob-3 absolute rounded-full blur-3xl",
            animateFloat && "leo-ai-blob-3--animate",
          )}
          style={{
            bottom: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(420px, 80vw)",
            height: "min(420px, 80vw)",
            opacity: isIntro ? 1 : isDark ? 0.5 : 0.85,
          }}
        />
      </div>
    </div>
  )
}
