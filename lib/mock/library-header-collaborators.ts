/**
 * Demo collaborators for Library collaboration header (stacked faces).
 */

import { stockPortraitUrl } from "@/lib/stock-portrait"
import type { PageHeaderCollaborator } from "@/components/page-header"

export const LIBRARY_HEADER_COLLABORATORS: PageHeaderCollaborator[] = [
  {
    id: "1",
    name: "Owner A",
    email: "owner.a@demo.exxat.io",
    imageUrl: stockPortraitUrl("qb-collab-a"),
    initials: "OA",
    access: "owner",
    roles: ["Role 1", "Role 2"],
  },
  {
    id: "2",
    name: "Owner B",
    email: "owner.b@demo.exxat.io",
    imageUrl: stockPortraitUrl("qb-collab-b"),
    initials: "OB",
    access: "editor",
    roles: ["Role 3"],
  },
  {
    id: "3",
    name: "Owner C",
    email: "owner.c@demo.exxat.io",
    imageUrl: stockPortraitUrl("qb-collab-c"),
    initials: "OC",
    access: "editor",
    roles: ["Role 2"],
  },
  {
    id: "4",
    name: "Owner D",
    email: "owner.d@demo.exxat.io",
    imageUrl: stockPortraitUrl("qb-collab-d"),
    initials: "OD",
    access: "commenter",
    roles: ["Role 2"],
  },
  {
    id: "5",
    name: "Owner E",
    email: "owner.e@demo.exxat.io",
    imageUrl: stockPortraitUrl("qb-collab-e"),
    initials: "OE",
    access: "viewer",
    roles: ["Role 3"],
  },
]
