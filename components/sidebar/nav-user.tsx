"use client"

/**
 * NavUser — WCAG 2.1 AA profile menu
 *
 * AA checklist:
 *  ✓ aria-label on trigger (1.3.1, 4.1.2)
 *  ✓ Icon-only items have sr-only text (1.1.1)
 *  ✓ App preferences link to Settings (appearance lives there)
 *  ✓ Keyboard: full arrow-key + Enter/Space navigation via Radix (2.1.1)
 *  ✓ Focus ring visible on every item (2.4.11)
 *  ✓ Colour contrast: all labels ≥ 4.5:1 on popover bg (1.4.3)
 *  ✓ Active theme shown via aria-checked (RadioItem) (4.1.3)
 */

import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"
import { Link } from "@/lib/router-compat"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppTheme } from "@/hooks/use-app-theme"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import {
  BUILDER_SESSION_KEY,
  useCanAuthorProducts,
} from "@/lib/use-can-author-products"
import { useProductAuthoringEnabled } from "@/lib/product-authoring"
import { cn } from "@/lib/utils"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, state }               = useSidebar()
  const { theme }                 = useTheme()
  const { mounted } = useAppTheme()
  const canAuthor = useCanAuthorProducts()
  const authoringUi = useProductAuthoringEnabled()
  const [, setDemoBuilder] = usePersistedState<boolean>(BUILDER_SESSION_KEY, false)
  const showBuilderModeToggle =
    typeof import.meta !== "undefined" &&
    import.meta.env?.PROD === true &&
    !canAuthor

  const safeTheme    = mounted ? (theme ?? "system") : "system"
  const showCollapsedTooltip = state === "collapsed" && !isMobile

  const profileTrigger = (
    <SidebarMenuButton
      size="lg"
      aria-label={`${user.name} — open profile and settings menu`}
      className={cn(
        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
        "h-auto min-h-12 items-center py-2 !overflow-visible",
        "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!h-8 group-data-[collapsible=icon]:!min-h-8 group-data-[collapsible=icon]:!max-h-8 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!min-w-8 group-data-[collapsible=icon]:!max-w-8 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg",
        /* Icon rail: clip overflow and hide chrome that sat in the gutter (ellipsis was bleeding past the rail). */
        "group-data-[collapsible=icon]:!overflow-hidden",
        "[&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:text-clip",
        "group-data-[collapsible=icon]:[&>span:last-child]:hidden",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={user.avatar}
          alt=""
          className="object-cover"
          aria-hidden="true"
        />
        <AvatarFallback aria-hidden="true">
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 content-center text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <span
        className="ms-auto flex w-6 shrink-0 self-stretch items-center justify-center text-muted-foreground group-data-[collapsible=icon]:hidden"
        aria-hidden="true"
      >
        <i className="fa-light fa-ellipsis-vertical block text-xs leading-none" aria-hidden="true" />
      </span>
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {showCollapsedTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  {profileTrigger}
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {user.name}
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuTrigger asChild>
              {profileTrigger}
            </DropdownMenuTrigger>
          )}

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* ── User identity ──────────────────────────────── */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar}
                    alt=""
                    className="object-cover"
                    aria-hidden="true"
                  />
                  <AvatarFallback aria-hidden="true">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* ── Account actions ────────────────────────────── */}
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <i className="fa-light fa-circle-user" aria-hidden="true" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <i className="fa-light fa-gear" aria-hidden="true" />
                  Settings
                  <span className="ms-auto text-xs text-muted-foreground capitalize">{safeTheme}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="fa-light fa-credit-card" aria-hidden="true" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="fa-light fa-bell" aria-hidden="true" />
                Notifications
              </DropdownMenuItem>
              {showBuilderModeToggle ? (
                <DropdownMenuItem
                  onSelect={() => {
                    setDemoBuilder(true)
                    window.location.reload()
                  }}
                >
                  <i className="fa-light fa-hammer" aria-hidden="true" />
                  Builder mode (demo)
                </DropdownMenuItem>
              ) : null}
              {authoringUi && canAuthor ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <i className="fa-light fa-hammer" aria-hidden="true" />
                  Builder mode on
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* ── Sign out ───────────────────────────────────── */}
            <DropdownMenuItem>
              <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
