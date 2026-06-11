import { Navigate, useLocation } from "react-router-dom"
import { useProductOrganizationSettingsHref } from "@/contexts/product-route-sync"

/** Back-compat for `/settings` and `/settings#appearance`. */
export default function SettingsLegacyRedirect() {
  const location = useLocation()
  const organizationHref = useProductOrganizationSettingsHref()
  const hash = location.hash.replace(/^#/, "").toLowerCase()

  if (hash === "appearance" || hash === "organization" || hash === "products") {
    return <Navigate to={organizationHref} replace />
  }

  return <Navigate to="/settings/profile" replace />
}
