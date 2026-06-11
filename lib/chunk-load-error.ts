/**
 * Detect stale module / chunk failures across bundlers.
 *
 * Catches:
 *   - Webpack / Turbopack: "ChunkLoadError", "Failed to load chunk",
 *     "Loading chunk".
 *   - Vite: "Failed to fetch dynamically imported module",
 *     "Importing binding name", "does not provide an export named",
 *     "Outdated Optimize Dep".
 *
 * Used by `DevChunkLoadRecovery` to auto-reload once on stale chunks
 * after a dev-server rebuild, instead of stranding the user on a
 * blank shell.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const err = error as { name?: string; message?: string }
  const name = err.name ?? ""
  const msg = err.message ?? ""
  return (
    // Webpack / Turbopack
    name === "ChunkLoadError" ||
    msg.includes("Failed to load chunk") ||
    msg.includes("Loading chunk") ||
    msg.includes("ChunkLoadError") ||
    // Vite
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing binding name") ||
    msg.includes("does not provide an export named") ||
    msg.includes("Outdated Optimize Dep")
  )
}
