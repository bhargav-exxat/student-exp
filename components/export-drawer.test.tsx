/**
 * ExportDrawer — render smoke tests
 *
 * Verify the promoted component renders without throwing and exposes the
 * correct accessible structure when open. ExportDrawer is fully controlled
 * (no built-in trigger); it must be wrapped in TooltipProvider.
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ExportDrawer } from "./export-drawer"

function Wrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>
}

describe("ExportDrawer", () => {
  const noop = vi.fn()

  it("renders without throwing when closed", () => {
    expect(() =>
      render(<ExportDrawer open={false} onOpenChange={noop} />, { wrapper: Wrapper }),
    ).not.toThrow()
  })

  it("renders the drawer title when open", () => {
    render(
      <ExportDrawer open onOpenChange={noop} />,
      { wrapper: Wrapper },
    )
    expect(screen.getByRole("heading", { name: /export/i })).toBeDefined()
  })

  it("renders the Export submit button when open", () => {
    render(
      <ExportDrawer open onOpenChange={noop} />,
      { wrapper: Wrapper },
    )
    const buttons = screen.getAllByRole("button", { name: /export/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("renders the Cancel button when open", () => {
    render(
      <ExportDrawer open onOpenChange={noop} />,
      { wrapper: Wrapper },
    )
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined()
  })

  it("renders the date range helper text when open", () => {
    const { baseElement } = render(
      <ExportDrawer open onOpenChange={noop} />,
      { wrapper: Wrapper },
    )
    // The form shows a date range section — confirmed by looking for the "Date range" label
    expect(baseElement.textContent).toMatch(/date range/i)
  })

  it("shows file format options when open", () => {
    render(
      <ExportDrawer open onOpenChange={noop} />,
      { wrapper: Wrapper },
    )
    // The format field renders radio tiles — at least one "CSV" label should be visible
    const csvElements = screen.getAllByText(/csv/i)
    expect(csvElements.length).toBeGreaterThan(0)
  })
})
