/**
 * Shared coach-mark step for **Data** view dashboard — Edit layout (Placements, Team, Compliance).
 * Targets the toolbar pen-ruler control (`aria-label="Edit dashboard layout"`).
 */

import type { CoachMarkStep } from "@/hooks/use-coach-mark"

export const DASHBOARD_CUSTOMIZE_COACH_STEPS: CoachMarkStep[] = [
  {
    id: "dashboard-customize-edit",
    target: "[aria-label='Edit dashboard layout']",
    side: "bottom",
    align: "end",
    title: "Customize your dashboard",
    description:
      "Turn on Edit layout to drag widgets, change chart types, resize to full width, and show or hide cards. Changes save automatically for this hub.",
  },
]
