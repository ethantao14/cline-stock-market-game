import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

import { draftReducer, initialDraftState, type DraftState } from "./draft-reducer";
import type { Season } from "./season";
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
  it("averages each position's own index day by day, starting at 100", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
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

    // AAPL index: 100->110, JNJ index: 100->80. Average: 100->95.
    expect(series).toEqual([
      { label: "Day 1", value: 100 },
      { label: "Day 2", value: 95 },
    ]);
  });

  it("aligns picks from different years by trading-day index, not calendar date", () => {
    // This is the actual multi-year draft scenario: AAPL was drafted for
    // 2019, JNJ for 2022. Their calendar dates share nothing in common, but
    // both are "day 1" and "day 2" of their own respective years, and the
    // chart should combine them as one continuous two-day series rather
    // than showing them as disconnected, non-overlapping stretches.
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2019 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
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

    // Same math as the single-year case: AAPL index 100->110, JNJ index 100->80.
    // Average: 100->95.
    expect(series).toEqual([
      { label: "Day 1", value: 100 },
      { label: "Day 2", value: 95 },
    ]);
  });

  it("holds a shorter position at its last known price past its own final trading day", () => {
    // Real scenario: 2020 has 252 trading days, every other supported year
    // has 251. A position from a shorter year must not just vanish once the
    // longer year still has a day left, or the chart's last point would
    // disagree with the ending value shown in the summary.
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2021 },
      { sector: "Healthcare", ticker: "JNJ", year: 2020 },
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

    // AAPL index: 100->100 (held at its only known price). JNJ index: 100->120.
    // Average: day 1 = 100, day 2 = (100+120)/2 = 110.
    expect(series).toEqual([
      { label: "Day 1", value: 100 },
      { label: "Day 2", value: 110 },
    ]);
  });

  it("averages only positions with valid data", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Financials", ticker: "MISSING", year: 2022 },
    ];

    const historicalDataByTicker: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [
          { date: "2022-01-03", close: 100 },
          { date: "2022-01-04", close: 200 },
        ],
      },
    };

    const series = computePortfolioValueSeries(portfolio, historicalDataByTicker);

    // Only AAPL counts: index goes 100->200.
    expect(series).toEqual([
      { label: "Day 1", value: 100 },
      { label: "Day 2", value: 200 },
    ]);
  });

  it("excludes positions without data from the series", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Financials", ticker: "MISSING", year: 2022 },
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

    expect(series[0].value).toBe(100);
    expect(series[1].value).toBe(100);
  });

  it("returns an empty series for an empty portfolio", () => {
    expect(computePortfolioValueSeries([], {})).toEqual([]);
  });

  it("returns an empty series when no picks have data", () => {
    const portfolio: Portfolio = [{ sector: "Technology", ticker: "MISSING", year: 2022 }];

    expect(computePortfolioValueSeries(portfolio, {})).toEqual([]);
  });

  it("excludes a position with a valid starting price but an invalid ending price", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "BADEND", year: 2022 },
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

    // Only AAPL counts: index goes 100->110.
    expect(series).toEqual([
      { label: "Day 1", value: 100 },
      { label: "Day 2", value: 110 },
    ]);
  });

  it("ends at an index consistent with simulateWithHistoricalData for a mixed-length-year portfolio", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2021 },
      { sector: "Healthcare", ticker: "JNJ", year: 2020 },
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

    // AAPL +0%, JNJ +20% => mean = 10%. Final index = 100 * 1.10 = 110.
    expect(series.at(-1)?.value).toBe(110);
    expect(simulationResult.totalReturnPercent).toBe(10);
  });
});

// Confirms the season-table reducer's output plugs into simulateWithHistoricalData
// unmodified: DraftPick has carried its own year all along, so only how picks are
// produced changed, not the shape the simulation consumes.
describe("simulateWithHistoricalData with a draftReducer-produced portfolio", () => {
  it("simulates a full 8-round draft's picks with no adaptation needed", () => {
    const season = {
      years: [2022 as const],
      stockByYearAndSector: {
        2022: Object.fromEntries(
          SECTORS.map((sector, index) => [
            sector,
            { ticker: `TICKER${index}`, name: `TICKER${index}`, sector },
          ]),
        ) as Record<Sector, Stock>,
      },
    } as Season;

    let state: DraftState = draftReducer(initialDraftState, {
      type: "START_GAME",
      season,
      roundYears: SECTORS.map(() => 2022 as const),
    });

    SECTORS.forEach((sector, index) => {
      state = draftReducer(state, { type: "SELECT_PICK", sector, ticker: `TICKER${index}` });
    });

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

    // 8 picks, each up 10%, so the equal-weight average is +10%.
    expect(result.totalReturnPercent).toBe(10);
  });
});