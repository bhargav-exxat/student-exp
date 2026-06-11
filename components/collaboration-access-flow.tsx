"use client"

import * as React from "react"

import type { InviteCollaboratorFormValues } from "@/components/invite-collaborators-drawer"
import { InviteCollaboratorsDrawer } from "@/components/invite-collaborators-drawer"
import type { PageHeaderCollaborator } from "@/components/page-header"
import {
  canRemoveCollaboratorFromRoster,
  canSetCollaboratorAccessRole,
  displayNameFromInviteEmail,
  type CollaboratorAccessRole,
} from "@/lib/collaborator-access"
import { initialsFromDisplayName } from "@/lib/initials-from-name"

export interface CollaborationAccessFlowRenderProps {
  collaborators: PageHeaderCollaborator[]
  openInvite: () => void
}

export interface CollaborationAccessFlowProps {
  initialCollaborators: PageHeaderCollaborator[]
  resourceLabel: string
  onInvite?: (
    values: InviteCollaboratorFormValues,
    collaborators: PageHeaderCollaborator[],
  ) => PageHeaderCollaborator[] | void
  onCollaboratorAccessChange?: (
    id: string,
    access: CollaboratorAccessRole,
    collaborators: PageHeaderCollaborator[],
  ) => PageHeaderCollaborator[] | void
  onCollaboratorRemove?: (
    id: string,
    collaborators: PageHeaderCollaborator[],
  ) => PageHeaderCollaborator[] | void
  children: (props: CollaborationAccessFlowRenderProps) => React.ReactNode
}

function appendInvitedCollaborator(
  collaborators: PageHeaderCollaborator[],
  values: InviteCollaboratorFormValues,
): PageHeaderCollaborator[] {
  const name = displayNameFromInviteEmail(values.email)
  return [
    ...collaborators,
    {
      id: `invite-${values.email}`,
      name,
      email: values.email,
      access: values.access,
      initials: initialsFromDisplayName(name),
    },
  ]
}

function updateCollaboratorAccess(
  collaborators: PageHeaderCollaborator[],
  id: string,
  access: CollaboratorAccessRole,
): PageHeaderCollaborator[] {
  const person = collaborators.find(entry => entry.id === id)
  if (!person || !canSetCollaboratorAccessRole(person, collaborators, access)) {
    return collaborators
  }
  return collaborators.map(entry => (entry.id === id ? { ...entry, access } : entry))
}

function removeCollaboratorFromRoster(
  collaborators: PageHeaderCollaborator[],
  id: string,
): PageHeaderCollaborator[] {
  const person = collaborators.find(entry => entry.id === id)
  if (!person || !canRemoveCollaboratorFromRoster(person, collaborators)) {
    return collaborators
  }
  return collaborators.filter(entry => entry.id !== id)
}

export function CollaborationAccessFlow({
  initialCollaborators,
  resourceLabel,
  onInvite,
  onCollaboratorAccessChange,
  onCollaboratorRemove,
  children,
}: CollaborationAccessFlowProps) {
  const [collaborators, setCollaborators] = React.useState<PageHeaderCollaborator[]>(
    () => initialCollaborators.map(person => ({ ...person })),
  )
  const [inviteOpen, setInviteOpen] = React.useState(false)

  const openInvite = React.useCallback(() => {
    setInviteOpen(true)
  }, [])

  const handleInvite = React.useCallback(
    (values: InviteCollaboratorFormValues) => {
      setCollaborators(current => {
        const next = onInvite?.(values, current) ?? appendInvitedCollaborator(current, values)
        return next
      })
    },
    [onInvite],
  )

  const handleAccessChange = React.useCallback(
    (id: string, access: CollaboratorAccessRole) => {
      setCollaborators(current => {
        const next =
          onCollaboratorAccessChange?.(id, access, current)
          ?? updateCollaboratorAccess(current, id, access)
        return next
      })
    },
    [onCollaboratorAccessChange],
  )

  const handleRemove = React.useCallback(
    (id: string) => {
      setCollaborators(current => {
        const next =
          onCollaboratorRemove?.(id, current) ?? removeCollaboratorFromRoster(current, id)
        return next
      })
    },
    [onCollaboratorRemove],
  )

  return (
    <>
      {children({ collaborators, openInvite })}
      <InviteCollaboratorsDrawer
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        collaborators={collaborators}
        resourceLabel={resourceLabel}
        onInvite={handleInvite}
        onCollaboratorAccessChange={handleAccessChange}
        onCollaboratorRemove={handleRemove}
      />
    </>
  )
}
