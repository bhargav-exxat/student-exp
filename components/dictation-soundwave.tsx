"use client"

import { WAVE_BAR_COUNT } from "@/hooks/use-speech-dictation"
import { cn } from "@/lib/utils"

const BAR_MAX_PX = 16
const BAR_MIN_SCALE = 0.28

export interface DictationSoundwaveProps {
  levels?: number[]
  className?: string
  "aria-hidden"?: boolean
}

/** Four pill bars in the Stop button — each driven by its own mic level. */
export function DictationSoundwave({
  levels,
  className,
  "aria-hidden": ariaHidden = true,
}: DictationSoundwaveProps) {
  const values = Array.from({ length: WAVE_BAR_COUNT }, (_, i) =>
    Math.min(1, Math.max(0, levels?.[i] ?? 0)),
  )

  return (
    <div
      className={cn("flex h-4 w-auto items-center justify-center gap-[3px]", className)}
      role="status"
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : "Listening to your voice"}
    >
      {values.map((level, i) => {
        const scale = BAR_MIN_SCALE + level * (1 - BAR_MIN_SCALE)
        return (
          <span
            key={i}
            className="w-[3px] shrink-0 rounded-full bg-[color:var(--brand-foreground)]/90 will-change-transform"
            style={{
              height: `${BAR_MAX_PX}px`,
              transform: `scaleY(${scale})`,
              transformOrigin: "center",
              opacity: 0.45 + level * 0.55,
            }}
          />
        )
      })}
    </div>
  )
}
