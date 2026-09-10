import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import { HISTORICAL_DATA } from "@/data/historical-index";
import type { Sector, Stock } from "@/lib/types";

import { draftReducer, initialDraftState, type DraftState } from "./draft-reducer";
import type { Season } from "./season";
import {
  computePortfolioValueSeries,
  findBestAndWorstPositions,
  simulateWithHistoricalData,
} from "./simulate-core";
import type { HistoricalDataByTicker, HistoricalPrice, PositionResult } from "./simulate-core";
import { getHoldingWindowForPick } from "./historical-price-window";
import type { Portfolio } from "./types";

function makePosition(overrides: Partial<PositionResult>): PositionResult {
  return {
    sector: "Technology",
    ticker: "AAPL",
    year: 2005,
    positionReturnPercent: 0,
    hasData: true,
    ...overrides,
  };
}

function makeHoldingWindow(startYear: number, monthlyCloses: number[]): HistoricalPrice[] {
  return monthlyCloses.map((close, index) => {
    const year = startYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return {
      date: `${year}-${String(month).padStart(2, "0")}-01`,
      close,
    };
  });
}

function makeFlatHistoricalData(entries: Record<string, HistoricalPrice[]>): HistoricalDataByTicker {
  return entries;
}

describe("findBestAndWorstPositions", () => {
  it("returns nulls for an empty list", () => {
    expect(findBestAndWorstPositions([])).toEqual({ bestPosition: null, worstPosition: null });
  });

  it("returns nulls when every position lacks data", () => {
    expect(findBestAndWorstPositions([makePosition({ hasData: false })])).toEqual({
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
});

describe("computePortfolioValueSeries", () => {
  it("averages each position's own 10-year index series starting at 100", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
    ];

    const series = computePortfolioValueSeries(
      portfolio,
      makeFlatHistoricalData({
        AAPL: makeHoldingWindow(2005, [100, ...Array(119).fill(110), 110]),
        JNJ: makeHoldingWindow(2005, [50, ...Array(119).fill(40), 40]),
      }),
    );

    expect(series[0]).toEqual({ label: "Year 0", value: 100 });
    expect(series.at(-1)).toEqual({ label: "Year 10", value: 95 });
    expect(series).toHaveLength(121);
  });

  it("returns an empty series when no picks have a complete 10-year window", () => {
    const portfolio: Portfolio = [{ sector: "Technology", ticker: "AAPL", year: 2015 }];
    expect(computePortfolioValueSeries(portfolio, { AAPL: [{ date: "2015-01-01", close: 100 }] })).toEqual([]);
  });

  it("ends at an index consistent with simulateWithHistoricalData", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
    ];

    const historicalData = makeFlatHistoricalData({
      AAPL: makeHoldingWindow(2005, [100, ...Array(119).fill(100), 100]),
      JNJ: makeHoldingWindow(2005, [50, ...Array(119).fill(60), 60]),
    });

    const series = computePortfolioValueSeries(portfolio, historicalData);
    const simulationResult = simulateWithHistoricalData(portfolio, historicalData);

    expect(series.at(-1)?.value).toBe(110);
    expect(simulationResult.totalReturnPercent).toBe(10);
  });

  it("dedupes duplicated months so the holding window stays at 121 points", () => {
    const prices: HistoricalPrice[] = makeHoldingWindow(2000, Array.from({ length: 121 }, (_, index) => 100 + index));
    prices.splice(3, 0, { date: "2000-03-01", close: 999 });

    const window = getHoldingWindowForPick(prices, 2000);

    expect(window).toHaveLength(121);
    expect(window.filter((entry) => entry.date === "2000-03-01")).toHaveLength(1);
    expect(window[2]).toEqual({ date: "2000-03-01", close: 102 });
  });

  it("fills a missing month with the previous month's price so the holding window stays at 121 points", () => {
    const prices = makeHoldingWindow(2000, Array.from({ length: 121 }, (_, index) => 100 + index)).filter(
      (entry) => entry.date !== "2000-10-01",
    );

    const window = getHoldingWindowForPick(prices, 2000);

    expect(window).toHaveLength(121);
    expect(window[9]).toEqual({ date: "2000-10-01", close: 108 });
    expect(window[10]).toEqual({ date: "2000-11-01", close: 110 });
  });

  it("returns exactly 121 points for MAR 1997 on real historical data", () => {
    expect(getHoldingWindowForPick(HISTORICAL_DATA.MAR, 1997)).toHaveLength(121);
  });
});

describe("simulateWithHistoricalData with a draftReducer-produced portfolio", () => {
  it("simulates a full 8-round draft's picks with no adaptation needed", () => {
    const season = {
      years: [1996],
      stockByYearAndSector: {
        1996: Object.fromEntries(
          SECTORS.map((sector, index) => [sector, { ticker: `TICKER${index}`, name: `TICKER${index}`, sector }]),
        ) as Record<Sector, Stock>,
      },
    } as unknown as Season;

    let state: DraftState = draftReducer(initialDraftState, {
      type: "START_GAME",
      season,
      roundYears: SECTORS.map(() => 1996),
    });

    SECTORS.forEach((sector, index) => {
      state = draftReducer(state, { type: "SELECT_PICK", sector, ticker: `TICKER${index}` });
    });

    const historicalData: HistoricalDataByTicker = Object.fromEntries(
      state.picks.map((pick) => [pick.ticker, makeHoldingWindow(1996, [100, ...Array(119).fill(110), 110])]),
    );

    expect(simulateWithHistoricalData(state.picks, historicalData).totalReturnPercent).toBe(10);
  });
});