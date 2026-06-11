import { describe, expect, it } from "vitest"

import { CHART_KBD_ACTIVE_BAR, CHART_KBD_ACTIVE_PIE_SHAPE } from "./chart-keyboard-selection"

describe("chart-keyboard-selection", () => {
  it("exports bar active styling for Recharts", () => {
    expect(CHART_KBD_ACTIVE_BAR).toMatchObject({
      stroke: "var(--ring)",
      strokeWidth: 2,
      fillOpacity: 1,
    })
  })

  it("exports pie active shape for Recharts", () => {
    expect(CHART_KBD_ACTIVE_PIE_SHAPE).toMatchObject({
      stroke: "var(--ring)",
      strokeWidth: 3,
    })
  })
})
