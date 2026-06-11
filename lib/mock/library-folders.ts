/**
 * Library folder tree (mock) — OS-style icon folders with appearance + hierarchy.
 * Parent folders = PT course code + title; subfolders = weekly / unit topics.
 * Production: replace with API + optimistic updates.
 */

export type LibraryFolderColorKey =
  | "brand"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "chart1"
  | "chart2"
  | "chart3"

export interface LibraryFolder {
  id: string
  name: string
  /** `null` = top-level folder */
  parentId: string | null
  /** Font Awesome icon without weight prefix (e.g. `fa-folder`, `fa-flask`). */
  icon: string
  colorKey: LibraryFolderColorKey
}

/** Tile + icon tint classes (semantic tokens). */
export const LIBRARY_FOLDER_COLOR_STYLES: Record<
  LibraryFolderColorKey,
  { tile: string; iconWrap: string; icon: string }
> = {
  brand: {
    tile: "border-brand/35 bg-brand/10",
    iconWrap: "bg-brand/20",
    icon: "text-brand",
  },
  success: {
    tile: "border-emerald-500/35 bg-emerald-500/10",
    iconWrap: "bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    tile: "border-amber-500/35 bg-amber-500/10",
    iconWrap: "bg-amber-500/15",
    icon: "text-amber-700 dark:text-amber-400",
  },
  destructive: {
    tile: "border-destructive/35 bg-destructive/10",
    iconWrap: "bg-destructive/15",
    icon: "text-destructive",
  },
  muted: {
    tile: "border-border bg-muted/50",
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
  },
  chart1: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-1)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-1)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-1)_20%,transparent)]",
    icon: "text-[var(--color-chart-1)]",
  },
  chart2: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-2)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-2)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-2)_20%,transparent)]",
    icon: "text-[var(--color-chart-2)]",
  },
  chart3: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-3)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-3)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-3)_20%,transparent)]",
    icon: "text-[var(--color-chart-3)]",
  },
}

/** Icon color classes using Tailwind — for use in text-based contexts (list views, panels). */
export const LIBRARY_FOLDER_ICON_COLORS: Record<LibraryFolderColorKey, string> = {
  brand: "text-orange-600 dark:text-orange-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-red-600 dark:text-red-400",
  muted: "text-slate-500 dark:text-slate-400",
  chart1: "text-blue-600 dark:text-blue-400",
  chart2: "text-lime-600 dark:text-lime-400",
  chart3: "text-purple-600 dark:text-purple-400",
}

/** Preset icons for folder appearance picker. */
export const LIBRARY_FOLDER_ICON_OPTIONS: readonly string[] = [
  "fa-folder",
  "fa-folder-open",
  "fa-book",
  "fa-bookmark",
  "fa-box",
  "fa-box-archive",
  "fa-tag",
  "fa-flag",
  "fa-star",
  "fa-file-lines",
  "fa-layer-group",
  "fa-clipboard-check",
  "fa-list-check",
  "fa-grid-2",
  "fa-folder-tree",
] as const

const FOLDER_COLOR_CYCLE: LibraryFolderColorKey[] = [
  "brand",
  "chart2",
  "success",
  "warning",
  "chart1",
  "chart3",
  "muted",
  "destructive",
]

/** Core folders + generated tree — ~50 nodes with several 4-level-deep branches. */
function buildDefaultLibraryFolders(): LibraryFolder[] {
  const folders: LibraryFolder[] = [
    {
      id: "fld-favorites",
      name: "Favorites",
      parentId: null,
      icon: "fa-star",
      colorKey: "warning",
    },
    {
      id: "fld-clinical",
      name: "PT 520 Musculoskeletal Systems",
      parentId: null,
      icon: "fa-book",
      colorKey: "brand",
    },
    {
      id: "fld-skills-lab",
      name: "Gait & Posture Analysis",
      parentId: "fld-clinical",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-gait-week1",
      name: "Week 1 — Observational gait",
      parentId: "fld-skills-lab",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-gait-checklist",
      name: "Gait screening checklist",
      parentId: "fld-gait-week1",
      icon: "fa-clipboard-check",
      colorKey: "success",
    },
    {
      id: "fld-gait-week2",
      name: "Week 2 — Instrumented gait",
      parentId: "fld-skills-lab",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-msk-manual",
      name: "Manual Therapy Techniques",
      parentId: "fld-clinical",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-joint-mobs",
      name: "Joint mobilizations",
      parentId: "fld-msk-manual",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-spine-mobs",
      name: "Cervical & lumbar grades",
      parentId: "fld-joint-mobs",
      icon: "fa-file-lines",
      colorKey: "success",
    },
    {
      id: "fld-soft-tissue",
      name: "Soft tissue & myofascial",
      parentId: "fld-msk-manual",
      icon: "fa-folder",
      colorKey: "success",
    },
    {
      id: "fld-science",
      name: "PT 501 Foundational Sciences",
      parentId: null,
      icon: "fa-book",
      colorKey: "chart2",
    },
    {
      id: "fld-neuro-anat",
      name: "Neuroanatomy",
      parentId: "fld-science",
      icon: "fa-folder",
      colorKey: "chart2",
    },
    {
      id: "fld-brain-stem",
      name: "Brainstem & cranial nerves",
      parentId: "fld-neuro-anat",
      icon: "fa-folder",
      colorKey: "chart2",
    },
    {
      id: "fld-cranial-drills",
      name: "Cranial nerve drill bank",
      parentId: "fld-brain-stem",
      icon: "fa-list-check",
      colorKey: "chart2",
    },
    {
      id: "fld-exercise-phys",
      name: "Exercise Physiology",
      parentId: "fld-science",
      icon: "fa-folder",
      colorKey: "chart2",
    },
    {
      id: "fld-ops",
      name: "PT 610 Clinical Integration",
      parentId: null,
      icon: "fa-book",
      colorKey: "warning",
    },
    {
      id: "fld-patient-eval",
      name: "Patient Evaluation",
      parentId: "fld-ops",
      icon: "fa-folder",
      colorKey: "warning",
    },
    {
      id: "fld-subjective",
      name: "Subjective exam",
      parentId: "fld-patient-eval",
      icon: "fa-folder",
      colorKey: "warning",
    },
    {
      id: "fld-pain-scales",
      name: "Pain & function scales",
      parentId: "fld-subjective",
      icon: "fa-clipboard-check",
      colorKey: "warning",
    },
    {
      id: "fld-case-studies",
      name: "Case Studies",
      parentId: "fld-ops",
      icon: "fa-folder",
      colorKey: "warning",
    },
    {
      id: "fld-ethics",
      name: "PT 540 Professional Ethics",
      parentId: null,
      icon: "fa-book",
      colorKey: "muted",
    },
    {
      id: "fld-hipaa",
      name: "HIPAA & Confidentiality",
      parentId: "fld-ethics",
      icon: "fa-folder",
      colorKey: "muted",
    },
    {
      id: "fld-informed-consent",
      name: "Informed Consent",
      parentId: "fld-ethics",
      icon: "fa-folder",
      colorKey: "muted",
    },
  ]

  const topLevelCourses: Array<{ id: string; name: string; colorKey: LibraryFolderColorKey }> = [
    { id: "fld-cardio", name: "PT 530 Cardiopulmonary", colorKey: "chart1" },
    { id: "fld-peds", name: "PT 550 Pediatrics", colorKey: "chart3" },
    { id: "fld-geri", name: "PT 560 Geriatrics", colorKey: "muted" },
    { id: "fld-research", name: "PT 580 Research Methods", colorKey: "brand" },
    { id: "fld-capstone", name: "PT 590 Capstone", colorKey: "warning" },
    { id: "fld-board", name: "PT 600 Board Review", colorKey: "destructive" },
  ]

  for (const course of topLevelCourses) {
    folders.push({
      id: course.id,
      name: course.name,
      parentId: null,
      icon: "fa-book",
      colorKey: course.colorKey,
    })
  }

  const unitTemplates: Record<string, string[]> = {
    "fld-cardio": ["Pulmonary assessment", "Cardiac rehab protocols"],
    "fld-peds": ["Early intervention", "School-based PT"],
    "fld-geri": ["Fall prevention", "Balance & mobility"],
    "fld-research": ["Literature review", "Study design"],
    "fld-capstone": ["Proposal drafts", "Clinical case portfolio"],
    "fld-board": ["NPTE practice sets", "Clinical vignettes"],
  }

  /** Four-level branch on cardiopulmonary: course → unit → module → item bank. */
  const deepCardioRoot = folders.find(f => f.id === "fld-cardio")!
  folders.push({
    id: "fld-cardio-acute",
    name: "Acute care rotation",
    parentId: deepCardioRoot.id,
    icon: "fa-folder",
    colorKey: deepCardioRoot.colorKey,
  })
  folders.push({
    id: "fld-cardio-icu",
    name: "ICU mobility ladder",
    parentId: "fld-cardio-acute",
    icon: "fa-folder",
    colorKey: deepCardioRoot.colorKey,
  })
  folders.push({
    id: "fld-cardio-icu-bank",
    name: "Progression criteria bank",
    parentId: "fld-cardio-icu",
    icon: "fa-list-check",
    colorKey: deepCardioRoot.colorKey,
  })

  /** Four-level branch on capstone: proposal → lit review → sources → annotated bib. */
  folders.push({
    id: "fld-cap-lit",
    name: "Literature synthesis",
    parentId: "fld-capstone",
    icon: "fa-folder",
    colorKey: "warning",
  })
  folders.push({
    id: "fld-cap-sources",
    name: "Primary sources",
    parentId: "fld-cap-lit",
    icon: "fa-folder",
    colorKey: "warning",
  })
  folders.push({
    id: "fld-cap-annotated",
    name: "Annotated bibliography",
    parentId: "fld-cap-sources",
    icon: "fa-file-lines",
    colorKey: "warning",
  })

  for (const [parentId, units] of Object.entries(unitTemplates)) {
    const parent = folders.find(f => f.id === parentId)!
    units.forEach((unitName, index) => {
      const unitId = `${parentId}-u${index + 1}`
      folders.push({
        id: unitId,
        name: unitName,
        parentId: parent.id,
        icon: "fa-folder",
        colorKey: parent.colorKey,
      })

      /** Optional third level under the first unit (2 courses only — keeps total ~50). */
      if (
        index === 0 &&
        parentId !== "fld-cardio" &&
        parentId !== "fld-capstone" &&
        (parentId === "fld-peds" || parentId === "fld-board")
      ) {
        folders.push({
          id: `${unitId}-mod`,
          name: `${unitName} — Week 1 module`,
          parentId: unitId,
          icon: "fa-layer-group",
          colorKey: parent.colorKey,
        })
      }
    })
  }

  /** Top off to 50 folders for tree-scroll demos. */
  const padTargets: Array<{ parentId: string; names: string[] }> = [
    { parentId: "fld-clinical", names: ["Imaging interpretation", "Outcome measures"] },
    { parentId: "fld-science", names: ["Biomechanics lab", "Pathophysiology cases"] },
    { parentId: "fld-ops", names: ["Documentation standards", "Interprofessional notes"] },
    { parentId: "fld-geri", names: ["Home safety checklist", "Cognitive screening"] },
    { parentId: "fld-research", names: ["IRB & ethics"] },
    { parentId: "fld-board", names: ["Systems review", "Timed exam drills"] },
  ]

  let padIndex = 0
  for (const { parentId, names } of padTargets) {
    const parent = folders.find(f => f.id === parentId)
    if (!parent) continue
    for (const name of names) {
      if (folders.length >= 50) break
      folders.push({
        id: `fld-pad-${padIndex++}`,
        name,
        parentId: parent.id,
        icon: "fa-folder",
        colorKey: FOLDER_COLOR_CYCLE[padIndex % FOLDER_COLOR_CYCLE.length]!,
      })
    }
  }

  return folders
}

export const DEFAULT_LIBRARY_FOLDERS: LibraryFolder[] = buildDefaultLibraryFolders()

export function newFolderId(): string {
  return `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function collectFolderDescendantIds(folders: LibraryFolder[], rootId: string): Set<string> {
  const out = new Set<string>()
  function walk(id: string) {
    out.add(id)
    for (const f of folders) {
      if (f.parentId === id) walk(f.id)
    }
  }
  walk(rootId)
  return out
}

export function isValidFolderMove(
  folders: LibraryFolder[],
  folderId: string,
  newParentId: string | null,
): boolean {
  if (folderId === newParentId) return false
  if (newParentId === null) return true
  const desc = collectFolderDescendantIds(folders, folderId)
  return !desc.has(newParentId)
}
