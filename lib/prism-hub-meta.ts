/** Copy + route segment for Prism primary-nav hubs (empty-state shells). */
export interface PrismHubMeta {
  title: string
  description: string
}

export const PRISM_HUB_META: Record<string, PrismHubMeta> = {
  "program-details": {
    title: "Program Details",
    description:
      "Set up defining attributes of the program including mission, vision, accreditation standards, and more.",
  },
  students: {
    title: "Students",
    description:
      "Manage profiles and demographic information on matriculated students and alumni.",
  },
  "faculty-staff": {
    title: "Faculty and Staff",
    description:
      "View faculty portfolios including teaching responsibility, scholarly productivity, and service activities.",
  },
  "student-compliance": {
    title: "Student Compliance",
    description:
      "Configure, collect, review, and communicate with students about clearance documents for clinical education.",
  },
  "faculty-compliance": {
    title: "Faculty Compliance",
    description:
      "Configure, collect, and review clearance documents for faculty.",
  },
  reports: {
    title: "Reports",
    description:
      "Access all standard, custom, and accreditation reports across the system from a centralized location.",
  },
  courses: {
    title: "Courses",
    description:
      "Enter, organize, and manage courses including course documents, schedules, resources, and registration.",
  },
  "curriculum-mapping": {
    title: "Curriculum Mapping",
    description:
      "Build your curriculum, map it with standards, and get insightful reports.",
  },
  "competency-management": {
    title: "Competency",
    description:
      "Set up your competencies, map them to assessments and course offerings, and generate insightful reports.",
  },
  sites: {
    title: "Sites",
    description:
      "Find contact information, contracts, availability, and clearance requirements for all clinical sites.",
  },
  "process-my-requests": {
    title: "Process My Requests",
    description: "Process placement requests submitted by students.",
  },
  placements: {
    title: "Placements",
    description:
      "Navigate the process of matching students to sites from start to finish.",
  },
  "learning-activities": {
    title: "Learning Activities",
    description:
      "Set up, distribute, review, and grade course-related activities.",
  },
  team: {
    title: "Team",
    description: "Directory of program faculty, staff, and collaborators.",
  },
  compliance: {
    title: "Compliance",
    description: "Configure and review clearance documents for students and faculty.",
  },
}

export function prismHubMetaForSegment(segment: string): PrismHubMeta {
  return (
    PRISM_HUB_META[segment] ?? {
      title: segment
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      description: "This hub is not wired yet — replace with a real list surface when ready.",
    }
  )
}
