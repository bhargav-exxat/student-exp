"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { BrandColorPicker } from "@/components/brand-color-picker"
import {
  ExxatProductMark,
  ExxatProductWordmarkEditor,
} from "@/components/exxat-product-logo"
import { useAppStore, productSlug, type Product } from "@/stores/app-store"
import {
  customProductSlugFromSuffix,
  validateCustomProductSuffix,
} from "@/lib/product-routing"
import {
  brandAccentOklchFromHue,
  normalizeBrandAccentColor,
} from "@/lib/brand-accent-color"
import {
  setTenantProductData,
  syncCustomProductsMirror,
  updateTenantProductNav,
  type SerializableNavLink,
} from "@exxatdesignux/product-framework"
import { setStorageItem } from "@exxatdesignux/ui/lib/persisted-state"

const ONBOARDING_COMPLETE_KEY = "builder:onboarding-complete:v1"

type ScopeKind = "school-program" | "brand-site-location"

type StepId = "identity" | "context" | "scope" | "persona" | "nav"

const STEPS: ReadonlyArray<{ id: StepId; title: string; subtitle?: string }> = [
  {
    id: "identity",
    title: "Name your product.",
  },
  {
    id: "context",
    title: "What scope does this product live in?",
  },
  {
    id: "scope",
    title: "Tell us a bit about your scope.",
  },
  {
    id: "persona",
    title: "Who is this product for?",
  },
  {
    id: "nav",
    title: "Build your primary nav.",
  },
] as const

interface PersonaOption {
  id: string
  label: string
  caption: string
  icon: string
}

const PERSONAS_BY_SCOPE: Record<ScopeKind, ReadonlyArray<PersonaOption>> = {
  "school-program": [
    {
      id: "program-coordinator",
      label: "Program coordinator",
      caption: "DCE / placement coordinator running compliance and rotations.",
      icon: "fa-user-tie",
    },
    {
      id: "faculty",
      label: "Faculty",
      caption: "Reviews student progress and signs off on milestones.",
      icon: "fa-chalkboard-user",
    },
    {
      id: "student",
      label: "Student",
      caption: "Self-service portal for tasks, schedules, and clearances.",
      icon: "fa-graduation-cap",
    },
  ],
  "brand-site-location": [
    {
      id: "site-coordinator",
      label: "Site coordinator",
      caption: "Manages slots, preceptors, and inbound placements.",
      icon: "fa-people-roof",
    },
    {
      id: "preceptor",
      label: "Preceptor",
      caption: "Reviews student work, signs evaluations, hosts rotations.",
      icon: "fa-user-doctor",
    },
    {
      id: "site-admin",
      label: "Site admin",
      caption: "Owns brand settings, billing, and cross-site reporting.",
      icon: "fa-building-shield",
    },
  ],
}

const SCHOOL_OPTIONS: ReadonlyArray<string> = [
  "Johns Hopkins University",
  "Harvard University",
  "Stanford University",
  "Mayo Clinic Alix School of Medicine",
  "University of Pennsylvania",
  "Duke University",
  "Vanderbilt University",
]

const PROGRAM_OPTIONS: ReadonlyArray<string> = [
  "School of Medicine",
  "School of Nursing",
  "School of Pharmacy",
  "Physical Therapy",
  "Occupational Therapy",
  "Physician Assistant",
  "Public Health",
]

const BRAND_OPTIONS: ReadonlyArray<string> = [
  "Mass General Brigham",
  "Cleveland Clinic",
  "Kaiser Permanente",
  "HCA Healthcare",
  "Mayo Clinic",
  "Sutter Health",
  "Ascension Health",
]

const SITE_OPTIONS: ReadonlyArray<string> = [
  "MGH Boston",
  "Brigham & Women’s Hospital",
  "Cleveland Clinic Main Campus",
  "Kaiser SF Medical Center",
  "Mayo Clinic Rochester",
  "HCA Reston Hospital",
]

const LOCATION_OPTIONS: ReadonlyArray<string> = [
  "Cardiology Wing",
  "Emergency Department",
  "Outpatient Clinic",
  "Pediatrics Floor",
  "Oncology Suite",
  "Maternity Ward",
  "Operating Room",
]

interface NavSuggestion {
  key: string
  title: string
  caption: string
  segment: string
  iconClass: string
  iconActiveClass: string
  hasSecondary?: boolean
}

const NAV_SUGGESTIONS: ReadonlyArray<NavSuggestion> = [
  {
    key: "library",
    title: "Library",
    caption: "Reusable content, rubrics, and templates.",
    segment: "library",
    iconClass: "fa-light fa-books",
    iconActiveClass: "fa-solid fa-books",
    hasSecondary: true,
  },
  {
    key: "placements",
    title: "Placements",
    caption: "Sites, rotations, and assignments.",
    segment: "placements",
    iconClass: "fa-light fa-location-dot",
    iconActiveClass: "fa-solid fa-location-dot",
  },
  {
    key: "team",
    title: "Team",
    caption: "People, roles, and collaboration.",
    segment: "team",
    iconClass: "fa-light fa-users",
    iconActiveClass: "fa-solid fa-users",
  },
  {
    key: "compliance",
    title: "Compliance",
    caption: "Clearances, documents, and audit trails.",
    segment: "compliance",
    iconClass: "fa-light fa-shield-check",
    iconActiveClass: "fa-solid fa-shield-check",
  },
  {
    key: "schedule",
    title: "Schedule",
    caption: "Calendars, shifts, and rotations.",
    segment: "schedule",
    iconClass: "fa-light fa-calendar",
    iconActiveClass: "fa-solid fa-calendar",
  },
  {
    key: "evaluations",
    title: "Evaluations",
    caption: "Forms, rubrics, and outcomes.",
    segment: "evaluations",
    iconClass: "fa-light fa-clipboard-check",
    iconActiveClass: "fa-solid fa-clipboard-check",
  },
  {
    key: "documents",
    title: "Documents",
    caption: "Uploads, contracts, and file storage.",
    segment: "documents",
    iconClass: "fa-light fa-folder-open",
    iconActiveClass: "fa-solid fa-folder-open",
  },
  {
    key: "reports",
    title: "Reports",
    caption: "Dashboards, exports, and analytics.",
    segment: "reports",
    iconClass: "fa-light fa-chart-line",
    iconActiveClass: "fa-solid fa-chart-line",
  },
] as const

interface NavIconCandidate {
  iconClass: string
  iconActiveClass: string
  keywords: ReadonlyArray<string>
}

/**
 * Curated Font Awesome Pro library for the nav builder's auto-detect.
 * Each entry lists a `fa-light` / `fa-solid` pair plus a generous
 * keyword set the matcher tokenizes against. Matching is multi-stage
 * (exact word → singular/plural → substring) so titles like "Custom
 * Reports", "Student Roster", or "Site Visits" land on the right glyph
 * without the user ever picking an icon.
 *
 * Order does not affect correctness — the matcher scores every entry
 * and picks the highest scorer (with a tiny tiebreaker for shorter
 * keyword sets, so generic glyphs lose to specific ones).
 */
const NAV_ICON_LIBRARY: ReadonlyArray<NavIconCandidate> = [
  // — Top-level / dashboards ————————————————————————————————————————
  { iconClass: "fa-light fa-gauge-high",       iconActiveClass: "fa-solid fa-gauge-high",       keywords: ["dashboard", "dashboards", "overview", "home", "landing", "kpi", "summary", "main", "metrics"] },
  { iconClass: "fa-light fa-house",            iconActiveClass: "fa-solid fa-house",            keywords: ["home", "house", "start"] },
  { iconClass: "fa-light fa-compass",          iconActiveClass: "fa-solid fa-compass",          keywords: ["explore", "discover", "directory", "guide"] },

  // — People ————————————————————————————————————————————————————————
  { iconClass: "fa-light fa-users",            iconActiveClass: "fa-solid fa-users",            keywords: ["team", "teams", "users", "people", "members", "staff", "directory", "roster", "group", "groups"] },
  { iconClass: "fa-light fa-user",             iconActiveClass: "fa-solid fa-user",             keywords: ["user", "profile", "account", "contact", "person"] },
  { iconClass: "fa-light fa-graduation-cap",   iconActiveClass: "fa-solid fa-graduation-cap",   keywords: ["student", "students", "learner", "learners", "trainee", "cohort", "cohorts", "alumni"] },
  { iconClass: "fa-light fa-chalkboard-user",  iconActiveClass: "fa-solid fa-chalkboard-user",  keywords: ["faculty", "instructor", "instructors", "teacher", "teachers", "professor", "lecturer", "educator"] },
  { iconClass: "fa-light fa-user-doctor",      iconActiveClass: "fa-solid fa-user-doctor",      keywords: ["preceptor", "preceptors", "doctor", "physician", "clinician", "provider", "practitioner", "mentor"] },
  { iconClass: "fa-light fa-user-tie",         iconActiveClass: "fa-solid fa-user-tie",         keywords: ["coordinator", "coordinators", "manager", "lead", "leads", "owner", "supervisor"] },
  { iconClass: "fa-light fa-user-shield",      iconActiveClass: "fa-solid fa-user-shield",      keywords: ["admin", "administrator", "admins", "permission", "permissions", "role", "roles"] },
  { iconClass: "fa-light fa-people-roof",      iconActiveClass: "fa-solid fa-people-roof",      keywords: ["site", "sites", "organization", "tenant", "household", "community"] },
  { iconClass: "fa-light fa-address-book",     iconActiveClass: "fa-solid fa-address-book",     keywords: ["contact", "contacts", "address", "directory", "rolodex", "address-book", "addresses"] },

  // — Locations / placements ————————————————————————————————————————
  { iconClass: "fa-light fa-location-dot",     iconActiveClass: "fa-solid fa-location-dot",     keywords: ["placement", "placements", "rotation", "rotations", "location", "locations", "site", "sites", "address", "place"] },
  { iconClass: "fa-light fa-map",              iconActiveClass: "fa-solid fa-map",              keywords: ["map", "maps", "region", "regions", "territory", "territories", "geography"] },
  { iconClass: "fa-light fa-buildings",        iconActiveClass: "fa-solid fa-buildings",        keywords: ["brand", "brands", "network", "company", "companies", "organization", "organizations", "facility", "facilities"] },
  { iconClass: "fa-light fa-hospital",         iconActiveClass: "fa-solid fa-hospital",         keywords: ["hospital", "hospitals", "clinic", "clinics", "medical-center", "ward"] },
  { iconClass: "fa-light fa-route",            iconActiveClass: "fa-solid fa-route",            keywords: ["route", "routes", "path", "paths", "journey", "journeys", "pipeline", "pipelines"] },

  // — Time / scheduling ————————————————————————————————————————————
  { iconClass: "fa-light fa-calendar",         iconActiveClass: "fa-solid fa-calendar",         keywords: ["calendar", "calendars", "schedule", "schedules", "scheduling", "date", "dates", "event", "events", "agenda", "planner", "shift", "shifts", "timesheet", "timetable"] },
  { iconClass: "fa-light fa-calendar-check",   iconActiveClass: "fa-solid fa-calendar-check",   keywords: ["appointment", "appointments", "booking", "bookings", "reservation", "reservations", "rsvp"] },
  { iconClass: "fa-light fa-clock",            iconActiveClass: "fa-solid fa-clock",            keywords: ["time", "clock", "timer", "history", "log", "logs", "duration", "hours"] },
  { iconClass: "fa-light fa-hourglass",        iconActiveClass: "fa-solid fa-hourglass",        keywords: ["pending", "wait", "waiting", "queue", "deadline", "deadlines"] },
  { iconClass: "fa-light fa-bell",             iconActiveClass: "fa-solid fa-bell",             keywords: ["notification", "notifications", "alert", "alerts", "reminder", "reminders", "bell", "ping", "pings"] },

  // — Documents / files / library ————————————————————————————————————
  { iconClass: "fa-light fa-folder-open",      iconActiveClass: "fa-solid fa-folder-open",      keywords: ["document", "documents", "doc", "docs", "file", "files", "folder", "folders", "contract", "contracts", "attachment", "attachments", "upload", "uploads"] },
  { iconClass: "fa-light fa-books",            iconActiveClass: "fa-solid fa-books",            keywords: ["library", "libraries", "catalog", "catalogue", "template", "templates", "book", "books", "resource", "resources"] },
  { iconClass: "fa-light fa-file-lines",       iconActiveClass: "fa-solid fa-file-lines",       keywords: ["form", "forms", "page", "pages", "article", "articles", "post", "posts", "note", "notes"] },
  { iconClass: "fa-light fa-file-pdf",         iconActiveClass: "fa-solid fa-file-pdf",         keywords: ["pdf", "export", "exports", "download", "downloads", "print"] },
  { iconClass: "fa-light fa-cloud-arrow-up",   iconActiveClass: "fa-solid fa-cloud-arrow-up",   keywords: ["upload", "uploads", "import", "imports", "sync"] },

  // — Compliance / safety ————————————————————————————————————————————
  { iconClass: "fa-light fa-shield-check",     iconActiveClass: "fa-solid fa-shield-check",     keywords: ["compliance", "compliant", "audit", "audits", "safety", "shield", "risk", "risks", "verification", "screening", "screenings", "clearance", "clearances", "immunization", "immunizations"] },
  { iconClass: "fa-light fa-lock",             iconActiveClass: "fa-solid fa-lock",             keywords: ["lock", "security", "private", "privacy", "secure"] },
  { iconClass: "fa-light fa-key",              iconActiveClass: "fa-solid fa-key",              keywords: ["key", "keys", "credential", "credentials", "token", "tokens", "secret", "secrets"] },
  { iconClass: "fa-light fa-fingerprint",      iconActiveClass: "fa-solid fa-fingerprint",      keywords: ["identity", "identification", "id", "verify", "verification", "biometric"] },
  { iconClass: "fa-light fa-stethoscope",      iconActiveClass: "fa-solid fa-stethoscope",      keywords: ["clinical", "clinic", "exam", "exams", "encounter", "encounters", "vitals", "physical"] },
  { iconClass: "fa-light fa-syringe",          iconActiveClass: "fa-solid fa-syringe",          keywords: ["vaccine", "vaccination", "vaccinations", "shot", "shots", "immunization"] },

  // — Evaluations / assessments / quality ——————————————————————————
  { iconClass: "fa-light fa-clipboard-check",  iconActiveClass: "fa-solid fa-clipboard-check",  keywords: ["evaluation", "evaluations", "assessment", "assessments", "review", "reviews", "rubric", "rubrics", "feedback", "checklist", "checklists"] },
  { iconClass: "fa-light fa-list-check",       iconActiveClass: "fa-solid fa-list-check",       keywords: ["task", "tasks", "todo", "todos", "checklist", "checklists", "action", "actions", "workflow", "workflows"] },
  { iconClass: "fa-light fa-star",             iconActiveClass: "fa-solid fa-star",             keywords: ["favorite", "favorites", "rating", "ratings", "star", "stars", "highlight", "featured"] },
  { iconClass: "fa-light fa-thumbs-up",        iconActiveClass: "fa-solid fa-thumbs-up",        keywords: ["approval", "approvals", "approve", "endorse", "endorsement", "sign-off", "signoff"] },
  { iconClass: "fa-light fa-medal",            iconActiveClass: "fa-solid fa-medal",            keywords: ["badge", "badges", "achievement", "achievements", "award", "awards"] },
  { iconClass: "fa-light fa-certificate",      iconActiveClass: "fa-solid fa-certificate",      keywords: ["certificate", "certificates", "certification", "certifications", "credential", "license", "licenses"] },

  // — Data / analytics ————————————————————————————————————————————————
  { iconClass: "fa-light fa-chart-line",       iconActiveClass: "fa-solid fa-chart-line",       keywords: ["report", "reports", "analytic", "analytics", "insight", "insights", "trend", "trends", "metric", "metrics", "growth", "performance", "stats", "statistics"] },
  { iconClass: "fa-light fa-chart-pie",        iconActiveClass: "fa-solid fa-chart-pie",        keywords: ["pie", "share", "split", "distribution", "breakdown"] },
  { iconClass: "fa-light fa-chart-column",     iconActiveClass: "fa-solid fa-chart-column",     keywords: ["bar-chart", "comparison", "compare", "ranking", "rankings"] },
  { iconClass: "fa-light fa-database",         iconActiveClass: "fa-solid fa-database",         keywords: ["database", "data", "dataset", "datasets", "record", "records", "store", "warehouse"] },
  { iconClass: "fa-light fa-table",            iconActiveClass: "fa-solid fa-table",            keywords: ["table", "tables", "grid", "spreadsheet", "list", "lists", "rows"] },
  { iconClass: "fa-light fa-magnifying-glass-chart", iconActiveClass: "fa-solid fa-magnifying-glass-chart", keywords: ["analyze", "analysis", "deep-dive", "drill"] },

  // — Communication ——————————————————————————————————————————————————
  { iconClass: "fa-light fa-inbox",            iconActiveClass: "fa-solid fa-inbox",            keywords: ["inbox", "mailbox", "queue"] },
  { iconClass: "fa-light fa-envelope",         iconActiveClass: "fa-solid fa-envelope",         keywords: ["mail", "email", "emails", "letter", "letters", "envelope"] },
  { iconClass: "fa-light fa-message",          iconActiveClass: "fa-solid fa-message",          keywords: ["message", "messages", "chat", "chats", "conversation", "conversations", "thread", "threads", "comment", "comments", "discussion", "discussions"] },
  { iconClass: "fa-light fa-megaphone",        iconActiveClass: "fa-solid fa-megaphone",        keywords: ["announcement", "announcements", "broadcast", "broadcasts", "news", "updates"] },
  { iconClass: "fa-light fa-newspaper",        iconActiveClass: "fa-solid fa-newspaper",        keywords: ["news", "press", "feed", "blog", "blogs", "article", "articles"] },
  { iconClass: "fa-light fa-phone",            iconActiveClass: "fa-solid fa-phone",            keywords: ["phone", "call", "calls", "telephone"] },
  { iconClass: "fa-light fa-video",            iconActiveClass: "fa-solid fa-video",            keywords: ["video", "videos", "meeting", "meetings", "conference", "conferences"] },

  // — Search / find ——————————————————————————————————————————————————
  { iconClass: "fa-light fa-magnifying-glass", iconActiveClass: "fa-solid fa-magnifying-glass", keywords: ["search", "find", "lookup", "query", "queries", "filter", "filters"] },
  { iconClass: "fa-light fa-tags",             iconActiveClass: "fa-solid fa-tags",             keywords: ["tag", "tags", "label", "labels", "category", "categories", "topic", "topics"] },
  { iconClass: "fa-light fa-bookmark",         iconActiveClass: "fa-solid fa-bookmark",         keywords: ["bookmark", "bookmarks", "saved", "favorites"] },

  // — Money / billing ————————————————————————————————————————————————
  { iconClass: "fa-light fa-credit-card",      iconActiveClass: "fa-solid fa-credit-card",      keywords: ["billing", "invoice", "invoices", "payment", "payments", "card", "checkout"] },
  { iconClass: "fa-light fa-coins",            iconActiveClass: "fa-solid fa-coins",            keywords: ["finance", "money", "currency", "balance", "balances", "wallet"] },
  { iconClass: "fa-light fa-receipt",          iconActiveClass: "fa-solid fa-receipt",          keywords: ["receipt", "receipts", "transaction", "transactions", "expense", "expenses"] },
  { iconClass: "fa-light fa-chart-mixed",      iconActiveClass: "fa-solid fa-chart-mixed",      keywords: ["budget", "budgets", "forecast", "forecasts", "projection", "projections"] },
  { iconClass: "fa-light fa-tag",              iconActiveClass: "fa-solid fa-tag",              keywords: ["price", "pricing", "discount", "discounts", "deal", "deals"] },

  // — Marketing / sales ————————————————————————————————————————————
  { iconClass: "fa-light fa-bullseye",         iconActiveClass: "fa-solid fa-bullseye",         keywords: ["goal", "goals", "target", "targets", "objective", "objectives", "milestone", "milestones", "okr", "okrs"] },
  { iconClass: "fa-light fa-funnel-dollar",    iconActiveClass: "fa-solid fa-funnel-dollar",    keywords: ["funnel", "funnels", "lead", "leads", "conversion", "conversions"] },
  { iconClass: "fa-light fa-people-arrows",    iconActiveClass: "fa-solid fa-people-arrows",    keywords: ["audience", "audiences", "segment", "segments", "targeting"] },
  { iconClass: "fa-light fa-rocket",           iconActiveClass: "fa-solid fa-rocket",           keywords: ["launch", "launches", "campaign", "campaigns", "release", "releases", "ship", "shipping"] },

  // — Workflow / process ————————————————————————————————————————————
  { iconClass: "fa-light fa-list-tree",        iconActiveClass: "fa-solid fa-list-tree",        keywords: ["hierarchy", "tree", "structure", "nested"] },
  { iconClass: "fa-light fa-diagram-project",  iconActiveClass: "fa-solid fa-diagram-project",  keywords: ["project", "projects", "workflow", "workflows", "diagram", "process", "processes"] },
  { iconClass: "fa-light fa-arrows-rotate",    iconActiveClass: "fa-solid fa-arrows-rotate",    keywords: ["sync", "refresh", "reload", "update", "updates"] },
  { iconClass: "fa-light fa-flag",             iconActiveClass: "fa-solid fa-flag",             keywords: ["flag", "flags", "issue", "issues", "report", "flagged"] },

  // — Tools / dev / admin ——————————————————————————————————————————
  { iconClass: "fa-light fa-gear",             iconActiveClass: "fa-solid fa-gear",             keywords: ["setting", "settings", "config", "configuration", "preference", "preferences", "options"] },
  { iconClass: "fa-light fa-toolbox",          iconActiveClass: "fa-solid fa-toolbox",          keywords: ["tool", "tools", "toolbox", "utility", "utilities"] },
  { iconClass: "fa-light fa-plug",             iconActiveClass: "fa-solid fa-plug",             keywords: ["integration", "integrations", "webhook", "webhooks", "connector", "connectors", "plugin", "plugins"] },
  { iconClass: "fa-light fa-code",             iconActiveClass: "fa-solid fa-code",             keywords: ["code", "develop", "developer", "developers", "script", "scripts", "snippet", "snippets"] },
  { iconClass: "fa-light fa-terminal",         iconActiveClass: "fa-solid fa-terminal",         keywords: ["terminal", "console", "shell", "command", "commands"] },
  { iconClass: "fa-light fa-bug",              iconActiveClass: "fa-solid fa-bug",              keywords: ["bug", "bugs", "issue", "defect", "defects", "error", "errors"] },
  { iconClass: "fa-light fa-server",           iconActiveClass: "fa-solid fa-server",           keywords: ["server", "servers", "host", "hosts", "infrastructure"] },
  { iconClass: "fa-light fa-cloud",            iconActiveClass: "fa-solid fa-cloud",            keywords: ["cloud", "saas", "online", "remote"] },
  { iconClass: "fa-light fa-shield-halved",    iconActiveClass: "fa-solid fa-shield-halved",    keywords: ["governance", "policy", "policies", "guardrail", "guardrails"] },

  // — Education / curriculum ——————————————————————————————————————
  { iconClass: "fa-light fa-book-open",        iconActiveClass: "fa-solid fa-book-open",        keywords: ["course", "courses", "lesson", "lessons", "class", "classes", "curriculum", "syllabus"] },
  { iconClass: "fa-light fa-pen-to-square",    iconActiveClass: "fa-solid fa-pen-to-square",    keywords: ["edit", "compose", "draft", "drafts", "submission", "submissions", "essay", "essays"] },
  { iconClass: "fa-light fa-microphone",       iconActiveClass: "fa-solid fa-microphone",       keywords: ["lecture", "lectures", "podcast", "podcasts", "recording", "recordings"] },

  // — Health / clinical ————————————————————————————————————————————
  { iconClass: "fa-light fa-heart-pulse",      iconActiveClass: "fa-solid fa-heart-pulse",      keywords: ["patient", "patients", "health", "vitals", "case", "cases"] },
  { iconClass: "fa-light fa-prescription-bottle-medical", iconActiveClass: "fa-solid fa-prescription-bottle-medical", keywords: ["prescription", "prescriptions", "medication", "medications", "drug", "drugs"] },
  { iconClass: "fa-light fa-microscope",       iconActiveClass: "fa-solid fa-microscope",       keywords: ["lab", "labs", "research", "experiment", "experiments", "specimen"] },
  { iconClass: "fa-light fa-flask",            iconActiveClass: "fa-solid fa-flask",            keywords: ["test", "tests", "experiment", "experiments", "trial", "trials"] },

  // — Support / help ————————————————————————————————————————————————
  { iconClass: "fa-light fa-life-ring",        iconActiveClass: "fa-solid fa-life-ring",        keywords: ["help", "support", "faq", "knowledge", "assistance"] },
  { iconClass: "fa-light fa-circle-question",  iconActiveClass: "fa-solid fa-circle-question",  keywords: ["question", "questions", "query", "ask", "info"] },
  { iconClass: "fa-light fa-ticket",           iconActiveClass: "fa-solid fa-ticket",           keywords: ["ticket", "tickets", "incident", "incidents", "case", "cases"] },

  // — Misc utilities ————————————————————————————————————————————————
  { iconClass: "fa-light fa-sparkles",         iconActiveClass: "fa-solid fa-sparkles",         keywords: ["new", "feature", "ai", "magic", "spark", "sparkle"] },
  { iconClass: "fa-light fa-lightbulb",        iconActiveClass: "fa-solid fa-lightbulb",        keywords: ["idea", "ideas", "tip", "tips", "suggestion", "suggestions"] },
  { iconClass: "fa-light fa-puzzle-piece",     iconActiveClass: "fa-solid fa-puzzle-piece",     keywords: ["module", "modules", "extension", "extensions", "addon", "addons"] },
  { iconClass: "fa-light fa-globe",            iconActiveClass: "fa-solid fa-globe",            keywords: ["world", "global", "international", "language", "languages", "locale", "locales"] },
  { iconClass: "fa-light fa-share-nodes",      iconActiveClass: "fa-solid fa-share-nodes",      keywords: ["share", "social", "broadcast"] },
  { iconClass: "fa-light fa-paperclip",        iconActiveClass: "fa-solid fa-paperclip",        keywords: ["attachment", "attach", "paperclip", "clip"] },
] as const

/**
 * Module-init: precompute a `Set` of keywords per candidate so the hot
 * inference loop uses O(1) `Set#has()` lookups instead of repeated
 * `Array#includes` (O(n) per call).
 *
 * For substring fallback we also pre-join each keyword set into a single
 * delimited string (`|word1|word2|…|`). A token "matches" if either side
 * is a substring of the other — and once joined, that becomes a single
 * `String#indexOf` per candidate instead of an array iteration. This is
 * a real perf win (one substring scan over a ~50-char joined string vs.
 * up to ~8 small string scans) and also keeps the hot inference loop
 * free of any `.includes`/`.indexOf` calls inside a nested loop, which
 * is what the `react-doctor/js-set-map-lookups` rule flags.
 */
interface NavIconKeywordIndex {
  readonly set: ReadonlySet<string>
  /**
   * Alternation of escaped keywords (≥ 4 chars), e.g. `compliance|cohort|…`.
   * `regex.test(token)` returns true if any keyword is a substring of the
   * token — covers the realistic "user types a compound word that contains
   * one of our keywords" case (e.g. "compliancetracker" → matches `compliance`).
   * One precompiled regex per candidate, so the hot inference loop runs a
   * single `RegExp#test` per token — no `Array#indexOf`/`String#includes`
   * inside a nested loop, which is what `react-doctor/js-set-map-lookups`
   * flags.
   */
  readonly substringRegex: RegExp | null
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const NAV_ICON_KEYWORDS_INDEX: ReadonlyMap<NavIconCandidate, NavIconKeywordIndex> = new Map(
  NAV_ICON_LIBRARY.map(candidate => {
    const set = new Set(candidate.keywords)
    const longKeywords = candidate.keywords.filter(k => k.length >= 4)
    const substringRegex = longKeywords.length
      ? new RegExp(longKeywords.map(escapeRegExp).join("|"))
      : null
    return [candidate, { set, substringRegex }] as const
  }),
)

const NAV_ICON_FALLBACK = {
  iconClass: "fa-light fa-list-tree",
  iconActiveClass: "fa-solid fa-list-tree",
} as const

const STOPWORDS: ReadonlySet<string> = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "by",
  "my", "your", "our", "all", "new", "old", "any", "some", "with", "without",
])

/**
 * Lowercase + tokenize. We emit two flavours:
 *  - word-split tokens (drop stopwords + 1-char fragments)
 *  - the full input with non-alphanumerics stripped, so hyphenated words
 *    like "to-do" → "todo" still match a single keyword.
 *
 * Duplicates are de-duped at the call site by the score loop so they
 * don't double-count.
 */
function tokenizeNavTitle(text: string): string[] {
  const lower = text.toLowerCase()
  const split = lower.split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOPWORDS.has(t))
  const stripped = lower.replace(/[^a-z0-9]+/g, "")
  if (stripped.length > 1 && !split.includes(stripped) && !STOPWORDS.has(stripped)) {
    return [...split, stripped]
  }
  return split
}

function singularize(token: string): string {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith("es") && token.length > 3 && /(s|x|z|ch|sh)es$/.test(token)) return token.slice(0, -2)
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1)
  return token
}

/**
 * Score-based icon match. We try multiple normalizations for each token
 * (raw, singular, plural) so "Reports" lands on the same glyph as
 * "Report"; we accept substring matches for longer tokens so "rotational"
 * still matches "rotation". Specific glyphs win ties over generic ones
 * via a small length penalty (`-keywords.length * 0.01`).
 */
function inferIconFromTitle(title: string): { iconClass: string; iconActiveClass: string } {
  const tokens = tokenizeNavTitle(title)
  if (tokens.length === 0) return NAV_ICON_FALLBACK

  let best: { score: number; candidate: NavIconCandidate } | null = null
  for (const candidate of NAV_ICON_LIBRARY) {
    const index = NAV_ICON_KEYWORDS_INDEX.get(candidate)!
    let score = 0
    for (const token of tokens) {
      const singular = singularize(token)
      const plural = `${singular}s`
      if (index.set.has(token)) {
        score += 6
      } else if (index.set.has(singular) || index.set.has(plural)) {
        score += 5
      } else if (
        token.length >= 4 &&
        index.substringRegex !== null &&
        index.substringRegex.test(token)
      ) {
        score += 2
      }
    }
    if (score === 0) continue
    // Prefer specific glyphs (smaller keyword set) on a tie.
    const adjusted = score - candidate.keywords.length * 0.01
    if (!best || adjusted > best.score) best = { score: adjusted, candidate }
  }
  return best
    ? { iconClass: best.candidate.iconClass, iconActiveClass: best.candidate.iconActiveClass }
    : NAV_ICON_FALLBACK
}

type ProductPickKind = "prism" | "one" | "custom"

function isPredefinedPick(id: ProductPickKind): id is "prism" | "one" {
  return id === "prism" || id === "one"
}

/** Built-in switcher product for a predefined onboarding pick. */
function resolveBuiltinProductId(pickId: ProductPickKind, scope: ScopeKind): Product {
  if (pickId === "prism") return "exxat-prism"
  if (pickId === "one") {
    return scope === "brand-site-location" ? "exxat-one-sites" : "exxat-one-schools"
  }
  return "exxat-custom"
}

interface ProductPick {
  id: ProductPickKind
  /** Built-in product the wordmark + brand color come from (when not custom). */
  brandSource?: Product
  caption: string
  /** Defaults that preload the rest of the onboarding (scope, persona, nav). */
  suffix: string
  brandColor: string
  scopeKind: ScopeKind
  persona: string
  navKeys: ReadonlyArray<string>
}

/**
 * Step-1 product picks. Prism and Exxat One wire the built-in switcher
 * products (no tenant clone). Custom creates a draft custom product +
 * includes the primary-nav builder step.
 */
const PRODUCT_PICKS: ReadonlyArray<ProductPick> = [
  {
    id: "prism",
    brandSource: "exxat-prism",
    caption: "School + program scope, placements, compliance, and curriculum nav.",
    suffix: "Prism",
    brandColor: "oklch(57.84% 0.1560 279.93)",
    scopeKind: "school-program",
    persona: "program-coordinator",
    navKeys: ["library", "placements", "team", "compliance"],
  },
  {
    id: "one",
    brandSource: "exxat-one-schools",
    caption: "School or site scope — coordinator workflows with built-in Exxat One nav.",
    suffix: "One",
    brandColor: "oklch(57.84% 0.1560 279.93)",
    scopeKind: "school-program",
    persona: "program-coordinator",
    navKeys: ["placements", "team", "compliance", "documents"],
  },
  {
    id: "custom",
    caption: "Build your own — pick a name, color, scope, and starter nav.",
    // Empty by default so the wordmark field shows its placeholder ("Assessment")
    // rather than pre-filling a literal name the user has to clear first.
    suffix: "",
    brandColor: brandAccentOklchFromHue(195),
    scopeKind: "school-program",
    persona: "program-coordinator",
    navKeys: ["library", "placements", "team"],
  },
] as const

interface NavRow {
  key: string
  title: string
  caption?: string
  segment: string
  iconClass: string
  iconActiveClass: string
  hasSecondary?: boolean
}

function librarySubChildren(slug: string): SerializableNavLink[] {
  const root = `/${slug}`
  return [
    {
      key: "library-hub",
      title: "Library home",
      url: `${root}/library`,
      iconClass: "fa-light fa-sparkles",
      iconActiveClass: "fa-solid fa-sparkles",
      primaryHubChildKey: "library-hub",
    },
    {
      key: "library-search",
      title: "Search",
      url: `${root}/library/find`,
      iconClass: "fa-light fa-magnifying-glass",
      iconActiveClass: "fa-solid fa-magnifying-glass",
    },
    {
      key: "library-all",
      title: "All items",
      url: `${root}/library/all`,
      iconClass: "fa-light fa-table-list",
      iconActiveClass: "fa-solid fa-table-list",
    },
  ]
}

function buildNavLinks(slug: string, rows: ReadonlyArray<NavRow>): SerializableNavLink[] {
  const root = `/${slug}`
  const links: SerializableNavLink[] = [
    {
      key: "dashboard",
      title: "Dashboard",
      url: `${root}/dashboard`,
      iconClass: "fa-light fa-gauge-high",
      iconActiveClass: "fa-solid fa-gauge-high",
    },
  ]
  for (const row of rows) {
    const link: SerializableNavLink = {
      key: row.key,
      title: row.title,
      url: `${root}/${row.segment}`,
      iconClass: row.iconClass,
      iconActiveClass: row.iconActiveClass,
    }
    if (row.hasSecondary) {
      link.secondaryPanel = row.key === "library" ? "library" : row.key
      link.primaryHubChildKey = `${row.key}-hub`
      if (row.key === "library") {
        link.children = librarySubChildren(slug)
      }
    }
    links.push(link)
  }
  return links
}

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

interface OptionCardProps {
  selected: boolean
  icon: string
  title: string
  caption: string
  onClick: () => void
}

function OptionCard({ selected, icon, title, caption, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2 border p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-foreground bg-foreground text-background shadow-sm"
          : "border-border bg-background hover:border-foreground/40 hover:bg-muted/30",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 items-center justify-center rounded-2 text-base",
          selected ? "bg-background/15 text-background" : "bg-muted text-muted-foreground",
        )}
      >
        <i className={`fa-light ${icon}`} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn("block text-sm font-semibold", selected ? "text-background" : "text-foreground")}>
          {title}
        </span>
        <span
          className={cn(
            "block text-xs leading-snug",
            selected ? "text-background/80" : "text-muted-foreground",
          )}
        >
          {caption}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-background bg-background text-foreground"
            : "border-border bg-background",
        )}
      >
        {selected ? <i className="fa-solid fa-circle text-[8px]" aria-hidden="true" /> : null}
      </span>
    </button>
  )
}

function ListSelect({
  id,
  label,
  value,
  options,
  onChange,
  description,
}: {
  id: string
  label: string
  value: string
  options: ReadonlyArray<string>
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Pick a ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export default function BuilderOnboardingPage() {
  const navigate = useNavigate()
  const addCustomProduct = useAppStore(state => state.addCustomProduct)
  const updateCustomProduct = useAppStore(state => state.updateCustomProduct)
  const setActiveCustomIndex = useAppStore(state => state.setActiveCustomIndex)
  const setProduct = useAppStore(state => state.setProduct)
  const setStartupProduct = useAppStore(state => state.setStartupProduct)
  const setCustomProducts = useAppStore(state => state.setCustomProducts)
  const removeCustomProduct = useAppStore(state => state.removeCustomProduct)
  const customProducts = useAppStore(state => state.customProducts)

  const productIndexRef = React.useRef<number | null>(null)
  const committedSlugRef = React.useRef<string | null>(null)

  // Default to "custom" so the wordmark editor + color picker are visible on
  // first paint — Prism / One are alternatives, not the default.
  const [pickId, setPickId] = React.useState<ProductPickKind>("custom")
  const [stepIndex, setStepIndex] = React.useState(0)
  const activeSteps = React.useMemo(
    () => (isPredefinedPick(pickId) ? STEPS.filter(s => s.id !== "nav") : STEPS),
    [pickId],
  )
  const step = activeSteps[stepIndex]!
  const isLastStep = stepIndex === activeSteps.length - 1

  const customPick = PRODUCT_PICKS.find(p => p.id === "custom")!
  const [suffix, setSuffix] = React.useState(customPick.suffix)
  const [brandColor, setBrandColor] = React.useState<string>(() => customPick.brandColor)
  const [scopeKind, setScopeKind] = React.useState<ScopeKind>("school-program")
  const [scopeFields, setScopeFields] = React.useState({
    schoolName: SCHOOL_OPTIONS[0]!,
    programName: PROGRAM_OPTIONS[0]!,
    brandName: BRAND_OPTIONS[0]!,
    siteName: SITE_OPTIONS[0]!,
    locationName: LOCATION_OPTIONS[0]!,
  })
  const [persona, setPersona] = React.useState<string>("program-coordinator")
  const [navRows, setNavRows] = React.useState<NavRow[]>(() =>
    customPick.navKeys
      .map(k => NAV_SUGGESTIONS.find(s => s.key === k))
      .filter((s): s is NavSuggestion => Boolean(s))
      .map(s => ({
        key: s.key,
        title: s.title,
        caption: s.caption,
        segment: s.segment,
        iconClass: s.iconClass,
        iconActiveClass: s.iconActiveClass,
        hasSecondary: s.hasSecondary,
      })),
  )

  function clearDraftProduct() {
    if (productIndexRef.current === null) return
    const staleIdx = productIndexRef.current
    removeCustomProduct(staleIdx)
    productIndexRef.current = null
    committedSlugRef.current = null
  }

  function applyProductPick(pick: ProductPick) {
    const rows = pick.navKeys
      .map(k => NAV_SUGGESTIONS.find(s => s.key === k))
      .filter((s): s is NavSuggestion => Boolean(s))
      .map(s => ({
        key: s.key,
        title: s.title,
        caption: s.caption,
        segment: s.segment,
        iconClass: s.iconClass,
        iconActiveClass: s.iconActiveClass,
        hasSecondary: s.hasSecondary,
      }))
    setPickId(pick.id)
    setSuffix(pick.suffix)
    setBrandColor(pick.brandColor)
    setScopeKind(pick.scopeKind)
    setPersona(pick.persona)
    setNavRows(rows)
    if (isPredefinedPick(pick.id)) {
      clearDraftProduct()
      setProduct(resolveBuiltinProductId(pick.id, pick.scopeKind))
    } else if (productIndexRef.current !== null) {
      commitDraftProduct(pick.suffix, pick.brandColor, rows)
    }
  }

  const slug = customProductSlugFromSuffix(suffix)
  const personasForScope = PERSONAS_BY_SCOPE[scopeKind]
  const customNameError = pickId === "custom" && suffix.trim()
    ? validateCustomProductSuffix(suffix, customProducts)
    : null

  const previewBrand = React.useMemo(
    () => ({ suffix: suffix.trim() || "Product", brandColor }),
    [suffix, brandColor],
  )

  React.useEffect(() => {
    if (!personasForScope.some(p => p.id === persona)) {
      setPersona(personasForScope[0]!.id)
    }
  }, [personasForScope, persona])

  React.useEffect(() => {
    setStepIndex(idx => Math.min(idx, activeSteps.length - 1))
  }, [activeSteps.length])

  React.useEffect(() => {
    if (!isPredefinedPick(pickId)) return
    setProduct(resolveBuiltinProductId(pickId, scopeKind))
  }, [pickId, scopeKind, setProduct])

  /**
   * Create or update the single draft product so the live sidebar preview and
   * the active product both track the in-progress selection.
   *
   * The tenant catalog upsert is keyed by slug, so a name change (re-picking
   * Exam → One, or editing the custom wordmark) would otherwise create a
   * *second* product and leave `activeCustomIndex` stuck on the first one — the
   * user picks a new product and nothing changes. When the slug changes we
   * remove the stale draft and add the new identity, re-pointing the active
   * product so the switcher + sidebar follow the pick.
   */
  function commitDraftProduct(
    nextSuffix: string,
    nextColor: string,
    rows: ReadonlyArray<NavRow> = navRows,
  ) {
    const finalSuffix = nextSuffix.trim() || "Product"
    const normalizedColor = normalizeBrandAccentColor(nextColor)
    const nextSlug = customProductSlugFromSuffix(finalSuffix)

    const slugChanged =
      committedSlugRef.current !== null && committedSlugRef.current !== nextSlug

    if (productIndexRef.current !== null && slugChanged) {
      const state = useAppStore.getState()
      const staleIdx = state.customProducts.findIndex(
        p => customProductSlugFromSuffix(p.suffix) === committedSlugRef.current,
      )
      if (staleIdx >= 0) removeCustomProduct(staleIdx)
      productIndexRef.current = null
      committedSlugRef.current = null
    }

    if (productIndexRef.current === null) {
      const idx = addCustomProduct({ suffix: finalSuffix, brandColor: normalizedColor })
      productIndexRef.current = idx
      committedSlugRef.current = nextSlug
      setActiveCustomIndex(idx)
      setProduct("exxat-custom")
      pushNav(finalSuffix, rows)
      return idx
    }
    updateCustomProduct(productIndexRef.current, {
      suffix: finalSuffix,
      brandColor: normalizedColor,
    })
    committedSlugRef.current = nextSlug
    pushNav(finalSuffix, rows)
    return productIndexRef.current
  }

  function pushNav(currentSuffix: string, rows: ReadonlyArray<NavRow>) {
    const finalSlug = customProductSlugFromSuffix(currentSuffix.trim() || "Product")
    const recordId = `tenant-${finalSlug}`
    const links = buildNavLinks(finalSlug, rows)
    updateTenantProductNav(recordId, links)
    setCustomProducts(syncCustomProductsMirror())
  }

  function persistContext(currentSuffix: string) {
    const finalSlug = customProductSlugFromSuffix(currentSuffix.trim() || "Product")
    const recordId = `tenant-${finalSlug}`
    setTenantProductData(recordId, "preferences.builder", {
      scope: scopeKind,
      scopeFields,
      persona,
      navRows: navRows.map(r => ({ key: r.key, title: r.title, segment: r.segment })),
      onboardedAt: new Date().toISOString(),
    })
  }

  function finishOnboarding() {
    setStorageItem(ONBOARDING_COMPLETE_KEY, "true")
    if (isPredefinedPick(pickId)) {
      const builtin = resolveBuiltinProductId(pickId, scopeKind)
      setStartupProduct({ product: builtin })
      navigate(`/${productSlug(builtin)}/dashboard`)
      return
    }
    commitDraftProduct(suffix, brandColor)
    persistContext(suffix)
    setStartupProduct({
      product: "exxat-custom",
      customIndex: productIndexRef.current ?? 0,
    })
    navigate(`/${slug}/dashboard`)
  }

  function handleNext() {
    if (step.id === "identity" && pickId === "custom") {
      commitDraftProduct(suffix, brandColor)
    }
    if (isLastStep) {
      finishOnboarding()
      return
    }
    setStepIndex(idx => Math.min(idx + 1, activeSteps.length - 1))
  }

  function handleBack() {
    setStepIndex(idx => Math.max(idx - 1, 0))
  }

  function handleSkip() {
    setStorageItem(ONBOARDING_COMPLETE_KEY, "true")
    navigate("/prism/dashboard")
  }

  // Live preview — when user edits identity step, push live updates so the
  // sidebar mirrors the in-progress product (Shopify dashboard pattern).
  React.useEffect(() => {
    if (isPredefinedPick(pickId) || productIndexRef.current === null) return
    commitDraftProduct(suffix, brandColor, navRows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suffix, brandColor, pickId])

  React.useEffect(() => {
    if (isPredefinedPick(pickId) || productIndexRef.current === null) return
    pushNav(suffix, navRows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRows, pickId])

  const canAdvance = (() => {
    if (step.id === "identity") {
      if (isPredefinedPick(pickId)) return true
      return suffix.trim().length > 0 && !customNameError
    }
    if (step.id === "scope")
      return scopeKind === "school-program"
        ? scopeFields.schoolName.trim().length > 0
        : scopeFields.brandName.trim().length > 0
    if (step.id === "persona") return Boolean(persona)
    if (step.id === "nav") return navRows.length > 0
    return true
  })()

  function addNavRow(row: NavRow) {
    setNavRows(current =>
      current.some(r => r.key === row.key) ? current : [...current, row],
    )
  }

  function removeNavRow(key: string) {
    setNavRows(current => current.filter(r => r.key !== key))
  }

  function moveNavRow(key: string, direction: -1 | 1) {
    setNavRows(current => {
      const idx = current.findIndex(r => r.key === key)
      if (idx < 0) return current
      const nextIdx = idx + direction
      if (nextIdx < 0 || nextIdx >= current.length) return current
      const next = [...current]
      const [item] = next.splice(idx, 1)
      next.splice(nextIdx, 0, item!)
      return next
    })
  }

  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      // `pb-0` overrides the default `pb-6` on `SidebarInset` so the
      // animated blob can paint to the bottom rounded corners. The card
      // body keeps its own bottom padding (`pb-16`) below.
      className="overflow-hidden !pb-0"
    >
      <Shortcut keys="Enter" onInvoke={() => canAdvance && handleNext()} />
      <Shortcut keys="Esc" onInvoke={handleSkip} />

      <BlobBackground stepIndex={stepIndex} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col px-6 pb-16 pt-12 lg:px-12">
          <header className="mx-auto w-full max-w-2xl text-center">
            <h1
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.25rem]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Welcome to Exxat!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer some questions for a faster, easier setup.
            </p>
          </header>

          <div className="mx-auto mt-10 w-full max-w-2xl">
            <CardDeck stepIndex={stepIndex}>
              <section
                role="group"
                aria-labelledby="onboarding-step-heading"
                className="grid gap-5 p-6 sm:p-8"
              >
                <div>
                  <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground">
                    Step {stepIndex + 1} of {activeSteps.length}
                  </p>
                  <h2
                    id="onboarding-step-heading"
                    className="text-xl font-semibold tracking-tight text-foreground"
                  >
                    {step.title}
                  </h2>
                  {step.subtitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
                  ) : null}
                </div>

                {step.id === "identity" ? (
                  <div className="grid gap-5">
                    <div
                      role="radiogroup"
                      aria-label="Product"
                      className="grid gap-2 sm:grid-cols-3"
                    >
                      {PRODUCT_PICKS.map(pick => (
                        <ProductPickCard
                          key={pick.id}
                          pick={pick}
                          selected={pickId === pick.id}
                          onClick={() => applyProductPick(pick)}
                        />
                      ))}
                    </div>
                    {pickId === "custom" ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="onboarding-product-name">Product name</Label>
                          <div className="flex min-h-[3.25rem] items-end rounded-2 border border-border bg-background px-4 py-3">
                            <ExxatProductWordmarkEditor
                              suffixId="onboarding-product-name"
                              previewCustomBrand={previewBrand}
                              suffixValue={suffix}
                              onSuffixChange={setSuffix}
                              suffixPlaceholder="Enter product name"
                              className="w-auto max-w-full"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lives at <code className="font-mono">/{slug}</code>. Updates the wordmark
                            in the sidebar on the left as you type.
                          </p>
                          {customNameError ? (
                            <p className="text-xs text-destructive">{customNameError}</p>
                          ) : null}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="onboarding-brand-color">Brand color</Label>
                          <div className="w-full max-w-xs">
                            <BrandColorPicker
                              id="onboarding-brand-color"
                              value={brandColor}
                              onChange={setBrandColor}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tints sidebar accents, key metrics, and chart highlights for this
                            product.
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-2 border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                        Using the {pickId === "prism" ? "Exxat Prism" : "Exxat One"} wordmark and
                        brand color. The next steps tailor scope and persona for this product — no
                        custom clone is created.
                      </p>
                    )}
                  </div>
                ) : null}

                {step.id === "context" ? (
                  <div className="grid gap-3" role="radiogroup" aria-label="Product scope">
                    <OptionCard
                      selected={scopeKind === "school-program"}
                      icon="fa-building-columns"
                      title="School & program"
                      caption="Schools, programs, cohorts, and students. Best for Prism-style products."
                      onClick={() => setScopeKind("school-program")}
                    />
                    <OptionCard
                      selected={scopeKind === "brand-site-location"}
                      icon="fa-buildings"
                      title="Brand, site & location"
                      caption="Multi-site networks, locations, and shifts. Best for Exxat One — Sites style products."
                      onClick={() => setScopeKind("brand-site-location")}
                    />
                  </div>
                ) : null}

                {step.id === "scope" ? (
                  <div className="grid gap-4">
                    {scopeKind === "school-program" ? (
                      <>
                        <ListSelect
                          id="onboarding-school"
                          label="School"
                          value={scopeFields.schoolName}
                          options={SCHOOL_OPTIONS}
                          onChange={value =>
                            setScopeFields(prev => ({ ...prev, schoolName: value }))
                          }
                        />
                        <ListSelect
                          id="onboarding-program"
                          label="Program"
                          value={scopeFields.programName}
                          options={PROGRAM_OPTIONS}
                          onChange={value =>
                            setScopeFields(prev => ({ ...prev, programName: value }))
                          }
                        />
                      </>
                    ) : (
                      <>
                        <ListSelect
                          id="onboarding-brand-name"
                          label="Brand"
                          value={scopeFields.brandName}
                          options={BRAND_OPTIONS}
                          onChange={value =>
                            setScopeFields(prev => ({ ...prev, brandName: value }))
                          }
                        />
                        <ListSelect
                          id="onboarding-site"
                          label="Sample site"
                          value={scopeFields.siteName}
                          options={SITE_OPTIONS}
                          onChange={value =>
                            setScopeFields(prev => ({ ...prev, siteName: value }))
                          }
                        />
                        <ListSelect
                          id="onboarding-location"
                          label="Sample location"
                          value={scopeFields.locationName}
                          options={LOCATION_OPTIONS}
                          onChange={value =>
                            setScopeFields(prev => ({ ...prev, locationName: value }))
                          }
                        />
                      </>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Stored as builder context — Ask Leo and product templates use these names so
                      sample data matches your domain.
                    </p>
                  </div>
                ) : null}

                {step.id === "persona" ? (
                  <div className="grid gap-3" role="radiogroup" aria-label="Primary persona">
                    {personasForScope.map(option => (
                      <OptionCard
                        key={option.id}
                        selected={persona === option.id}
                        icon={option.icon}
                        title={option.label}
                        caption={option.caption}
                        onClick={() => setPersona(option.id)}
                      />
                    ))}
                  </div>
                ) : null}

                {step.id === "nav" ? (
                  <NavBuilder
                    rows={navRows}
                    onAdd={addNavRow}
                    onRemove={removeNavRow}
                    onMove={moveNavRow}
                  />
                ) : null}

                <footer className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {stepIndex === 0 ? (
                    <Button type="button" variant="ghost" onClick={handleSkip}>
                      I’ll set this up later
                      <KbdGroup className="ml-1.5">
                        <Kbd variant="bare">Esc</Kbd>
                      </KbdGroup>
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={handleBack}>
                      <i className="fa-light fa-arrow-left mr-2" aria-hidden="true" />
                      Back
                    </Button>
                  )}
                  <Button type="button" onClick={handleNext} disabled={!canAdvance}>
                    {isLastStep ? "Get started" : "Next"}
                    <KbdGroup className="ml-1.5">
                      <Kbd variant="bare">⏎</Kbd>
                    </KbdGroup>
                  </Button>
                </footer>
              </section>
            </CardDeck>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              The sidebar on the left is the live preview — your changes appear there as you go.
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}

interface ProductPickCardProps {
  pick: ProductPick
  selected: boolean
  onClick: () => void
}

/**
 * Step-1 product pick card. Renders the actual built-in wordmark for
 * Prism / One via `ExxatProductLogo`, and a generic "Custom product" tile.
 *
 * The card is a `role="radio"` button so the surrounding `radiogroup`
 * announces correctly to screen readers; selection swaps to the
 * inverse-foreground styling that the rest of the onboarding cards
 * already use.
 */
function ProductPickCard({ pick, selected, onClick }: ProductPickCardProps) {
  // Visible label — kept as plain text rather than the SVG wordmark so the
  // card stays readable in a 3-up grid (the inline-flex `ExxatProductLogo`
  // wraps awkwardly at narrow widths). Mark + label form a single row.
  const label =
    pick.id === "prism" ? "Prism" : pick.id === "one" ? "Exxat One" : "Custom product"
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group relative flex h-full flex-col items-start gap-3 rounded-2 border bg-background p-4 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected state stays on a white surface — `ring-2` (not `border-2`)
        // means we can swap selection without the 1px border shifting layout.
        selected
          ? "border-foreground/0 ring-2 ring-foreground shadow-sm"
          : "border-border hover:border-foreground/40 hover:bg-muted/30",
      )}
    >
      <span className="flex items-center gap-2.5">
        {pick.brandSource ? (
          <ExxatProductMark product={pick.brandSource} className="size-8 shrink-0" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-2 bg-muted text-base text-muted-foreground"
          >
            <i className="fa-light fa-sparkles" />
          </span>
        )}
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
      <span className="text-[11px] leading-snug text-muted-foreground">{pick.caption}</span>
    </button>
  )
}

function CardDeck({
  stepIndex,
  children,
}: {
  stepIndex: number
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 left-10 right-10 h-10 rounded-3 border border-border bg-background/70 shadow-md shadow-black/5 backdrop-blur"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 left-5 right-5 h-7 rounded-3 border border-border bg-background/85 shadow-md shadow-black/5 backdrop-blur"
      />
      <div
        key={stepIndex}
        className="relative rounded-4 border border-border bg-background/95 shadow-xl shadow-black/10 backdrop-blur"
        style={{
          animation: "exxat-onboarding-card-in 320ms ease both",
        }}
      >
        {children}
      </div>
      <style>{`
@keyframes exxat-onboarding-card-in {
  from { transform: translateY(8px) scale(0.985); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
`}</style>
    </div>
  )
}

/**
 * Animated brand-tinted blob background. Each step shifts the gradient
 * positions so the canvas feels alive when the user advances.
 */
function BlobBackground({ stepIndex }: { stepIndex: number }) {
  const positions = React.useMemo(() => {
    const presets: ReadonlyArray<{ a: string; b: string }> = [
      { a: "22% 20%", b: "80% 75%" },
      { a: "78% 18%", b: "20% 80%" },
      { a: "30% 80%", b: "75% 28%" },
      { a: "70% 70%", b: "25% 22%" },
      { a: "50% 30%", b: "50% 80%" },
    ]
    return presets[stepIndex % presets.length]!
  }, [stepIndex])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl transition-[background-position,background-size] duration-700 ease-out"
      style={{
        background: `radial-gradient(circle at ${positions.a}, color-mix(in oklch, var(--brand-tint) 72%, transparent), transparent 42%), radial-gradient(circle at ${positions.b}, color-mix(in oklch, var(--brand-color) 18%, transparent), transparent 38%), linear-gradient(135deg, var(--background), var(--secondary-panel-bg))`,
      }}
    >
      <div className="absolute inset-0 [animation:exxat-blob-drift_18s_ease-in-out_infinite_alternate]" />
      <style>{`
@keyframes exxat-blob-drift {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(2%, -1.5%, 0) scale(1.04); }
  100% { transform: translate3d(-1.5%, 1%, 0) scale(1); }
}
`}</style>
    </div>
  )
}

function NavBuilder({
  rows,
  onAdd,
  onRemove,
  onMove,
}: {
  rows: ReadonlyArray<NavRow>
  onAdd: (row: NavRow) => void
  onRemove: (key: string) => void
  onMove: (key: string, direction: -1 | 1) => void
}) {
  const [draftTitle, setDraftTitle] = React.useState("")

  const usedKeys = React.useMemo(() => new Set(rows.map(r => r.key)), [rows])

  // Live icon preview — re-runs the keyword match on every keystroke so the
  // chip next to the input mirrors what will be saved on Add.
  const draftIcon = React.useMemo(() => inferIconFromTitle(draftTitle), [draftTitle])

  function commitDraft() {
    const title = draftTitle.trim()
    if (!title) return
    const baseKey = slugifyKey(title) || `nav-${rows.length + 1}`
    let key = baseKey
    let n = 2
    while (usedKeys.has(key)) {
      key = `${baseKey}-${n++}`
    }
    const icon = inferIconFromTitle(title)
    onAdd({
      key,
      title,
      segment: key,
      iconClass: icon.iconClass,
      iconActiveClass: icon.iconActiveClass,
    })
    setDraftTitle("")
  }

  const suggestionsAvailable = NAV_SUGGESTIONS.filter(s => !usedKeys.has(s.key))

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
          In your sidebar
        </p>
        {rows.length === 0 ? (
          <p className="rounded-2 border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            Add a row below — it appears in the live sidebar preview.
          </p>
        ) : (
          <ol className="grid gap-2">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className="flex items-center gap-3 rounded-2 border border-border bg-background p-3"
              >
                <span className="flex size-9 items-center justify-center rounded-2 bg-muted text-muted-foreground">
                  <i className={row.iconClass} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">{row.title}</span>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Move ${row.title} up`}
                    disabled={index === 0}
                    onClick={() => onMove(row.key, -1)}
                  >
                    <i className="fa-light fa-arrow-up text-xs" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Move ${row.title} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => onMove(row.key, 1)}
                  >
                    <i className="fa-light fa-arrow-down text-xs" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    aria-label={`Remove ${row.title}`}
                    onClick={() => onRemove(row.key)}
                  >
                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="grid gap-2 rounded-2 border border-border bg-background/60 p-3">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Add your own
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/*
            Icon is inferred from the typed name on every keystroke
            (`inferIconFromTitle`). The chip stays neutral while the field
            is empty (uses `fa-list-tree` fallback) and switches to the
            best-matching `fa-light` glyph as soon as a keyword lands.
          */}
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 items-center justify-center rounded-2 border border-border text-base transition",
              draftTitle.trim() ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
            )}
          >
            <i className={draftIcon.iconClass} />
          </span>
          <Input
            value={draftTitle}
            placeholder="Row name (e.g. Reports, Schedule)"
            onChange={event => setDraftTitle(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault()
                event.stopPropagation()
                commitDraft()
              }
            }}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={commitDraft}
            disabled={!draftTitle.trim()}
          >
            <i className="fa-light fa-plus mr-1.5" aria-hidden="true" />
            Add
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Type a name and hit Add — we pick a Font Awesome icon based on what you typed (e.g.
          “Reports” → chart, “Schedule” → calendar). Grab a row from the suggestions below for
          a faster setup.
        </p>
      </div>

      <div className="grid gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Suggested rows
        </p>
        {suggestionsAvailable.length === 0 ? (
          <p className="text-xs text-muted-foreground">All suggested rows are already added.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestionsAvailable.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  onAdd({
                    key: s.key,
                    title: s.title,
                    caption: s.caption,
                    segment: s.segment,
                    iconClass: s.iconClass,
                    iconActiveClass: s.iconActiveClass,
                    hasSecondary: s.hasSecondary,
                  })
                }
                className="flex items-center gap-3 rounded-2 border border-border bg-background p-3 text-left transition hover:border-foreground/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="flex size-8 items-center justify-center rounded-2 bg-muted text-muted-foreground">
                  <i className={s.iconClass} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">{s.title}</span>
                  <span className="block text-xs text-muted-foreground">{s.caption}</span>
                </span>
                <i className="fa-light fa-plus text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
