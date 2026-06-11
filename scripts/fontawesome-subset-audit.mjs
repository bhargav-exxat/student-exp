#!/usr/bin/env node
/**
 * Scans apps/web + packages/ui for Font Awesome class usage and writes
 * fontawesome-subset.manifest.json for Font Awesome Kit subsetting.
 *
 * Run: pnpm fa:subset-audit (from apps/web)
 *
 * Then: https://fontawesome.com/kits → Kit → Settings → Icon Selection → By Icon
 *       Enable styles: Light, Solid, Duotone (see manifest.duotoneNote).
 *       Paste / upload icons from manifest.icons (hyphenated names as in FA search).
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_ROOT = path.join(__dirname, "..")
const UI_SRC = path.join(WEB_ROOT, "node_modules", "@exxatdesignux/ui", "src")

const IGNORE_DIR = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".turbo",
])

/** Modifier / utility tokens — not icon names */
const IGNORE_ICONS = new Set([
  "solid",
  "light",
  "regular",
  "brands",
  "duotone",
  "spin",
  "pulse",
  "beat",
  "fade",
  "beat-fade",
  "bounce",
  "flip",
  "shake",
  "fw",
  "xs",
  "sm",
  "lg",
  "xl",
  "2xl",
  "1x",
  "2x",
  "3x",
  "4x",
  "5x",
  "6x",
  "7x",
  "8x",
  "9x",
  "10x",
  "rotate-90",
  "rotate-180",
  "rotate-270",
  "rotate-by",
  "flip-horizontal",
  "flip-vertical",
])

function walkFiles(root, out = []) {
  if (!fs.existsSync(root)) return out
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
    if (IGNORE_DIR.has(ent.name)) continue
    const p = path.join(root, ent.name)
    if (ent.isDirectory()) walkFiles(p, out)
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name) && !ent.name.endsWith(".d.ts"))
      out.push(p)
  }
  return out
}

function addIcon(set, name) {
  if (!name || name.length < 2) return
  const n = name.toLowerCase()
  if (IGNORE_ICONS.has(n)) return
  set.add(n)
}

function extractFromText(text, styles, icons) {
  // fa-solid fa-grid-2, fa-light fa-arrow-left, etc.
  const reStyled = /\bfa-(solid|light|regular|brands)\s+fa-([a-z0-9-]+)\b/gi
  let m
  while ((m = reStyled.exec(text)) !== null) {
    styles.add(m[1].toLowerCase())
    addIcon(icons, m[2])
  }

  // fa-duotone fa-solid fa-star-christmas
  const reDuotone = /\bfa-duotone\s+fa-solid\s+fa-([a-z0-9-]+)\b/gi
  while ((m = reDuotone.exec(text)) !== null) {
    styles.add("duotone")
    styles.add("solid")
    addIcon(icons, m[1])
  }

  // "fa-light fa-books" in strings
  const reQuoted = /["'](fa-(?:solid|light|regular|brands)\s+fa-([a-z0-9-]+))["']/gi
  while ((m = reQuoted.exec(text)) !== null) {
    const styleMatch = /^fa-(\w+)\s/.exec(m[1])
    if (styleMatch) styles.add(styleMatch[1].toLowerCase())
    addIcon(icons, m[2])
  }

  // list-status-badges style: "fa-circle-check" (suffix only)
  const reBare = /["']fa-([a-z0-9-]+)["']/g
  while ((m = reBare.exec(text)) !== null) {
    const token = m[1].toLowerCase()
    if (!IGNORE_ICONS.has(token)) addIcon(icons, token)
  }

  // className={`fa-light ${foo}`} — skip dynamic; human must grep ${ if needed
}

/** Dynamic class templates — expand to concrete icon names for the kit list */
function applyDynamicIconExpansions(icons) {
  // data-table SortChevron: `fa-solid fa-arrow-${asc ? "up" : "down"}`
  if (icons.delete("arrow")) {
    icons.add("arrow-up")
    icons.add("arrow-down")
  }
}

function main() {
  const files = [
    ...walkFiles(path.join(WEB_ROOT, "app")),
    ...walkFiles(path.join(WEB_ROOT, "components")),
    ...walkFiles(path.join(WEB_ROOT, "lib")),
    ...walkFiles(path.join(WEB_ROOT, "contexts")),
    ...walkFiles(path.join(WEB_ROOT, "hooks")),
    ...walkFiles(UI_SRC),
  ]

  const styles = new Set()
  const icons = new Set()

  for (const file of files) {
    let text
    try {
      text = fs.readFileSync(file, "utf8")
    } catch {
      continue
    }
    extractFromText(text, styles, icons)
  }

  applyDynamicIconExpansions(icons)

  // Ensure we always list core styles the app relies on
  styles.add("light")
  styles.add("solid")

  const sortedStyles = [...styles].sort()
  const sortedIcons = [...icons].sort()

  const manifest = {
    kitId: "d9bd5774e0",
    generatedAt: new Date().toISOString(),
    sourcePaths: ["{app,components,lib,contexts,hooks}", "node_modules/@exxatdesignux/ui/src"],
    stylesDetected: sortedStyles,
    duotoneNote:
      "Icons used as fa-duotone fa-solid … require Duotone + Solid in Kit settings (e.g. star-christmas).",
    iconCount: sortedIcons.length,
    icons: sortedIcons,
    kitSteps: [
      "Open https://fontawesome.com/kits and select this kit.",
      "Settings → Icon Selection → By Icon → add every name from `icons` (search in FA).",
      "Settings → Icon Selection → By Style → enable only: Light, Solid, and Duotone if duotone icons are used.",
      "Save the kit, then verify the app (hard refresh). Missing icons show as empty squares.",
      "Re-run `pnpm fa:subset-audit` after adding icons and commit the updated manifest.",
    ],
  }

  const outPath = path.join(WEB_ROOT, "fontawesome-subset.manifest.json")
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8")

  console.log(`Wrote ${outPath}`)
  console.log(`Styles: ${sortedStyles.join(", ")}`)
  console.log(`Icons: ${sortedIcons.length}`)
}

main()
