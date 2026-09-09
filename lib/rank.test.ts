import { describe, expect, it } from "vitest";

import { computePercentileRank, getRankTier } from "./rank";
import type { HistoricalDataByTicker } from "./simulate-core";
import type { Season } from "./season";
import type { Portfolio, Sector, Stock } from "./types";

function makeHoldingWindow(startYear: number, startClose: number, endClose: number) {
  return Array.from({ length: 132 }, (_, index) => {
    const year = startYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    const close = index === 0 ? startClose : index === 131 ? endClose : endClose;
    return { date: `${year}-${String(month).padStart(2, "0")}-01`, close };
  });
}

function makeStock(sector: Sector, ticker: string): Stock {
  return { sector, ticker, name: ticker };
}

function makeSeason(year: number): Season {
  const stockBySector: Record<Sector, Stock> = {
    Technology: makeStock("Technology", "AAPL"),
    Healthcare: makeStock("Healthcare", "JNJ"),
    Financials: makeStock("Financials", "JPM"),
    Energy: makeStock("Energy", "XOM"),
    "Consumer Discretionary": makeStock("Consumer Discretionary", "AMZN"),
    "Consumer Staples": makeStock("Consumer Staples", "PG"),
    Industrials: makeStock("Industrials", "CAT"),
    Utilities: makeStock("Utilities", "NEE"),
  };

  return {
    years: [year] as Season["years"],
    stockByYearAndSector: { [year]: stockBySector } as Season["stockByYearAndSector"],
  };
}

const HISTORICAL_DATA: HistoricalDataByTicker = {
  AAPL: makeHoldingWindow(2005, 100, 150),
  JNJ: makeHoldingWindow(2005, 100, 100),
  JPM: makeHoldingWindow(2005, 100, 90),
  XOM: makeHoldingWindow(2005, 100, 80),
  AMZN: makeHoldingWindow(2005, 100, 70),
  PG: makeHoldingWindow(2005, 100, 60),
  CAT: makeHoldingWindow(2005, 100, 50),
  NEE: makeHoldingWindow(2005, 100, 40),
};

const PLAYER_PORTFOLIO: Portfolio = [
  { sector: "Technology", ticker: "AAPL", year: 2005 },
  { sector: "Healthcare", ticker: "JNJ", year: 2005 },
  { sector: "Financials", ticker: "JPM", year: 2005 },
];

function sequenceRandomFn(values: number[]): () => number {
  let callIndex = 0;

  return () => {
    const value = values[callIndex % values.length];
    callIndex += 1;
    return value;
  };
}

describe("computePercentileRank", () => {
  it("returns the 100th percentile when every sampled return is below the actual return", () => {
    const result = computePercentileRank(
      PLAYER_PORTFOLIO,
      makeSeason(2005),
      [2005, 2005, 2005],
      HISTORICAL_DATA,
      9999,
      5,
      sequenceRandomFn([0, 0.2, 0.4]),
    );

    expect(result?.percentile).toBe(100);
  });

  it("returns the 0th percentile when no sampled return is below the actual return", () => {
    const result = computePercentileRank(
      PLAYER_PORTFOLIO,
      makeSeason(2005),
      [2005, 2005, 2005],
      HISTORICAL_DATA,
      -9999,
      5,
      sequenceRandomFn([0, 0.2, 0.4]),
    );

    expect(result?.percentile).toBe(0);
  });

  it("samples random unlocked sectors from the season table", () => {
    const result = computePercentileRank(
      PLAYER_PORTFOLIO,
      makeSeason(2005),
      [2005, 2005, 2005],
      HISTORICAL_DATA,
      0,
      4,
      sequenceRandomFn([0, 0, 0, 0.99, 0.99, 0.99, 0, 0.99, 0.5, 0.99, 0, 0.5]),
    );

    expect(result?.sampleSize).toBe(4);
    expect(result?.sampledReturns).toHaveLength(4);
    expect(result?.sampledReturns).toEqual([-50, -13.33, -13.33, 13.33]);
    expect(result?.medianReturnPercent).toBe(-13.33);
    expect(result?.percentile).toBe(75);
  });

  it("returns null for an empty portfolio", () => {
    expect(computePercentileRank([], makeSeason(2005), [], HISTORICAL_DATA, 0)).toBeNull();
  });

  it("returns null when roundYears length does not match the portfolio", () => {
    expect(computePercentileRank(PLAYER_PORTFOLIO, makeSeason(2005), [2005], HISTORICAL_DATA, 0)).toBeNull();
  });

  it("returns null instead of throwing when season data is missing for a round", () => {
    const season = {
      years: [2005] as Season["years"],
      stockByYearAndSector: {} as Season["stockByYearAndSector"],
    };

    expect(computePercentileRank(PLAYER_PORTFOLIO, season, [2005, 2005, 2005], HISTORICAL_DATA, 0)).toBeNull();
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