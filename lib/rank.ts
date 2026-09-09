import type { HistoricalDataByTicker } from "./simulate-core";
import { simulateWithHistoricalData } from "./simulate-core";
import type { DraftPick, Portfolio, Sector } from "./types";
import type { Season } from "./season";
import { SECTORS } from "@/data/sectors";

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

function getRandomUnlockedSector(unlockedSectors: Sector[], randomFn: () => number): Sector {
  return unlockedSectors[Math.floor(randomFn() * unlockedSectors.length)];
}

function buildRandomOpponentPortfolio(
  season: Season,
  roundYears: DraftPick["year"][],
  randomFn: () => number,
): Portfolio | null {
  const remainingSectors = [...SECTORS];
  const portfolio: Portfolio = [];

  for (const year of roundYears) {
    if (remainingSectors.length === 0) {
      break;
    }

    const sector = getRandomUnlockedSector(remainingSectors, randomFn);
    const stock = season.stockByYearAndSector[year]?.[sector];

    if (!stock) {
      return null;
    }

    portfolio.push({ sector, ticker: stock.ticker, year });
    remainingSectors.splice(remainingSectors.indexOf(sector), 1);
  }

  return portfolio;
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
  season: Season,
  roundYears: DraftPick["year"][],
  historicalDataByTicker: HistoricalDataByTicker,
  actualReturnPercent: number,
  sampleSize: number = DEFAULT_SAMPLE_SIZE,
  randomFn: () => number = Math.random,
): RankResult | null {
  if (portfolio.length === 0) {
    return null;
  }

  if (roundYears.length !== portfolio.length) {
    return null;
  }

  const sampledReturns: number[] = [];

  for (let sampleIndex = 0; sampleIndex < sampleSize; sampleIndex++) {
    const randomPortfolio = buildRandomOpponentPortfolio(season, roundYears, randomFn);

    if (!randomPortfolio || randomPortfolio.length !== portfolio.length) {
      return null;
    }

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
