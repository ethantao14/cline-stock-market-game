import { describe, expect, it } from "vitest";

import { STARTING_BUDGET } from "./draft-reducer";
import { computePortfolioValueSeries, findBestAndWorstPositions } from "./simulate-core";
import type { HistoricalDataByTicker, PositionResult } from "./simulate-core";
import type { Portfolio } from "./types";

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

describe("computePortfolioValueSeries", () => {
  it("sums shares times daily close price across all picks, day by day", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByTicker = {
      AAPL: [
        { date: "2022-01-03", close: 100 },
        { date: "2022-01-04", close: 110 },
      ],
      JNJ: [
        { date: "2022-01-03", close: 50 },
        { date: "2022-01-04", close: 40 },
      ],
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series).toEqual([
      { date: "2022-01-03", value: 1500 + leftoverCash },
      { date: "2022-01-04", value: 1100 + 400 + leftoverCash },
    ]);
  });

  it("holds leftover budget flat across every day", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
    ];

    const historicalDataByTicker: HistoricalDataByTicker = {
      AAPL: [
        { date: "2022-01-03", close: 100 },
        { date: "2022-01-04", close: 200 },
      ],
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1000;

    expect(series[0].value).toBe(1000 + leftoverCash);
    expect(series[1].value).toBe(2000 + leftoverCash);
  });

  it("excludes positions without data from the series", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
      { sector: "Financials", ticker: "MISSING", dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByTicker = {
      AAPL: [
        { date: "2022-01-03", close: 100 },
        { date: "2022-01-04", close: 100 },
      ],
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    // The MISSING pick's $500 counts against leftover cash the same way
    // simulateWithHistoricalData treats it: neither invested nor refunded.
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series[0].value).toBe(1000 + leftoverCash);
  });

  it("returns an empty series for an empty portfolio", () => {
    expect(computePortfolioValueSeries([], {})).toEqual([]);
  });

  it("returns an empty series when no picks have data", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "MISSING", dollarsAllocated: 1000 },
    ];

    expect(computePortfolioValueSeries(portfolio, {})).toEqual([]);
  });

  it("matches prices by date, not array position, when calendars differ", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByTicker = {
      AAPL: [
        { date: "2022-01-03", close: 100 },
        { date: "2022-01-04", close: 110 },
      ],
      // JNJ is missing 2022-01-03 entirely, so a naive index-based match
      // would wrongly pair JNJ's only entry with AAPL's first date.
      JNJ: [{ date: "2022-01-04", close: 40 }],
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    // JNJ's own starting price is its first available entry (2022-01-04's
    // close of 40), so its 12.5 shares are worth $500 on that date; it
    // contributes nothing on 2022-01-03, which it has no data for at all.
    expect(series).toEqual([
      { date: "2022-01-03", value: 1000 + leftoverCash },
      { date: "2022-01-04", value: 1100 + 500 + leftoverCash },
    ]);
  });
});
