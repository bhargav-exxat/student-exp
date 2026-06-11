/**
 * useTableState — state-machine unit tests
 *
 * Tests cover: search filtering, select/text/date filter operators (is / is_not /
 * contains / does_not_contain), AND/OR connectors, single/multi-rule sort,
 * pagination slice, column visibility, selection helpers, and groupBy derivation.
 *
 * All tests run in jsdom via renderHook; no DOM layout assertions.
 */

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useTableState } from "./use-table-state"
import type { ColumnDef } from "./types"

// ─── fixture data ─────────────────────────────────────────────────────────────

interface Row extends Record<string, unknown> {
  id: number
  name: string
  status: string
  dept: string
  score: number
  startDate: string
}

const ROWS: Row[] = [
  { id: 1, name: "Alice Anderson", status: "active",   dept: "Engineering", score: 90, startDate: "2024-01-15" },
  { id: 2, name: "Bob Brown",      status: "inactive", dept: "Design",      score: 72, startDate: "2024-03-01" },
  { id: 3, name: "Carol Chen",     status: "active",   dept: "Engineering", score: 85, startDate: "2024-06-10" },
  { id: 4, name: "David Diaz",     status: "pending",  dept: "Marketing",   score: 60, startDate: "2024-09-20" },
  { id: 5, name: "Eve Evans",      status: "active",   dept: "Design",      score: 95, startDate: "2025-01-05" },
]

const COLS: ColumnDef<Row>[] = [
  { key: "id",        label: "ID",         width: 80  },
  { key: "name",      label: "Name",       width: 200, sortable: true, filter: { type: "text",   operators: ["contains", "not_contains"] } },
  { key: "status",    label: "Status",     width: 120, sortable: true, filter: { type: "select", operators: ["is", "is_not"],                 options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "pending", label: "Pending" }] } },
  { key: "dept",      label: "Department", width: 150, sortable: true, filter: { type: "select", operators: ["is", "is_not"] } },
  { key: "score",     label: "Score",      width: 80,  sortable: true },
  { key: "startDate", label: "Start Date", width: 120, sortable: true, filter: { type: "date",   operators: ["is", "is_not"] } },
]

// helper — render the hook with our fixture data
function setup(
  opts: {
    data?: Row[]
    defaultSort?: { key: string; dir: "asc" | "desc" }
    pagination?: { page: number; pageSize: number }
    syncedSearch?: string
  } = {},
) {
  return renderHook(() =>
    useTableState(
      opts.data ?? ROWS,
      COLS,
      opts.defaultSort,
      opts.pagination,
      opts.syncedSearch,
    ),
  )
}

// ─── initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("rows equals the full dataset when no search/filter/sort is set", () => {
    const { result } = setup()
    expect(result.current.rows).toHaveLength(5)
  })

  it("colOrder initialises from column def keys", () => {
    const { result } = setup()
    expect(result.current.colOrder).toEqual(["id", "name", "status", "dept", "score", "startDate"])
  })

  it("displayCols contains all columns when none are hidden", () => {
    const { result } = setup()
    expect(result.current.displayCols).toHaveLength(6)
  })

  it("selected starts empty", () => {
    const { result } = setup()
    expect(result.current.selected.size).toBe(0)
  })
})

// ─── defaultSort ──────────────────────────────────────────────────────────────

describe("defaultSort", () => {
  it("applies initial sort ascending", () => {
    const { result } = setup({ defaultSort: { key: "score", dir: "asc" } })
    const scores = result.current.rows.map(r => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  it("applies initial sort descending", () => {
    const { result } = setup({ defaultSort: { key: "score", dir: "desc" } })
    const scores = result.current.rows.map(r => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})

// ─── search ───────────────────────────────────────────────────────────────────

describe("search", () => {
  it("filters rows to those containing the query string", () => {
    const { result } = setup()
    act(() => { result.current.setSearch("alice") })
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].name).toBe("Alice Anderson")
  })

  it("search is case-insensitive", () => {
    const { result } = setup()
    act(() => { result.current.setSearch("CAROL") })
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].name).toBe("Carol Chen")
  })

  it("matches substrings across all fields", () => {
    const { result } = setup()
    act(() => { result.current.setSearch("engineering") })
    expect(result.current.rows).toHaveLength(2)
  })

  it("returns empty when no rows match", () => {
    const { result } = setup()
    act(() => { result.current.setSearch("zzz_no_match") })
    expect(result.current.rows).toHaveLength(0)
  })

  it("clearing search restores all rows", () => {
    const { result } = setup()
    act(() => { result.current.setSearch("alice") })
    act(() => { result.current.setSearch("") })
    expect(result.current.rows).toHaveLength(5)
  })

  it("syncedSearchFromUrl pre-populates search", () => {
    const { result } = setup({ syncedSearch: "bob" })
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].name).toBe("Bob Brown")
  })
})

// ─── select filter ────────────────────────────────────────────────────────────

describe("select filter — is", () => {
  it("filters rows to the matching value", () => {
    const { result } = setup()
    act(() => { result.current.addFilter("status") })
    const filterId = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(filterId, { operator: "is", values: ["active"] }) })
    expect(result.current.rows.every(r => r.status === "active")).toBe(true)
    expect(result.current.rows).toHaveLength(3)
  })

  it("is_not excludes the matching value", () => {
    const { result } = setup()
    act(() => { result.current.addFilter("status") })
    const filterId = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(filterId, { operator: "is_not", values: ["active"] }) })
    expect(result.current.rows.every(r => r.status !== "active")).toBe(true)
    expect(result.current.rows).toHaveLength(2)
  })

  it("removeFilter restores full row set", () => {
    const { result } = setup()
    act(() => { result.current.addFilter("status") })
    const filterId = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(filterId, { operator: "is", values: ["active"] }) })
    act(() => { result.current.removeFilter(filterId) })
    expect(result.current.rows).toHaveLength(5)
  })
})

// ─── text filter ──────────────────────────────────────────────────────────────

describe("text filter", () => {
  it("contains keeps only rows whose column value includes the needle", () => {
    const { result } = setup()
    act(() => { result.current.addFilter("name") })
    const id = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(id, { operator: "contains", values: ["an"] }) })
    // "Alice Anderson" and "Eve Evans" contain "an" (case-insensitive)
    expect(result.current.rows.every(r => r.name.toLowerCase().includes("an"))).toBe(true)
  })

  it("not_contains excludes matching rows", () => {
    const { result } = setup()
    act(() => { result.current.addFilter("name") })
    const id = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(id, { operator: "not_contains", values: ["an"] }) })
    expect(result.current.rows.every(r => !r.name.toLowerCase().includes("an"))).toBe(true)
  })
})

// ─── AND / OR connectors ──────────────────────────────────────────────────────

describe("filter connectors", () => {
  it("AND connector intersects two filter results", () => {
    const { result } = setup()
    // filter 1: status = active
    act(() => { result.current.addFilter("status") })
    const f1 = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(f1, { operator: "is", values: ["active"] }) })
    // filter 2: dept = Design
    act(() => { result.current.addFilter("dept") })
    const f2 = result.current.activeFilters[1].id
    act(() => { result.current.updateFilter(f2, { operator: "is", values: ["Design"] }) })
    // AND: active AND Design → only Eve Evans
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].name).toBe("Eve Evans")
  })

  it("OR connector unions two filter results", () => {
    const { result } = setup()
    // filter 1: status = pending
    act(() => { result.current.addFilter("status") })
    const f1 = result.current.activeFilters[0].id
    act(() => { result.current.updateFilter(f1, { operator: "is", values: ["pending"] }) })
    // filter 2: dept = Design
    act(() => { result.current.addFilter("dept") })
    const f2 = result.current.activeFilters[1].id
    act(() => { result.current.updateFilter(f2, { operator: "is", values: ["Design"] }) })
    // switch connector to OR
    act(() => { result.current.toggleConnector(f1) })
    // OR: pending OR Design → David Diaz, Bob Brown, Eve Evans
    expect(result.current.rows).toHaveLength(3)
    const names = result.current.rows.map(r => r.name).sort()
    expect(names).toEqual(["Bob Brown", "David Diaz", "Eve Evans"])
  })
})

// ─── sort ─────────────────────────────────────────────────────────────────────

describe("sort", () => {
  it("handleSortByKey sorts ascending on first invocation", () => {
    const { result } = setup()
    act(() => { result.current.handleSortByKey("score") })
    const scores = result.current.rows.map(r => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  it("handleSortByKey toggles to descending on second invocation of the same key", () => {
    const { result } = setup()
    act(() => { result.current.handleSortByKey("score") })
    act(() => { result.current.handleSortByKey("score") })
    const scores = result.current.rows.map(r => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it("handleSortByKey with a new key resets to ascending", () => {
    const { result } = setup()
    act(() => { result.current.handleSortByKey("score") })
    act(() => { result.current.handleSortByKey("score") }) // now desc
    act(() => { result.current.handleSortByKey("name") })  // new key → asc
    expect(result.current.sortDir).toBe("asc")
    expect(result.current.sortKey).toBe("name")
  })

  it("addSortRule adds a secondary sort rule", () => {
    const { result } = setup()
    act(() => { result.current.handleSortByKey("dept") })
    act(() => { result.current.addSortRule("score") })
    expect(result.current.sortRules).toHaveLength(2)
  })

  it("removeSortRule removes the rule by id", () => {
    const { result } = setup()
    act(() => { result.current.addSortRule("score") })
    const id = result.current.sortRules[0].id
    act(() => { result.current.removeSortRule(id) })
    expect(result.current.sortRules).toHaveLength(0)
  })
})

// ─── pagination ───────────────────────────────────────────────────────────────

describe("pagedRows", () => {
  it("returns first page slice", () => {
    const { result } = renderHook(() =>
      useTableState(ROWS, COLS, undefined, { page: 1, pageSize: 2 }),
    )
    expect(result.current.pagedRows).toHaveLength(2)
    expect(result.current.pagedRows[0].id).toBe(1)
  })

  it("returns second page slice", () => {
    const { result } = renderHook(() =>
      useTableState(ROWS, COLS, undefined, { page: 2, pageSize: 2 }),
    )
    expect(result.current.pagedRows).toHaveLength(2)
    expect(result.current.pagedRows[0].id).toBe(3)
  })

  it("returns remaining items on last page", () => {
    const { result } = renderHook(() =>
      useTableState(ROWS, COLS, undefined, { page: 3, pageSize: 2 }),
    )
    expect(result.current.pagedRows).toHaveLength(1)
    expect(result.current.pagedRows[0].id).toBe(5)
  })

  it("pagedRows still respect active search", () => {
    const { result } = renderHook(() =>
      useTableState(ROWS, COLS, undefined, { page: 1, pageSize: 10 }),
    )
    // "engineering" uniquely matches dept of Alice + Carol (2 rows)
    act(() => { result.current.setSearch("engineering") })
    expect(result.current.pagedRows).toHaveLength(2)
    expect(result.current.pagedRows.every(r => r.dept === "Engineering")).toBe(true)
  })
})

// ─── column visibility ────────────────────────────────────────────────────────

describe("column visibility", () => {
  it("toggleColVisibility hides a column from displayCols", () => {
    const { result } = setup()
    act(() => { result.current.toggleColVisibility("dept") })
    const keys = result.current.displayCols.map(c => c.key)
    expect(keys).not.toContain("dept")
  })

  it("toggleColVisibility re-shows a hidden column", () => {
    const { result } = setup()
    act(() => { result.current.toggleColVisibility("dept") })
    act(() => { result.current.toggleColVisibility("dept") })
    const keys = result.current.displayCols.map(c => c.key)
    expect(keys).toContain("dept")
  })
})

// ─── selection ────────────────────────────────────────────────────────────────

describe("selection", () => {
  it("toggleRow selects an unselected row", () => {
    const { result } = setup()
    act(() => { result.current.toggleRow(1) })
    expect(result.current.selected.has(1)).toBe(true)
  })

  it("toggleRow deselects an already-selected row", () => {
    const { result } = setup()
    act(() => { result.current.toggleRow(1) })
    act(() => { result.current.toggleRow(1) })
    expect(result.current.selected.has(1)).toBe(false)
  })

  it("toggleAll selects every row id", () => {
    const { result } = setup()
    const allIds = ROWS.map(r => r.id)
    act(() => { result.current.toggleAll(allIds) })
    expect(result.current.selected.size).toBe(5)
  })

  it("toggleAll deselects when all are already selected", () => {
    const { result } = setup()
    const allIds = ROWS.map(r => r.id)
    act(() => { result.current.toggleAll(allIds) })
    act(() => { result.current.toggleAll(allIds) })
    expect(result.current.selected.size).toBe(0)
  })
})

// ─── groupBy derivation ───────────────────────────────────────────────────────

describe("groupedRows", () => {
  it("groups rows by the specified field", () => {
    const { result } = setup()
    act(() => { result.current.setGroupBy("dept") })
    const groups = result.current.groupedRows
    const keys = groups.map(g => g.groupKey).sort()
    expect(keys).toEqual(["Design", "Engineering", "Marketing"])
  })

  it("each group only contains rows matching the group key", () => {
    const { result } = setup()
    act(() => { result.current.setGroupBy("status") })
    for (const group of result.current.groupedRows) {
      expect(group.rows.every(r => r.status === group.groupKey)).toBe(true)
    }
  })

  it("groupedRows returns a single null-key group when groupBy is null", () => {
    const { result } = setup()
    expect(result.current.groupedRows).toHaveLength(1)
    expect(result.current.groupedRows[0].groupKey).toBeNull()
  })
})

// ─── column order ─────────────────────────────────────────────────────────────

describe("moveCol", () => {
  it("moves a column up in colOrder", () => {
    const { result } = setup()
    const before = [...result.current.colOrder]
    act(() => { result.current.moveCol("status", "up") })
    const after = result.current.colOrder
    expect(after.indexOf("status")).toBe(before.indexOf("status") - 1)
  })

  it("moves a column down in colOrder", () => {
    const { result } = setup()
    const before = [...result.current.colOrder]
    act(() => { result.current.moveCol("name", "down") })
    const after = result.current.colOrder
    expect(after.indexOf("name")).toBe(before.indexOf("name") + 1)
  })

  it("does nothing when moving the first column up", () => {
    const { result } = setup()
    const before = [...result.current.colOrder]
    act(() => { result.current.moveCol(before[0], "up") })
    expect(result.current.colOrder).toEqual(before)
  })
})
