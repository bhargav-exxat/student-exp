"use client"

import * as React from "react"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"
import { useProduct } from "@/contexts/product-context"

/**
 * Keeps `<meta name="theme-color">` in sync with `--theme-color-chrome` in globals.css
 * (brand: theme-one vs theme-prism + light/dark from `html` + ThemeProvider).
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const { product } = useProduct()

  React.useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--theme-color-chrome")
      .trim()
      .replace(/^["']|["']$/g, "")
    if (!raw) return

    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", raw)
  }, [resolvedTheme, product])

  return null
}
