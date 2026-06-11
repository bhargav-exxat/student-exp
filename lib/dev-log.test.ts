import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { devLog } from "./dev-log"

describe("devLog", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("logs in development", () => {
    // `process.env.NODE_ENV` is typed as readonly in modern Node typings; use
    // Vitest's `stubEnv` so the test compiles without a `// @ts-expect-error`
    // dance and auto-restores after `unstubAllEnvs()`.
    vi.stubEnv("NODE_ENV", "development")
    devLog("hello", 1)
    expect(console.log).toHaveBeenCalledWith("hello", 1)
  })

  it("does not log in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    devLog("silent")
    expect(console.log).not.toHaveBeenCalled()
  })
})
