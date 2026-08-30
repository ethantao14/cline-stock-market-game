import { describe, expect, it } from "vitest";

import { computePercentileRank, getRankTier } from "./rank";
import type { HistoricalDataByYearAndTicker } from "./simulate-core";
import type { Portfolio } from "./types";

// Technology sector's stock list (data/sectors.ts) starts AAPL, MSFT, ... so
// providing historical data only for those two tickers yields a known,
// order-stable two-candidate pool for a Technology/2022 pick.
const TECH_HISTORICAL_DATA: HistoricalDataByYearAndTicker = {
  2022: {
    AAPL: [
      { date: "2022-01-03", close: 100 },
      { date: "2022-01-04", close: 150 },
    ],
    MSFT: [
      { date: "2022-01-03", close: 100 },
      { date: "2022-01-04", close: 100 },
    ],
  },
};

const SINGLE_TECH_PICK_PORTFOLIO: Portfolio = [
  { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
];

function sequenceRandomFn(values: number[]): () => number {
  let callIndex = 0;

  return () => {
    const value = values[callIndex % values.length];
    callIndex++;
    return value;
  };
}

describe("computePercentileRank", () => {
  it("returns the 100th percentile when every sampled return is below the actual return", () => {
    const result = computePercentileRank(
      SINGLE_TECH_PICK_PORTFOLIO,
      TECH_HISTORICAL_DATA,
      9999,
      5,
      sequenceRandomFn([0]),
    );

    expect(result?.percentile).toBe(100);
  });

  it("returns the 0th percentile when no sampled return is below the actual return", () => {
    const result = computePercentileRank(
      SINGLE_TECH_PICK_PORTFOLIO,
      TECH_HISTORICAL_DATA,
      -9999,
      5,
      sequenceRandomFn([0]),
    );

    expect(result?.percentile).toBe(0);
  });

  it("computes percentile and median from a mixed deterministic sample", () => {
    // Alternating indices 0, 1, 0, 1 -> tickers AAPL, MSFT, AAPL, MSFT ->
    // total returns 5%, 0%, 5%, 0% (AAPL: $1000 -> $1500 position against a
    // $10000 budget is +5% total; MSFT flat is +0% total).
    const result = computePercentileRank(
      SINGLE_TECH_PICK_PORTFOLIO,
      TECH_HISTORICAL_DATA,
      3,
      4,
      sequenceRandomFn([0, 0.9]),
    );

    expect(result?.percentile).toBe(50);
    // True median of the sorted sample [0, 0, 5, 5] averages the two middle
    // values, not just the upper-middle one.
    expect(result?.medianReturnPercent).toBe(2.5);
    expect(result?.sampleSize).toBe(4);
    expect(result?.sampledReturns).toHaveLength(4);
    expect(result?.sampledReturns).toEqual([0, 0, 5, 5]);
  });

  it("returns null for an empty portfolio", () => {
    expect(computePercentileRank([], TECH_HISTORICAL_DATA, 0)).toBeNull();
  });

  it("returns null when a pick's sector/year has no candidate tickers with data", () => {
    const result = computePercentileRank(SINGLE_TECH_PICK_PORTFOLIO, {}, 0);

    expect(result).toBeNull();
  });

  it("returns null instead of throwing when a pick has a sector not in STOCKS_BY_SECTOR", () => {
    // Simulates stale/corrupt localStorage data: isDraftPick only checks that
    // sector is a string, not that it's a real Sector value.
    const portfolio = [
      { sector: "NotARealSector", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
    ] as unknown as Portfolio;

    expect(computePercentileRank(portfolio, TECH_HISTORICAL_DATA, 0)).toBeNull();
  });
});

describe("getRankTier", () => {
  it("labels boundary percentiles correctly", () => {
    expect(getRankTier(100)).toBe("Elite Drafter");
    expect(getRankTier(90)).toBe("Elite Drafter");
    expect(getRankTier(89)).toBe("Sharp Picker");
    expect(getRankTier(70)).toBe("Sharp Picker");
    expect(getRankTier(69)).toBe("Coin Flip");
    expect(getRankTier(40)).toBe("Coin Flip");
    expect(getRankTier(39)).toBe("Below Average");
    expect(getRankTier(15)).toBe("Below Average");
    expect(getRankTier(14)).toBe("Rough Draft");
    expect(getRankTier(0)).toBe("Rough Draft");
  });
});
