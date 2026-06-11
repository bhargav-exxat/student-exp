/** Library access roles for shared hubs — see `docs/collaboration-access-pattern.md`. */
export type CollaboratorAccessRole = "owner" | "editor" | "commenter" | "viewer"

export const COLLABORATOR_ACCESS_LABELS: Record<CollaboratorAccessRole, string> = {
  owner: "Owner",
  editor: "Editor",
  commenter: "Commenter",
  viewer: "Viewer",
}

/** Decorative FA icon names (`fa-light fa-*`) for library access chips and menus. */
export const COLLABORATOR_ACCESS_ICON_LIGHT: Record<CollaboratorAccessRole, string> = {
  owner: "fa-crown",
  editor: "fa-pen-to-square",
  commenter: "fa-comment",
  viewer: "fa-eye",
}

export type InviteCollaboratorAccessRole = Exclude<CollaboratorAccessRole, "owner">

export const INVITE_COLLABORATOR_ACCESS_OPTIONS: {
  value: InviteCollaboratorAccessRole
  label: string
  description: string
}[] = [
  {
    value: "editor",
    label: "Editor",
    description: "Can add and edit questions in this library.",
  },
  {
    value: "commenter",
    label: "Commenter",
    description: "Can review and comment without editing.",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view questions only.",
  },
]

/** Roster access menu — includes Owner for existing collaborators. */
export const ROSTER_COLLABORATOR_ACCESS_OPTIONS: {
  value: CollaboratorAccessRole
  label: string
}[] = (["owner", "editor", "commenter", "viewer"] as const).map(value => ({
  value,
  label: COLLABORATOR_ACCESS_LABELS[value],
}))

export function rosterOwnerCount(collaborators: readonly { access?: CollaboratorAccessRole }[]) {
  return collaborators.filter(person => person.access === "owner").length
}

export function canRemoveCollaboratorFromRoster(
  person: { access?: CollaboratorAccessRole },
  collaborators: readonly { access?: CollaboratorAccessRole }[],
) {
  if (person.access !== "owner") return true
  return rosterOwnerCount(collaborators) > 1
}

export function canSetCollaboratorAccessRole(
  person: { access?: CollaboratorAccessRole },
  collaborators: readonly { access?: CollaboratorAccessRole }[],
  nextAccess: CollaboratorAccessRole,
) {
  if (person.access === nextAccess) return false
  if (person.access === "owner" && rosterOwnerCount(collaborators) === 1 && nextAccess !== "owner") {
    return false
  }
  return true
}

export function collaboratorRemoveBlockedReason(
  person: { access?: CollaboratorAccessRole },
  collaborators: readonly { access?: CollaboratorAccessRole }[],
) {
  if (canRemoveCollaboratorFromRoster(person, collaborators)) return undefined
  return "This person is the only owner."
}

/** Default label for the collaboration header when the roster is empty. */
export const COLLABORATION_HEADER_ADD_LABEL = "Add collaborator"

export function displayNameFromInviteEmail(email: string) {
  const local = email.split("@")[0] ?? email
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())
}
