import { describe, expect, it } from "vitest";
import { nextSortDirection, nextSortState, sortByNumber } from "./portfolioSort";

describe("portfolio sorting", () => {
  it("sorts rows by a numeric weight in the selected direction", () => {
    const rows = [
      { name: "cash", weight: 46 },
      { name: "nasdaq", weight: 15 },
      { name: "bonds", weight: 3 },
    ] as const;

    expect(sortByNumber(rows, (row) => row.weight, "desc").map((row) => row.name)).toEqual([
      "cash",
      "nasdaq",
      "bonds",
    ]);
    expect(sortByNumber(rows, (row) => row.weight, "asc").map((row) => row.name)).toEqual([
      "bonds",
      "nasdaq",
      "cash",
    ]);
  });

  it("toggles between descending and ascending order", () => {
    expect(nextSortDirection("desc")).toBe("asc");
    expect(nextSortDirection("asc")).toBe("desc");
  });

  it("starts a new sort key in descending order and toggles the current key", () => {
    const current = { key: "currentPercent", direction: "asc" } as const;

    expect(nextSortState(current, "targetPercent")).toEqual({ key: "targetPercent", direction: "desc" });
    expect(nextSortState(current, "currentPercent")).toEqual({ key: "currentPercent", direction: "desc" });
  });
});
