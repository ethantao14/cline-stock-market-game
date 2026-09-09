import { describe, expect, it } from "vitest";

import { analyzeMissedOpportunities } from "./missed-opportunity";
import type { HistoricalDataByYearAndTicker } from "./simulate-core";
import type { Season } from "./season";
import type { DraftPick, Sector, Stock } from "./types";

function makeStock(sector: Sector, ticker: string): Stock {
  return { ticker, name: ticker, sector };
}

// Builds a season where every year has the same stock per sector, so the test
// can reason about returns without juggling year-specific boards. The Season
// type requires all 4 simulation years to be present.
function makeSeason(stockBySector: Record<Sector, Stock>): Season {
  return {
    years: [2019 as const, 2020 as const, 2021 as const, 2022 as const],
    stockByYearAndSector: {
      2019: stockBySector,
      2020: stockBySector,
      2021: stockBySector,
      2022: stockBySector,
    },
  };
}

// Builds historical data where each ticker has a known return. The return is
// derived from the starting and ending close prices: (end - start) / start * 100.
function makeHistoricalData(
  returnsByTicker: Record<string, number>,
): HistoricalDataByYearAndTicker {
  const data: HistoricalDataByYearAndTicker = {};

  for (const [ticker, returnPercent] of Object.entries(returnsByTicker)) {
    const startPrice = 100;
    const endPrice = startPrice * (1 + returnPercent / 100);

    data[2022] = data[2022] ?? {};
    data[2022]![ticker] = [
      { date: "2022-01-03", close: startPrice },
      { date: "2022-12-30", close: endPrice },
    ];
  }

  return data;
}

describe("analyzeMissedOpportunities", () => {
  it("labels a sector taken, spent, and open correctly across rounds", () => {
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

    const season = makeSeason(stockBySector);

    const returnsByTicker: Record<string, number> = {
      AAPL: 10,
      JNJ: 20,
      JPM: 30,
      XOM: 40,
      AMZN: 50,
      PG: 60,
      CAT: 70,
      NEE: 80,
    };

    const historicalData = makeHistoricalData(returnsByTicker);

    // Player picks Technology in round 0, Healthcare in round 1.
    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
      { sector: "Financials", ticker: "JPM", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2022 },
      { sector: "Consumer Discretionary", ticker: "AMZN", year: 2022 },
      { sector: "Consumer Staples", ticker: "PG", year: 2022 },
      { sector: "Industrials", ticker: "CAT", year: 2022 },
      { sector: "Utilities", ticker: "NEE", year: 2022 },
    ];

    const roundYears = [2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022] as const;

    const analysis = analyzeMissedOpportunities(
      season,
      [...roundYears],
      picks,
      historicalData,
    );

    // Round 0: Technology is taken, all others are open.
    const round0 = analysis.rounds[0];
    expect(round0.cells.find((c) => c.sector === "Technology")?.state).toBe("taken");
    expect(round0.cells.find((c) => c.sector === "Healthcare")?.state).toBe("open");
    expect(round0.cells.find((c) => c.sector === "Utilities")?.state).toBe("open");

    // Round 1: Technology is now spent, Healthcare is taken, rest are open.
    const round1 = analysis.rounds[1];
    expect(round1.cells.find((c) => c.sector === "Technology")?.state).toBe("spent");
    expect(round1.cells.find((c) => c.sector === "Healthcare")?.state).toBe("taken");
    expect(round1.cells.find((c) => c.sector === "Financials")?.state).toBe("open");

    // Round 7: Technology and Healthcare are both spent.
    const round7 = analysis.rounds[7];
    expect(round7.cells.find((c) => c.sector === "Technology")?.state).toBe("spent");
    expect(round7.cells.find((c) => c.sector === "Healthcare")?.state).toBe("spent");
    expect(round7.cells.find((c) => c.sector === "Utilities")?.state).toBe("taken");
  });

  it("ignores cells the player actually picked when finding best missed", () => {
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

    const season = makeSeason(stockBySector);

    // Utilities has the highest return at 80%, but the player picks it in
    // round 7, so it should NOT be the best missed pick.
    const returnsByTicker: Record<string, number> = {
      AAPL: 10,
      JNJ: 20,
      JPM: 30,
      XOM: 40,
      AMZN: 50,
      PG: 60,
      CAT: 70,
      NEE: 80,
    };

    const historicalData = makeHistoricalData(returnsByTicker);

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
      { sector: "Financials", ticker: "JPM", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2022 },
      { sector: "Consumer Discretionary", ticker: "AMZN", year: 2022 },
      { sector: "Consumer Staples", ticker: "PG", year: 2022 },
      { sector: "Industrials", ticker: "CAT", year: 2022 },
      { sector: "Utilities", ticker: "NEE", year: 2022 },
    ];

    const roundYears = [2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022] as const;

    const analysis = analyzeMissedOpportunities(
      season,
      [...roundYears],
      picks,
      historicalData,
    );

    // Best missed should be Utilities at 80% in round 0, since it was available
    // in round 0 but the player didn't pick it until round 7.
    expect(analysis.bestMissed).not.toBeNull();
    expect(analysis.bestMissed?.sector).toBe("Utilities");
    expect(analysis.bestMissed?.returnPercent).toBe(80);
    expect(analysis.bestMissed?.roundIndex).toBe(0);
  });

  it("excludes cells without data from the average", () => {
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

    const season = makeSeason(stockBySector);

    // Only AAPL and JNJ have historical data. The rest have no data.
    const historicalData: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 150 }],
        JNJ: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 80 }],
      },
    };

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
      { sector: "Financials", ticker: "JPM", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2022 },
      { sector: "Consumer Discretionary", ticker: "AMZN", year: 2022 },
      { sector: "Consumer Staples", ticker: "PG", year: 2022 },
      { sector: "Industrials", ticker: "CAT", year: 2022 },
      { sector: "Utilities", ticker: "NEE", year: 2022 },
    ];

    const roundYears = [2022, 2022, 2022, 2022, 2022, 2022, 2022, 2022] as const;

    const analysis = analyzeMissedOpportunities(
      season,
      [...roundYears],
      picks,
      historicalData,
    );

    // Only 2 cells have data: AAPL (50%) and JNJ (-20%).
    // Mean = (50 + (-20)) / 2 = 15.
    expect(analysis.optimal.totalReturnPercent).toBe(15);
  });

  it("works with repeated years across rounds", () => {
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

    // Same board for both years.
    const season: Season = {
      years: [2019 as const, 2020 as const, 2021 as const, 2022 as const],
      stockByYearAndSector: {
        2019: stockBySector,
        2020: stockBySector,
        2021: stockBySector,
        2022: stockBySector,
      },
    };

    const returnsByTicker: Record<string, number> = {
      AAPL: 10,
      JNJ: 20,
      JPM: 30,
      XOM: 40,
      AMZN: 50,
      PG: 60,
      CAT: 70,
      NEE: 80,
    };

    const historicalData = makeHistoricalData(returnsByTicker);

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2021 },
      { sector: "Financials", ticker: "JPM", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2021 },
      { sector: "Consumer Discretionary", ticker: "AMZN", year: 2022 },
      { sector: "Consumer Staples", ticker: "PG", year: 2021 },
      { sector: "Industrials", ticker: "CAT", year: 2022 },
      { sector: "Utilities", ticker: "NEE", year: 2021 },
    ];

    // Round 0 and round 1 both use year 2022.
    const roundYears = [2022, 2022, 2021, 2021, 2022, 2021, 2022, 2021] as const;

    const analysis = analyzeMissedOpportunities(
      season,
      [...roundYears],
      picks,
      historicalData,
    );

    // Both rounds 0 and 1 show the same board (2022).
    const round0 = analysis.rounds[0];
    const round1 = analysis.rounds[1];

    expect(round0.year).toBe(2022);
    expect(round1.year).toBe(2022);

    // Both rounds should have the same Technology cell return (10%).
    expect(round0.cells.find((c) => c.sector === "Technology")?.result.positionReturnPercent).toBe(10);
    expect(round1.cells.find((c) => c.sector === "Technology")?.result.positionReturnPercent).toBe(10);
  });

  it("finds an optimal total better than greedy round by round choice", () => {
    // Construct a board where greedy round-by-round fails.
    //
    // Round 0 (2022): Technology = 100, Healthcare = 99, rest = 0
    // Round 1 (2021): Technology = 100, Healthcare = 0, rest = 0
    //
    // Greedy round 0: picks Technology (100), the best available.
    // Greedy round 1: Technology is spent, picks Healthcare (0).
    // Greedy total = 100, mean = 100/8 = 12.5 (only 1 cell with data).
    //
    // Optimal: assigns Healthcare to round 0 (99), Technology to round 1 (100).
    // Optimal total = 199, mean = 199/8 = 24.875 (2 cells with data).
    //
    // So optimal > greedy.

    const stockBySector2022: Record<Sector, Stock> = {
      Technology: makeStock("Technology", "AAPL"),
      Healthcare: makeStock("Healthcare", "JNJ"),
      Financials: makeStock("Financials", "JPM"),
      Energy: makeStock("Energy", "XOM"),
      "Consumer Discretionary": makeStock("Consumer Discretionary", "AMZN"),
      "Consumer Staples": makeStock("Consumer Staples", "PG"),
      Industrials: makeStock("Industrials", "CAT"),
      Utilities: makeStock("Utilities", "NEE"),
    };

    const stockBySector2021: Record<Sector, Stock> = {
      Technology: makeStock("Technology", "NVDA"),
      Healthcare: makeStock("Healthcare", "PFE"),
      Financials: makeStock("Financials", "BAC"),
      Energy: makeStock("Energy", "CVX"),
      "Consumer Discretionary": makeStock("Consumer Discretionary", "TSLA"),
      "Consumer Staples": makeStock("Consumer Staples", "KO"),
      Industrials: makeStock("Industrials", "UPS"),
      Utilities: makeStock("Utilities", "DUK"),
    };

    const season: Season = {
      years: [2022 as const, 2021 as const],
      stockByYearAndSector: {
        2019: stockBySector2022,
        2020: stockBySector2022,
        2022: stockBySector2022,
        2021: stockBySector2021,
      },
    };

    // 2022 returns: Technology = 100, Healthcare = 99, rest = 0
    // 2021 returns: Technology = 100, Healthcare = 0, rest = 0
    const historicalData: HistoricalDataByYearAndTicker = {
      2022: {
        AAPL: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 200 }],
        JNJ: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 199 }],
        JPM: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
        XOM: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
        AMZN: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
        PG: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
        CAT: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
        NEE: [{ date: "2022-01-03", close: 100 }, { date: "2022-12-30", close: 100 }],
      },
      2021: {
        NVDA: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 200 }],
        PFE: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        BAC: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        CVX: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        TSLA: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        KO: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        UPS: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
        DUK: [{ date: "2021-01-04", close: 100 }, { date: "2021-12-31", close: 100 }],
      },
    };

    const picks: DraftPick[] = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "PFE", year: 2021 },
      { sector: "Financials", ticker: "JPM", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2022 },
      { sector: "Consumer Discretionary", ticker: "AMZN", year: 2022 },
      { sector: "Consumer Staples", ticker: "PG", year: 2022 },
      { sector: "Industrials", ticker: "CAT", year: 2022 },
      { sector: "Utilities", ticker: "NEE", year: 2022 },
    ];

    const roundYears = [2022, 2021, 2022, 2022, 2022, 2022, 2022, 2022] as const;

    const analysis = analyzeMissedOpportunities(
      season,
      [...roundYears],
      picks,
      historicalData,
    );

    // Greedy would pick Technology in round 0 (100), then Healthcare in round 1 (0).
    // Greedy total = 100, mean = 100/8 = 12.5.
    //
    // Optimal assigns Healthcare to round 0 (99), Technology to round 1 (100).
    // Optimal total = 199, mean = 199/8 = 24.875, rounded to 24.88.
    expect(analysis.optimal.totalReturnPercent).toBe(24.88);
  });
});
