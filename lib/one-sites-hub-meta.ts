/** Copy + route segment for One — Sites primary-nav hubs (empty-state shells). */
export interface OneSitesHubMeta {
  title: string
  description: string
}

export const ONE_SITES_HUB_META: Record<string, OneSitesHubMeta> = {
  locations: {
    title: "Locations",
    description: "Manage clinical locations, capacity, and site-specific requirements.",
  },
  personnel: {
    title: "Personnel",
    description: "View and manage coordinators, preceptors, and site staff.",
  },
  "school-partners": {
    title: "School Partners",
    description: "Partner schools, programs, and shared placement agreements.",
  },
  availability: {
    title: "Availability",
    description: "Publish and maintain slot availability for partner programs.",
  },
  "slot-requests": {
    title: "Slot Requests",
    description: "Review and respond to incoming slot requests from schools.",
  },
  schedules: {
    title: "Schedules",
    description: "Confirmed schedules and calendar views across locations.",
  },
  reports: {
    title: "Reports",
    description: "Operational and utilization reports for availability and placements.",
  },
  jobs: {
    title: "Jobs",
    description: "Post, manage, and track clinical job openings for your site network.",
  },
}

export function oneSitesHubMetaForSegment(segment: string): OneSitesHubMeta {
  return (
    ONE_SITES_HUB_META[segment] ?? {
      title: segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      description: "This hub is not wired yet — replace with a real list surface when ready.",
    }
  )
}
