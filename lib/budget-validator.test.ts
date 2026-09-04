import { describe, expect, it } from "vitest";

import { getMaxAllocation, MIN_ALLOCATION } from "./budget-validator";

describe("getMaxAllocation", () => {
  it("caps the first pick well below the full budget when many picks remain", () => {
    expect(getMaxAllocation(10000, 8)).toBe(3000);
  });

  it("caps at the $3,000 ceiling when the budget has plenty of slack", () => {
    expect(getMaxAllocation(50000, 2)).toBe(3000);
  });

  it("allows spending the entire remaining budget on the last pick", () => {
    expect(getMaxAllocation(1500, 1)).toBe(1500);
  });

  it("returns exactly the $1,000 minimum when budget is at the tightest feasible floor", () => {
    const remainingPicks = 4;
    const tightestBudget = remainingPicks * MIN_ALLOCATION;

    expect(getMaxAllocation(tightestBudget, remainingPicks)).toBe(MIN_ALLOCATION);
  });
});
