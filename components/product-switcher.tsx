"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ExxatProductLogo, ExxatProductMark } from "@/components/exxat-product-logo"
import { useProduct, type Product } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import {
  expandSwitcherProducts,
  resolveActiveSwitcherEntry,
  type SwitcherProductEntry,
} from "@/lib/product-switcher-catalog"

// Exxat One ships as **two siblings** because School-side and Site-side have
// different navs, scope hierarchies, and primary personas — see
// `apps/web/docs/multi-product-routing-pattern.md`. Both share the corporate
// Exxat One wordmark; the `scope` sub-line below the wordmark in the dropdown
// disambiguates them visually for sighted users (the `label` carries the full
// accessible name for screen readers).

export function ProductSwitcher() {
  const { product, customProducts, activeCustomIndex, hiddenProducts } = useProduct()
  const switchProduct = useProductSwitch()
  const { state, isMobile } = useSidebar()

  const products = React.useMemo(
    () => expandSwitcherProducts(customProducts, hiddenProducts),
    [customProducts, hiddenProducts],
  )
  const isCurrentProduct = React.useCallback(
    (entry: SwitcherProductEntry) =>
      entry.id === product &&
      (entry.customIndex === undefined || entry.customIndex === activeCustomIndex),
    [activeCustomIndex, product],
  )
  const current = resolveActiveSwitcherEntry(
    products,
    product,
    activeCustomIndex,
    customProducts,
    isCurrentProduct,
  )
  const iconRail = state === "collapsed" && !isMobile
  const expandedOrMobile = state === "expanded" || isMobile

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "items-start py-2 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                expandedOrMobile &&
                  "h-auto min-h-12 overflow-x-clip overflow-y-visible",
                "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
                iconRail &&
                  "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!min-h-8 group-data-[collapsible=icon]:!max-h-8 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!min-w-8 group-data-[collapsible=icon]:!max-w-8 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:overflow-visible",
              )}
              aria-label={`Current product: ${current.label}. Switch product`}
              suppressHydrationWarning
            >
              {iconRail ? (
                // Collapsed icon-rail product mark — same frame as school avatar.
                <span className="flex size-8 shrink-0 items-center justify-center">
                  <ExxatProductMark
                    product={current.id}
                    previewCustomBrand={
                      current.customIndex !== undefined
                        ? customProducts[current.customIndex]
                        : undefined
                    }
                    className="size-7"
                  />
                </span>
              ) : (
                <>
                  <span
                    className="mt-0.5 flex min-h-8 min-w-0 flex-1 items-center gap-1.5 overflow-x-clip overflow-y-visible"
                    aria-hidden="true"
                  >
                    <ExxatProductLogo
                      product={current.id}
                      variant="mutedSuffix"
                      previewCustomBrand={
                        current.customIndex !== undefined
                          ? customProducts[current.customIndex]
                          : undefined
                      }
                      className="w-auto max-w-[min(100%,260px)]"
                    />
                    {current.scope && (
                      <span className="text-xs font-medium text-muted-foreground">
                        — {current.scope}
                      </span>
                    )}
                  </span>
                  <i
                    className="fa-light fa-chevron-down ms-auto mt-1 inline-flex size-6 shrink-0 items-center justify-center text-xs text-muted-foreground"
                    aria-hidden="true"
                  />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch product
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {products.map(p => (
              <DropdownMenuItem
                key={p.customIndex !== undefined ? `${p.id}-${p.customIndex}` : p.id}
                onClick={() => switchProduct(p.id, p.customIndex)}
                className="gap-2 py-2"
                aria-current={isCurrentProduct(p) ? "true" : undefined}
                aria-label={p.label}
              >
                <ExxatProductLogo
                  product={p.id}
                  variant="mutedSuffix"
                  previewCustomBrand={
                    p.customIndex !== undefined ? customProducts[p.customIndex] : undefined
                  }
                  // h-9 matches the sidebar trigger so the mark renders at the
                  // same 32 px footprint in both contexts. Dropdown rows
                  // accommodate the bump via `py-2` on `DropdownMenuItem`.
                  className="h-9 w-auto shrink-0 max-w-[min(100%,240px)]"
                />
                {p.scope && (
                  <span
                    className="text-xs font-medium text-muted-foreground"
                    aria-hidden="true"
                  >
                    — {p.scope}
                  </span>
                )}
                {isCurrentProduct(p) && (
                  <i
                    className="fa-solid fa-check ms-auto text-brand text-xs"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
