"use client"

import * as React from "react"
import { useCallback } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { requestOpenCommandMenu } from "@/components/command-menu"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    key?: string
    title: string
    url: string
    icon: React.ReactNode
    opensCommandMenu?: boolean
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const mod = useModKeyLabel()

  const openCommandMenu = useCallback(() => {
    requestOpenCommandMenu()
  }, [])

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.key ?? item.title}>
              {item.opensCommandMenu ? (
                <SidebarMenuButton onClick={openCommandMenu}>
                  {item.icon}
                  <span>{item.title}</span>
                  <KbdGroup className="ms-auto">
                    <Kbd>{mod}</Kbd>
                    <Kbd>K</Kbd>
                  </KbdGroup>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
