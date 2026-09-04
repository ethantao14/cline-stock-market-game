import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

import { draftReducer, initialDraftState, STARTING_BUDGET, type DraftState } from "./draft-reducer";
import {
  computePortfolioValueSeries,
  findBestAndWorstPositions,
  simulateWithHistoricalData,
} from "./simulate-core";
import type { HistoricalDataByYearAndTicker, PositionResult } from "./simulate-core";
import type { Portfolio } from "./types";

function makePosition(overrides: Partial<PositionResult>): PositionResult {
  return {
    sector: "Technology",
    ticker: "AAPL",
    year: 2022,
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
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [
          { date: "2022-01-03", close: 100 },
          { date: "2022-01-04", close: 110 },
        ],
        JNJ: [
          { date: "2022-01-03", close: 50 },
          { date: "2022-01-04", close: 40 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series).toEqual([
      { label: "Day 1", value: 1500 + leftoverCash },
      { label: "Day 2", value: 1100 + 400 + leftoverCash },
    ]);
  });

  it("aligns picks from different years by trading-day index, not calendar date", () => {
    // This is the actual multi-year draft scenario: AAPL was drafted for
    // 2019, JNJ for 2022. Their calendar dates share nothing in common, but
    // both are "day 1" and "day 2" of their own respective years, and the
    // chart should combine them as one continuous two-day series rather
    // than showing them as disconnected, non-overlapping stretches.
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2019, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2019: {
        AAPL: [
          { date: "2019-01-02", close: 100 },
          { date: "2019-01-03", close: 110 },
        ],
      },
      2022: {
        JNJ: [
          { date: "2022-01-03", close: 50 },
          { date: "2022-01-04", close: 40 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series).toEqual([
      { label: "Day 1", value: 1000 + 500 + leftoverCash },
      { label: "Day 2", value: 1100 + 400 + leftoverCash },
    ]);
  });

  it("holds a shorter position at its last known price past its own final trading day", () => {
    // Real scenario: 2020 has 252 trading days, every other supported year
    // has 251. A position from a shorter year must not just vanish once the
    // longer year still has a day left, or the chart's last point would
    // disagree with the ending value shown in the summary.
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2021, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2020, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2021: {
        AAPL: [{ date: "2021-01-04", close: 100 }],
      },
      2020: {
        JNJ: [
          { date: "2020-01-02", close: 50 },
          { date: "2020-01-03", close: 60 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series).toEqual([
      { label: "Day 1", value: 1000 + 500 + leftoverCash },
      // AAPL has no second day of its own, so it's held at its only known
      // price (100) rather than dropping out while JNJ's 2020 data continues.
      { label: "Day 2", value: 1000 + 600 + leftoverCash },
    ]);
  });

  it("holds leftover budget flat across every day", () => {
    const portfolio: Portfolio = [{ sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 }];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [
          { date: "2022-01-03", close: 100 },
          { date: "2022-01-04", close: 200 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1000;

    expect(series[0].value).toBe(1000 + leftoverCash);
    expect(series[1].value).toBe(2000 + leftoverCash);
  });

  it("excludes positions without data from the series", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Financials", ticker: "MISSING", year: 2022, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [
          { date: "2022-01-03", close: 100 },
          { date: "2022-01-04", close: 100 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series[0].value).toBe(1000 + leftoverCash);
  });

  it("returns an empty series for an empty portfolio", () => {
    expect(computePortfolioValueSeries([], {})).toEqual([]);
  });

  it("returns an empty series when no picks have data", () => {
    const portfolio: Portfolio = [{ sector: "Technology", ticker: "MISSING", year: 2022, dollarsAllocated: 1000 }];

    expect(computePortfolioValueSeries(portfolio, {})).toEqual([]);
  });

  it("excludes a position with a valid starting price but an invalid ending price", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "BADEND", year: 2022, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [
          { date: "2022-01-03", close: 100 },
          { date: "2022-01-04", close: 110 },
        ],
        BADEND: [
          { date: "2022-01-03", close: 50 },
          { date: "2022-01-04", close: -1 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const leftoverCash = STARTING_BUDGET - 1500;

    expect(series).toEqual([
      { label: "Day 1", value: 1000 + leftoverCash },
      { label: "Day 2", value: 1100 + leftoverCash },
    ]);
  });

  it("ends at the same value as simulateWithHistoricalData for a mixed-length-year portfolio", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2021, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2020, dollarsAllocated: 500 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2021: {
        AAPL: [{ date: "2021-01-04", close: 100 }],
      },
      2020: {
        JNJ: [
          { date: "2020-01-02", close: 50 },
          { date: "2020-01-03", close: 60 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);
    const simulationResult = simulateWithHistoricalData(portfolio, historicalDataByTicker);

    expect(series.at(-1)?.value).toBe(simulationResult.endingValue);
  });
});

// Confirms the new round-board reducer's output plugs into simulateWithHistoricalData
// unmodified: DraftPick already carried year per-pick before this reducer rewrite, so
// the pick shape simulation consumes hasn't changed at all, only how picks are produced.
describe("simulateWithHistoricalData with a draftReducer-produced portfolio", () => {
  it("simulates a full 8-round draft's picks with no adaptation needed", () => {
    let state: DraftState = initialDraftState;

    for (let i = 0; i < SECTORS.length; i += 1) {
      const sector = SECTORS[i];
      const ticker = `TICKER${i}`;

      state = draftReducer(state, {
        type: "START_ROUND",
        year: 2022,
        optionsBySector: { [sector]: [{ ticker, name: ticker, sector }] } as Record<Sector, Stock[]>,
      });
      state = draftReducer(state, { type: "SELECT_PICK", sector, ticker, dollarsAllocated: 1000 });
    }

    expect(state.isComplete).toBe(true);
    expect(state.picks).toHaveLength(SECTORS.length);

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: Object.fromEntries(
        state.picks.map((pick) => [
          pick.ticker,
          [
            { date: "2022-01-03", close: 100 },
            { date: "2022-12-30", close: 110 },
          ],
        ]),
      ),
    };

    const result = simulateWithHistoricalData(state.picks, historicalDataByTicker);

    // $1,000 x 8 picks = $8,000 invested, each up 10%; $2,000 left untouched.
    expect(result.startingValue).toBe(STARTING_BUDGET);
    expect(result.endingValue).toBe(8000 * 1.1 + 2000);
    expect(result.totalReturnPercent).toBe(8);
  });
});