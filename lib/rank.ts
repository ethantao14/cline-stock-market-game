import { STOCKS_BY_SECTOR } from "@/data/sectors";
import type { HistoricalDataByTicker } from "./simulate-core";
import { simulateWithHistoricalData } from "./simulate-core";
import type { DraftPick, Portfolio, Sector } from "./types";

const DEFAULT_SAMPLE_SIZE = 2000;

export type RankResult = {
  percentile: number;
  sampleSize: number;
  medianReturnPercent: number;
  sampledReturns: number[];
};

export type RankTier = {
  label: string;
  minPercentile: number;
};

const RANK_TIERS: RankTier[] = [
  { label: "Elite Drafter", minPercentile: 90 },
  { label: "Sharp Picker", minPercentile: 70 },
  { label: "Coin Flip", minPercentile: 40 },
  { label: "Below Average", minPercentile: 15 },
  { label: "Rough Draft", minPercentile: 0 },
];

export function getRankTier(percentile: number): string {
  const tier = RANK_TIERS.find((candidate) => percentile >= candidate.minPercentile);
  return tier?.label ?? RANK_TIERS[RANK_TIERS.length - 1].label;
}

// Client-safe equivalent of lib/available-stocks.ts's getAvailableStocks, which does
// node:fs reads and can't run in the browser. Uses the same already-bundled
// HISTORICAL_DATA the results page reads picks from, instead of hitting disk.
function getAvailableTickersForSectorYear(
  sector: Sector,
  year: DraftPick["year"],
  historicalDataByTicker: HistoricalDataByTicker,
): string[] {
  const stocksInSector = STOCKS_BY_SECTOR[sector] ?? [];

  return stocksInSector
    .map((stock) => stock.ticker)
    .filter((ticker) => {
      const prices = historicalDataByTicker[ticker] ?? [];
      return prices.some((entry) => entry.date.startsWith(`${year}-01-`)) && prices.some((entry) => entry.date.startsWith(`${year + 10}-12-`));
    });
}

function median(sortedValues: number[]): number {
  const midpoint = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2;
  }

  return sortedValues[midpoint];
}

// Monte Carlo comparison against random drafts that share the player's exact
// sector and year per pick, swapping only the ticker. This isolates
// ticker-picking skill from the draft's own year-luck.
export function computePercentileRank(
  portfolio: Portfolio,
  historicalDataByTicker: HistoricalDataByTicker,
  actualReturnPercent: number,
  sampleSize: number = DEFAULT_SAMPLE_SIZE,
  randomFn: () => number = Math.random,
): RankResult | null {
  if (portfolio.length === 0) {
    return null;
  }

  const candidatesByPick = portfolio.map((pick) =>
    getAvailableTickersForSectorYear(pick.sector, pick.year, historicalDataByTicker),
  );

  if (candidatesByPick.some((candidates) => candidates.length === 0)) {
    return null;
  }

  const sampledReturns: number[] = [];

  for (let sampleIndex = 0; sampleIndex < sampleSize; sampleIndex++) {
    const randomPortfolio: Portfolio = portfolio.map((pick, pickIndex) => {
      const candidates = candidatesByPick[pickIndex];
      const randomTicker = candidates[Math.floor(randomFn() * candidates.length)];

      return { ...pick, ticker: randomTicker };
    });

    const { totalReturnPercent } = simulateWithHistoricalData(randomPortfolio, historicalDataByTicker);
    sampledReturns.push(totalReturnPercent);
  }

  sampledReturns.sort((a, b) => a - b);

  const beatenCount = sampledReturns.filter((sampledReturn) => sampledReturn < actualReturnPercent).length;
  const percentile = Math.round((beatenCount / sampleSize) * 100);

  return {
    percentile,
    sampleSize,
    medianReturnPercent: median(sampledReturns),
    sampledReturns,
  };
}
