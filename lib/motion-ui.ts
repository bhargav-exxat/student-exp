/**
 * Motion presets — same spirit as Animate UI (open component distribution:
 * https://animate-ui.com/docs — copy/tweak in-repo, Motion + Tailwind).
 */
export const motionEaseOut = [0.22, 1, 0.36, 1] as const

/** App chrome (sidebar header stack, etc.) — `motion/react` */
export const motionHeaderEnter = {
  duration: 0.22,
  ease: motionEaseOut,
} as const

/**
 * Floating sheet panel timing — implemented in `@exxatdesignux/ui` `Sheet`
 * (`duration-300 ease-out`) so Export, Properties, and invite panels animate consistently.
 */
export const motionSheetMs = 300
