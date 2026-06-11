import { Outlet } from "react-router-dom"

/** Passthrough layout for `/settings/*` child routes. */
export default function SettingsLayout() {
  return <Outlet />
}
