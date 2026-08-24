import { describe, expect, it } from "vitest";

import { findBestAndWorstPositions } from "./simulate-core";
import type { PositionResult } from "./simulate-core";

function makePosition(overrides: Partial<PositionResult>): PositionResult {
  return {
    sector: "Technology",
    ticker: "AAPL",
    dollarsAllocated: 1000,
    endingValue: 1000,
    positionReturnPercent: 0,
    hasData: true,
    ...overrides,
  };
}

describe("findBestAndWorstPositions", () => {
  it("returns nulls for an empty list", () => {
    expect(findBestAndWorstPositions([])).toEqual({
      bestPosition: null,
      worstPosition: null,
    });
  });

  it("returns nulls when every position lacks data", () => {
    const positions = [makePosition({ ticker: "AAPL", hasData: false })];

    expect(findBestAndWorstPositions(positions)).toEqual({
      bestPosition: null,
      worstPosition: null,
    });
  });

  it("picks the highest and lowest return among positions with data", () => {
    const positions = [
      makePosition({ ticker: "AAPL", positionReturnPercent: 10 }),
      makePosition({ ticker: "NVDA", positionReturnPercent: 45 }),
      makePosition({ ticker: "META", positionReturnPercent: -38 }),
    ];

    const { bestPosition, worstPosition } = findBestAndWorstPositions(positions);

    expect(bestPosition?.ticker).toBe("NVDA");
    expect(worstPosition?.ticker).toBe("META");
  });

  it("ignores positions without data when ranking", () => {
    const positions = [
      makePosition({ ticker: "AAPL", positionReturnPercent: 10 }),
      makePosition({ ticker: "MISSING", positionReturnPercent: 9999, hasData: false }),
    ];

    const { bestPosition, worstPosition } = findBestAndWorstPositions(positions);

    expect(bestPosition?.ticker).toBe("AAPL");
    expect(worstPosition?.ticker).toBe("AAPL");
  });

  it("returns the same position for best and worst when there is only one", () => {
    const positions = [makePosition({ ticker: "AAPL", positionReturnPercent: 5 })];

    const { bestPosition, worstPosition } = findBestAndWorstPositions(positions);

    expect(bestPosition?.ticker).toBe("AAPL");
    expect(worstPosition?.ticker).toBe("AAPL");
  });
});
