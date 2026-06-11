import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("merges class names and drops falsy entries", () => {
    expect(cn("a", false && "b", "c")).toBe("a c")
  })

  it("merges tailwind conflicts toward last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })
})
