/**
 * Per-series stroke dash patterns for multi-line Recharts — supplements hue (WCAG 1.4.1).
 * Index 0 = solid; later series use distinct patterns so lines stay distinguishable in grayscale / CVD.
 */
export const CHART_LINE_STROKE_DASH = [
  undefined,
  "6 4",
  "2 3",
  "10 3 2 3",
  "8 4 2 4 2 4",
] as const

export function chartLineStrokeDash(seriesIndex: number): string | undefined {
  const i = ((seriesIndex % CHART_LINE_STROKE_DASH.length) + CHART_LINE_STROKE_DASH.length) % CHART_LINE_STROKE_DASH.length
  return CHART_LINE_STROKE_DASH[i] as string | undefined
}
