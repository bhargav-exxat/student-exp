"use client"

import * as React from "react"
import { ProductProvider } from "@/contexts/product-context"
import { useCanAuthorProducts } from "@/lib/use-can-author-products"

/** Wires builder vs end-user authoring into the DS shell. */
export function ProductProviderRoot({
  children,
}: {
  children: React.ReactNode
}) {
  const canAuthor = useCanAuthorProducts()
  return <ProductProvider authoring={canAuthor}>{children}</ProductProvider>
}
