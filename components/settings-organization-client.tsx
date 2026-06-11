"use client"

import { Link } from "react-router-dom"
import { SettingsAppearanceCard } from "@/components/settings-appearance-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ORG_SETTINGS = [
  {
    title: "Workspace identity",
    status: "Configured",
    icon: "fa-building-columns",
    description: "Johns Hopkins University, School of Medicine, Eastern time zone.",
  },
  {
    title: "Builder permissions",
    status: "3 admins",
    icon: "fa-user-shield",
    description: "Platform creators can add products, edit nav, and sync tenant-products.json.",
  },
  {
    title: "Product governance",
    status: "Review required",
    icon: "fa-shield-check",
    description: "New product shells require a DS review before production release.",
  },
  {
    title: "Release persistence",
    status: "File-backed",
    icon: "fa-file-code",
    description: "Builder changes sync to public/tenant-products.json during local development.",
  },
] as const

export function SettingsOrganizationClient() {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Organization settings
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Workspace-wide products and branding — shared across Exxat Prism, Exxat One — Schools, Exxat One — Sites, and
          custom products in this browser. Personal theme and tours live in{" "}
          <Link to="/settings/profile" className="text-brand underline-offset-4 hover:underline">
            profile settings
          </Link>
          . Add or hide products in the list below; builder-only exports still sync to{" "}
          <span className="font-mono text-xs">public/tenant-products.json</span> during local development.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ORG_SETTINGS.map(setting => (
          <Card key={setting.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-2 bg-brand-tint text-brand">
                  <i className={`fa-light ${setting.icon}`} aria-hidden="true" />
                </span>
                <CardTitle className="text-base">{setting.title}</CardTitle>
              </div>
              <Badge variant="secondary">{setting.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{setting.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SettingsAppearanceCard mode="products-only" />
      </div>
    </div>
  )
}
