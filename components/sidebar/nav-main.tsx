"use client"

import { usePathname } from "@/lib/router-compat"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    /** Solid-weight icon shown when this item is the active route */
    iconActive?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            /* Active when pathname exactly matches or is a sub-route of item.url */
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url + "/"))

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  aria-current={isActive ? "page" : undefined}
                  asChild
                >
                  <a href={item.url}>
                    {/* Fixed-size wrapper so FA icons align like Lucide icons */}
                    <span className="size-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                      {isActive && item.iconActive ? item.iconActive : item.icon}
                    </span>
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
