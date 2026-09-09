import { describe, expect, it } from "vitest";

import { AVAILABLE_SIMULATION_YEARS } from "./draft-reducer";
import { analyzeMissedOpportunities } from "./missed-opportunity";
import type { HistoricalDataByTicker } from "./simulate-core";
import type { Season } from "./season";
import type { DraftPick, Sector, Stock } from "./types";

function makeStock(sector: Sector, ticker: string): Stock {
  return { ticker, name: ticker, sector };
}

function makeSeason(defaultStockBySector: Record<Sector, Stock>, overrides: Partial<Record<number, Record<Sector, Stock>>> = {}): Season {
  return {
    years: [...AVAILABLE_SIMULATION_YEARS],
    stockByYearAndSector: Object.fromEntries(
      AVAILABLE_SIMULATION_YEARS.map((year) => [year, overrides[year] ?? defaultStockBySector]),
    ) as Season["stockByYearAndSector"],
  };
}

function makeHoldingWindow(startYear: number, startClose: number, endClose: number) {
  return Array.from({ length: 132 }, (_, index) => {
    const year = startYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    const close = index === 0 ? startClose : index === 131 ? endClose : endClose;
    return { date: `${year}-${String(month).padStart(2, "0")}-01`, close };
  });
}

function makeHistoricalData(returnsByTicker: Record<string, number>, startYear: number): HistoricalDataByTicker {
  return Object.fromEntries(
    Object.entries(returnsByTicker).map(([ticker, returnPercent]) => [
      ticker,
      makeHoldingWindow(startYear, 100, 100 * (1 + returnPercent / 100)),
    ]),
  );
}

const STOCKS: Record<Sector, Stock> = {
  Technology: makeStock("Technology", "AAPL"),
  Healthcare: makeStock("Healthcare", "JNJ"),
  Financials: makeStock("Financials", "JPM"),
  Energy: makeStock("Energy", "XOM"),
  "Consumer Discretionary": makeStock("Consumer Discretionary", "AMZN"),
  "Consumer Staples": makeStock("Consumer Staples", "PG"),
  Industrials: makeStock("Industrials", "CAT"),
  Utilities: makeStock("Utilities", "NEE"),
};

describe("analyzeMissedOpportunities", () => {
  it("labels taken, spent, and open sectors correctly across rounds", () => {
    const season = makeSeason(STOCKS);
    const historicalData = makeHistoricalData(
      { AAPL: 10, JNJ: 20, JPM: 30, XOM: 40, AMZN: 50, PG: 60, CAT: 70, NEE: 80 },
      2005,
    );

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
    ];

    const analysis = analyzeMissedOpportunities(season, [2005, 2005], picks, historicalData);

    expect(analysis.rounds[0].cells.find((cell) => cell.sector === "Technology")?.state).toBe("taken");
    expect(analysis.rounds[1].cells.find((cell) => cell.sector === "Technology")?.state).toBe("spent");
    expect(analysis.rounds[1].cells.find((cell) => cell.sector === "Financials")?.state).toBe("open");
  });

  it("reports the best missed opportunity from another year", () => {
    const stockBySector2006: Record<Sector, Stock> = {
      ...STOCKS,
      Technology: makeStock("Technology", "NVDA"),
    };

    const season = makeSeason(STOCKS, { 2006: stockBySector2006 });
    const historicalData: HistoricalDataByTicker = {
      AAPL: makeHoldingWindow(2005, 100, 110),
      NVDA: makeHoldingWindow(2006, 100, 500),
    };

    const picks: DraftPick[] = [{ sector: "Technology", ticker: "AAPL", year: 2005 }];
    const analysis = analyzeMissedOpportunities(season, [2005, 2006], picks, historicalData);

    expect(analysis.bestMissed?.sector).toBe("Technology");
    expect(analysis.bestMissed?.ticker).toBe("NVDA");
    expect(analysis.bestMissed?.returnPercent).toBe(400);
    expect(analysis.bestMissed?.roundIndex).toBe(1);
  });

  it("excludes cells without data from the optimal average", () => {
    const season = makeSeason(STOCKS);
    const historicalData = makeHistoricalData({ AAPL: 50, JNJ: -20 }, 2005);

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
    ];

    const analysis = analyzeMissedOpportunities(season, [2005, 2005], picks, historicalData);
    expect(analysis.optimal.totalReturnPercent).toBe(50);
  });

  it("handles repeated years across rounds", () => {
    const season = makeSeason(STOCKS);
    const historicalData = makeHistoricalData({ AAPL: 10, JNJ: 20, JPM: 30, XOM: 40, AMZN: 50, PG: 60, CAT: 70, NEE: 80 }, 2005);
    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
      { sector: "Financials", ticker: "JPM", year: 2006 },
      { sector: "Energy", ticker: "XOM", year: 2006 },
    ];

    const analysis = analyzeMissedOpportunities(season, [2005, 2005, 2006, 2006], picks, historicalData);

    expect(analysis.rounds[0].year).toBe(2005);
    expect(analysis.rounds[1].year).toBe(2005);
    expect(analysis.rounds[0].cells.find((cell) => cell.sector === "Technology")?.result.positionReturnPercent).toBe(10);
    expect(analysis.rounds[1].cells.find((cell) => cell.sector === "Technology")?.result.positionReturnPercent).toBe(10);
  });
});