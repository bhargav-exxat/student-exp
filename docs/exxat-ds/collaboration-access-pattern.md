# Collaboration & access pattern

Shared UI for **who can access a hub** (face stack in the header) and **inviting people** (floating sheet). **Reference:** Library — `LibraryPageHeader`, `LibraryClient`, `InviteCollaboratorsDrawer`.

**Folder-scoped library:** When the library URL selects a folder (`?scope=folder&folderId=`), the same header **⋯ More** menu also exposes **Customize folder** (name / color / icon) via **`LibraryNewFolderSheet`** mounted on **`LibraryClient`** so it works on every view tab. See **`docs/library-hub-header-pattern.md`** and **`.cursor/rules/exxat-library-hub-header.mdc`**.

## When to use

- A list hub or library is **shared** across people (not a private directory).
- Users need to see **who has access**, **invite by email**, and assign **library access** (Owner / Editor / Commenter / Viewer).
- The hub already uses **`ListPageTemplate`** + **`PageHeader`** (or an entity header built on it).

**Do not** use this for org-wide **role** administration (Faculty, Program coordinator, Director) as the only story — those are **directory role tags** on people, not library access.

## Vocabulary

| Concept | Meaning | Source |
|--------|---------|--------|
| **Library access** | What someone can do **in this hub** (Owner, Editor, Commenter, Viewer) | `lib/collaborator-access.ts` |
| **Directory roles** | Org/job tags on a person (Faculty, Program coordinator, Director) | `PageHeaderCollaborator.roles` |
| **Face rail** | Overlapping avatars in the header when the roster is non-empty | `PageHeader` `variant="collaboration"` |
| **Empty roster CTA** | Outline **Add collaborator** in the header when `collaborators` is empty | `PageHeader` + `COLLABORATION_HEADER_ADD_LABEL` |
| **Invite sheet** | Floating right **`Sheet`** for roster + invite form | `InviteCollaboratorsDrawer` |
| **Hub wiring** | Roster state + invite sheet in one render-prop shell | `CollaborationAccessFlow` |

## Header (`PageHeader`)

- Set **`variant="collaboration"`**.
- Pass **`collaborators`** (`PageHeaderCollaborator[]`) and optional **`accessInfo`**.
- **Non-empty roster** — overlapping **face rail** only; each face and **`+N`** open the invite sheet via **`onCollaboratorsOpen`**.
- **Empty roster** — outline **`Add collaborator`** (`addCollaboratorLabel`, default **`COLLABORATION_HEADER_ADD_LABEL`**) opens the same sheet.
- **Invite** also lives under **⋯ More** on the entity page header (first item when `variant="collaboration"`).

```tsx
<CollaborationAccessFlow
  initialCollaborators={LIBRARY_HEADER_COLLABORATORS}
  resourceLabel={hubHeader.title}
>
  {({ collaborators, openInvite }) => (
    <LibraryPageHeader
      variant="collaboration"
      title={hubHeader.title}
      questionCount={count}
      collaborators={collaborators}
      onAddCollaborator={openInvite}
      onCollaboratorsOpen={openInvite}
      onExport={() => setExportOpen(true)}
      showMetrics={showMetrics}
      onToggleMetrics={() => setShowMetrics(v => !v)}
    />
  )}
</CollaborationAccessFlow>
```

## Hub client state

- Prefer **`CollaborationAccessFlow`** — owns **`collaborators`**, **`openInvite`**, and **`InviteCollaboratorsDrawer`**; pass **`openInvite`** to **`onAddCollaborator`** / **`onCollaboratorsOpen`**.
- Without the flow: **`collaborators`** — `useState` seeded from `lib/mock/<entity>-header-collaborators.ts` (or API later); **`inviteOpen`** — boolean; mount **`InviteCollaboratorsDrawer`** beside **`ListPageTemplate`**.
- On invite success, append to **`collaborators`** so the **face rail** and sheet roster stay aligned.
- **Change access** — roster menu updates **`collaborators`** via **`onCollaboratorAccessChange`** ( **`CollaborationAccessFlow`** default).
- **Remove access** — confirm dialog then **`onCollaboratorRemove`**; blocked for the only **Owner**.

## `PageHeaderCollaborator`

| Field | Use |
|-------|-----|
| `id`, `name`, `imageUrl`, `initials` | Face rail + roster row |
| `email` | Roster (below name); invite form |
| `access` | Library access badge (Owner … Viewer) |
| `roles` | Optional **outline** chips (Faculty, Program coordinator, Director) |

## Invite sheet (`InviteCollaboratorsDrawer`)

Mirror **`ExportDrawer`** chrome: floating **`Sheet`**, no overlay, **`showCloseButton={false}`**, footer **Cancel** / **Send invite** with inline **`Kbd`** (**Esc** / **⏎**), **`Shortcut`** for Enter on the open surface.

**Invite field:** one bordered row — email input + **access** menu on the right.

- Use **`Select`** with **`SelectGroup`** for access (invite row in **`InputGroupAddon`**, roster row standalone); **`position="popper"`** inside the sheet; **no** toast on success (**§6.5**).

**People with access:** one **`rounded-lg border`** list with **`divide-y`** — **not** one card per person.

Row order:

1. **Name** (`text-sm font-medium`)
2. **Email** (`text-xs text-muted-foreground`)
3. **Role tags** (`Badge variant="outline"`) when `roles` is set
4. Trailing **library access** **`Select`** when the hub wires **`onCollaboratorAccessChange`**; **Remove access** (trash) opens a confirm **`Dialog`** when **`onCollaboratorRemove`** is set. The sole **Owner** cannot be removed or demoted until another owner exists.

## Library access constants

- Types and invite options: **`lib/collaborator-access.ts`**
- **`INVITE_COLLABORATOR_ACCESS_OPTIONS`** — Editor / Commenter / Viewer (no Owner on invite)
- Customize option **descriptions** per hub; keep **values** stable for forms/API

## File map

| Piece | Path |
|-------|------|
| Access types | `lib/collaborator-access.ts` |
| Hub flow | `components/collaboration-access-flow.tsx` |
| Collaborator type | `components/page-header.tsx` (`PageHeaderCollaborator`) |
| Invite sheet | `components/invite-collaborators-drawer.tsx` |
| Entity header | `components/library-page-header.tsx` |
| Hub wiring | `components/library-client.tsx` |
| Demo roster | `lib/mock/library-header-collaborators.ts` |

## Checklist (new hub)

- [ ] `PageHeader` / entity header uses **`variant="collaboration"`** when the product is shared.
- [ ] **Empty roster** shows **Add collaborator**; **non-empty** shows face rail; both open the invite sheet.
- [ ] **Invite people** under **⋯ More**; **`CollaborationAccessFlow`** (or equivalent) owns roster + sheet.
- [ ] Roster: single bordered list; **name → email → role tags**; access badge on the right.
- [ ] Invite row: email + access menu; **`FormDescription`** for format; **no** toast.
- [ ] Labels from **`collaborator-access.ts`**; mock/API rows extend **`PageHeaderCollaborator`** once.

**Handbook:** `AGENTS.md` §4.7 · **Rule:** `.cursor/rules/exxat-collaboration-access.mdc` · **Skill:** `.cursor/skills/exxat-collaboration-access/SKILL.md`
