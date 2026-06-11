/** Copy + route segment for One — Schools primary-nav hubs (empty-state shells). */
export interface OneSchoolsHubMeta {
  title: string
  description: string
}

export const ONE_SCHOOLS_HUB_META: Record<string, OneSchoolsHubMeta> = {
  "explore-availability": {
    title: "Explore & apply",
    description: "Browse published availability and submit slot applications to partner sites.",
  },
  "wishlist-responses": {
    title: "Wishlist Responses",
    description: "Track site responses to wishlist and availability requests.",
  },
  "activities-dashboard": {
    title: "Activities dashboard",
    description: "Overview of placement activity, requests, and schedules for your program.",
  },
  "activities-requests": {
    title: "Requests",
    description: "Manage and monitor placement and availability requests across sites.",
  },
  "activities-schedules": {
    title: "Schedules",
    description: "Confirmed student schedules and rotation calendars.",
  },
  reports: {
    title: "Reports",
    description: "Program reports on placements, availability, and site engagement.",
  },
}

export function oneSchoolsHubMetaForSegment(segment: string): OneSchoolsHubMeta {
  return (
    ONE_SCHOOLS_HUB_META[segment] ?? {
      title: segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      description: "This hub is not wired yet — replace with a real list surface when ready.",
    }
  )
}
