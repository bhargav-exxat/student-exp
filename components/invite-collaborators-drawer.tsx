"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { devLog } from "@/lib/dev-log"
import {
  COLLABORATOR_ACCESS_ICON_LIGHT,
  COLLABORATOR_ACCESS_LABELS,
  INVITE_COLLABORATOR_ACCESS_OPTIONS,
  ROSTER_COLLABORATOR_ACCESS_OPTIONS,
  canRemoveCollaboratorFromRoster,
  canSetCollaboratorAccessRole,
  collaboratorRemoveBlockedReason,
  type CollaboratorAccessRole,
  type InviteCollaboratorAccessRole,
} from "@/lib/collaborator-access"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import {
  FLOATING_SHEET_CHROME_CLASS,
  floatingSheetWidthClass,
  useCompactFloatingSheet,
} from "@/lib/floating-sheet-panel"
import { cn } from "@/lib/utils"
import type { PageHeaderCollaborator } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Tip } from "@/components/ui/tip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form"

const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  access: z.enum(["editor", "commenter", "viewer"]),
})

type InviteForm = z.infer<typeof inviteSchema>

export type InviteCollaboratorFormValues = InviteForm

export interface InviteCollaboratorsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collaborators: PageHeaderCollaborator[]
  resourceLabel?: string
  onInvite?: (values: InviteCollaboratorFormValues) => void
  onCollaboratorAccessChange?: (id: string, access: CollaboratorAccessRole) => void
  onCollaboratorRemove?: (id: string) => void
}

function collaboratorAccessLabel(access: PageHeaderCollaborator["access"]) {
  if (!access) return "Viewer"
  return COLLABORATOR_ACCESS_LABELS[access]
}

function isOverlaySelectorSheetTarget(target: EventTarget | null) {
  return (
    target instanceof Element
    && target.closest(
      '[data-slot="popover-content"], [data-slot="popover-trigger"], [data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-trigger"]',
    ) != null
  )
}

function CollaboratorAccessChipSelector({
  value,
  onValueChange,
  options,
  ariaLabel,
  triggerId,
  triggerClassName,
  isOptionDisabled,
}: {
  value: string
  onValueChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  ariaLabel: string
  triggerId?: string
  triggerClassName?: string
  isOptionDisabled?: (value: string) => boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find(option => option.value === value)
  const selectedLabel = selected?.label ?? value
  const selectedIcon = COLLABORATOR_ACCESS_ICON_LIGHT[value as CollaboratorAccessRole]

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={triggerId}
          data-slot="popover-trigger"
          data-variant="secondary"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            badgeVariants({ variant: "secondary" }),
            "font-normal hover:bg-secondary/80",
            triggerClassName,
          )}
        >
          <i className={cn("fa-light", selectedIcon)} aria-hidden="true" />
          {selectedLabel}
          <i
            className="fa-light fa-chevron-down text-muted-foreground"
            data-icon="inline-end"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="z-[90] w-44 p-1"
      >
        <div role="listbox" aria-label={ariaLabel} className="flex flex-col gap-0.5">
          {options.map(option => {
            const isSelected = option.value === value
            const isDisabled = isOptionDisabled?.(option.value) ?? false
            const optionIcon = COLLABORATOR_ACCESS_ICON_LIGHT[option.value as CollaboratorAccessRole]

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled || isSelected) return
                  onValueChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-interactive-hover",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <i className={cn("fa-light", optionIcon, "text-muted-foreground")} aria-hidden="true" />
                <span className="min-w-0 flex-1">{option.label}</span>
                {isSelected ? (
                  <i className="fa-light fa-check text-muted-foreground" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function InviteCollaboratorsDrawer({
  open,
  onOpenChange,
  collaborators,
  resourceLabel = "this library",
  onInvite,
  onCollaboratorAccessChange,
  onCollaboratorRemove,
}: InviteCollaboratorsDrawerProps) {
  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      access: "editor",
    },
  })
  // `useWatch` is memoization-friendly (returns a stable reactive value)
  // unlike `form.watch()`, which the React Compiler can't memoize safely.
  const inviteAccess = useWatch({ control: form.control, name: "access" })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const compactSheet = useCompactFloatingSheet()
  const [removeTarget, setRemoveTarget] = React.useState<PageHeaderCollaborator | null>(null)

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        form.reset()
        setIsSubmitting(false)
        setRemoveTarget(null)
      }
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  function confirmRemove() {
    if (!removeTarget) return
    onCollaboratorRemove?.(removeTarget.id)
    setRemoveTarget(null)
  }

  async function onSubmit(values: InviteForm) {
    setIsSubmitting(true)
    await new Promise(resolve => window.setTimeout(resolve, 600))
    devLog("Invite collaborator:", values)
    onInvite?.(values)
    setIsSubmitting(false)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        data-slot="invite-collaborators-drawer"
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className={cn("z-[80]", FLOATING_SHEET_CHROME_CLASS, floatingSheetWidthClass(compactSheet))}
        style={{ top: "0.5rem", bottom: "0.5rem", right: "0.5rem", height: "calc(100svh - 1rem)" }}
        onPointerDownOutside={event => {
          if (isOverlaySelectorSheetTarget(event.target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={event => {
          if (isOverlaySelectorSheetTarget(event.target)) {
            event.preventDefault()
          }
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
          <SheetTitle className="text-base font-semibold leading-tight">Collaborators</SheetTitle>
          <Tip label="Close" side="bottom">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </Tip>
        </div>

        <p className="px-4 pb-3 text-sm text-muted-foreground -mt-1">
          Manage who can access {resourceLabel}.
        </p>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <Form {...form}>
            <form
              id="invite-collaborators-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <Field data-invalid={!!form.formState.errors.email}>
                      <FieldLabel htmlFor="invite-collaborator-email">Invite by email</FieldLabel>
                      <InputGroup>
                        <FormControl>
                          <InputGroupInput
                            {...field}
                            id="invite-collaborator-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                            aria-required="true"
                            aria-invalid={!!form.formState.errors.email}
                          />
                        </FormControl>
                        <InputGroupAddon align="inline-end">
                          <CollaboratorAccessChipSelector
                            value={inviteAccess}
                            onValueChange={value =>
                              form.setValue("access", value as InviteCollaboratorAccessRole, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })}
                            options={INVITE_COLLABORATOR_ACCESS_OPTIONS}
                            ariaLabel="Access level"
                            triggerId="invite-collaborator-access"
                          />
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>name@example.com</FieldDescription>
                      <FormMessage />
                    </Field>
                  )}
                />
              </FieldGroup>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <i className="fa-light fa-user-plus" aria-hidden="true" />
                    Send invite
                    <KbdGroup className="ms-1.5"><Kbd variant="bare">⏎</Kbd></KbdGroup>
                  </>
                )}
              </Button>
            </form>
          </Form>

          <section aria-labelledby="invite-collaborators-list-heading" className="flex flex-col gap-3">
            <h2
              id="invite-collaborators-list-heading"
              className="text-sm font-medium leading-none"
            >
              People with access
            </h2>
            <ul className="rounded-lg border border-border divide-y divide-border">
              {collaborators.map(person => {
                const access = person.access ?? "viewer"
                const removeBlocked = onCollaboratorRemove
                  ? collaboratorRemoveBlockedReason(person, collaborators)
                  : undefined
                const canRemove = onCollaboratorRemove && !removeBlocked

                return (
                  <li
                    key={person.id}
                    className="flex items-start gap-3 px-3 py-2.5"
                  >
                    <Avatar size="sm" shape="circle" className="mt-0.5 shrink-0">
                      {person.imageUrl ? (
                        <AvatarImage src={person.imageUrl} alt="" referrerPolicy="no-referrer" />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {(person.initials ?? initialsFromDisplayName(person.name)).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                      {person.email ? (
                        <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                      ) : null}
                      {person.roles && person.roles.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {person.roles.map(role => (
                            <Badge key={role} variant="outline" className="font-normal">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-start pt-0.5">
                      {access === "owner" || !onCollaboratorAccessChange ? (
                        <Badge variant="secondary" className="shrink-0 font-normal">
                          <i
                            className={cn("fa-light", COLLABORATOR_ACCESS_ICON_LIGHT[access])}
                            aria-hidden="true"
                          />
                          {collaboratorAccessLabel(person.access)}
                        </Badge>
                      ) : (
                        <CollaboratorAccessChipSelector
                          value={access}
                          onValueChange={value =>
                            onCollaboratorAccessChange(person.id, value as CollaboratorAccessRole)}
                          options={ROSTER_COLLABORATOR_ACCESS_OPTIONS}
                          ariaLabel={`Access for ${person.name}`}
                          triggerId={`collaborator-access-${person.id}`}
                          isOptionDisabled={value =>
                            value !== access
                            && !canSetCollaboratorAccessRole(person, collaborators, value as CollaboratorAccessRole)}
                        />
                      )}
                      {onCollaboratorRemove ? (
                        <Tip
                          side="bottom"
                          label={removeBlocked ?? "Remove access"}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            aria-label={`Remove access for ${person.name}`}
                            disabled={!canRemove}
                            onClick={() => setRemoveTarget(person)}
                          >
                            <i className="fa-light fa-xmark" aria-hidden="true" />
                          </Button>
                        </Tip>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <Shortcut keys="Enter" disabled={isSubmitting} onInvoke={() => form.handleSubmit(onSubmit)()} />

      </SheetContent>

      <Dialog open={removeTarget != null} onOpenChange={open => { if (!open) setRemoveTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove access</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.name} will lose access to ${resourceLabel}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
              <KbdGroup className="ms-1.5"><Kbd variant="bare">Esc</Kbd></KbdGroup>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemove}
              disabled={!removeTarget || !canRemoveCollaboratorFromRoster(removeTarget, collaborators)}
            >
              Remove
              <KbdGroup className="ms-1.5"><Kbd variant="bare">⏎</Kbd></KbdGroup>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Shortcut keys="Enter" disabled={!removeTarget} onInvoke={confirmRemove} />
    </Sheet>
  )
}
