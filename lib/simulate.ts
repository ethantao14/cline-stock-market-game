import { readFileSync } from "node:fs";
import path from "node:path";

import { STARTING_BUDGET } from "./draft-reducer";
import type { DraftPick, Portfolio, SimulationResult } from "./types";

export type HistoricalPrice = {
  date: string;
  close: number;
};

export type HistoricalDataByTicker = Partial<Record<string, HistoricalPrice[]>>;

export type PositionResult = {
  sector: DraftPick["sector"];
  ticker: string;
  dollarsAllocated: number;
  endingValue: number;
  positionReturnPercent: number;
  hasData: boolean;
};

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

function isHistoricalPrice(value: unknown): value is HistoricalPrice {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.date === "string" &&
    typeof candidate.close === "number" &&
    Number.isFinite(candidate.close)
  );
}

function parseHistoricalData(json: string, ticker: string): HistoricalPrice[] | null {
  try {
    const parsed = JSON.parse(json) as unknown;

    if (!Array.isArray(parsed)) {
      console.warn(`Skipping ${ticker}: historical data is not an array.`);
      return null;
    }

    const prices = parsed.filter(isHistoricalPrice);

    if (prices.length !== parsed.length) {
      console.warn(`Skipping ${ticker}: historical data contains invalid entries.`);
      return null;
    }

    if (prices.length === 0) {
      console.warn(`Skipping ${ticker}: historical data is empty.`);
      return null;
    }

    return prices;
  } catch (error) {
    console.warn(`Skipping ${ticker}: failed to parse historical data.`, error);
    return null;
  }
}

function readHistoricalPrices(ticker: string): HistoricalPrice[] | null {
  const filePath = path.join(HISTORICAL_DATA_DIR, `${ticker}.json`);

  try {
    const fileContents = readFileSync(filePath, "utf8");
    return parseHistoricalData(fileContents, ticker);
  } catch (error) {
    console.warn(`Skipping ${ticker}: missing or unreadable historical data file.`, error);
    return null;
  }
}

function getStartingPrice(prices: HistoricalPrice[]): number | null {
  const firstTradingDay = prices[0];

  if (!firstTradingDay || firstTradingDay.close <= 0) {
    return null;
  }

  return firstTradingDay.close;
}

function getEndingPrice(prices: HistoricalPrice[]): number | null {
  const lastTradingDay = prices[prices.length - 1];

  if (!lastTradingDay || lastTradingDay.close < 0) {
    return null;
  }

  return lastTradingDay.close;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function getAllocatedCapital(portfolio: Portfolio): number {
  return portfolio.reduce((sum, pick) => {
    if (pick.dollarsAllocated <= 0) {
      return sum;
    }

    return sum + pick.dollarsAllocated;
  }, 0);
}

export function getPositionResult(
  pick: DraftPick,
  historicalDataByTicker: HistoricalDataByTicker,
): PositionResult {
  const prices = historicalDataByTicker[pick.ticker];

  if (!prices || prices.length === 0) {
    return {
      sector: pick.sector,
      ticker: pick.ticker,
      dollarsAllocated: pick.dollarsAllocated,
      endingValue: 0,
      positionReturnPercent: 0,
      hasData: false,
    };
  }

  const startingPrice = getStartingPrice(prices);
  const endingPrice = getEndingPrice(prices);

  if (startingPrice === null || endingPrice === null) {
    console.warn(`Skipping ${pick.ticker}: invalid starting or ending price.`);

    return {
      sector: pick.sector,
      ticker: pick.ticker,
      dollarsAllocated: pick.dollarsAllocated,
      endingValue: 0,
      positionReturnPercent: 0,
      hasData: false,
    };
  }

  const sharesPurchased = pick.dollarsAllocated / startingPrice;
  const endingValue = roundToCents(sharesPurchased * endingPrice);
  const positionReturnPercent =
    pick.dollarsAllocated > 0
      ? roundToCents(((endingValue - pick.dollarsAllocated) / pick.dollarsAllocated) * 100)
      : 0;

  return {
    sector: pick.sector,
    ticker: pick.ticker,
    dollarsAllocated: pick.dollarsAllocated,
    endingValue,
    positionReturnPercent,
    hasData: true,
  };
}

export function simulateWithHistoricalData(
  portfolio: Portfolio,
  historicalDataByTicker: HistoricalDataByTicker,
): SimulationResult {
  if (portfolio.length === 0) {
    return {
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
    };
  }

  const allocatedCapital = getAllocatedCapital(portfolio);
  const leftoverCash = Math.max(0, STARTING_BUDGET - allocatedCapital);

  let investedEndingValue = 0;

  for (const pick of portfolio) {
    if (pick.dollarsAllocated <= 0) {
      continue;
    }

    const position = getPositionResult(pick, historicalDataByTicker);

    if (!position.hasData) {
      continue;
    }

    investedEndingValue += position.endingValue;
  }

  const startingValue = STARTING_BUDGET;
  const endingValue = investedEndingValue + leftoverCash;
  const totalReturnPercent = ((endingValue - startingValue) / startingValue) * 100;

  return {
    startingValue: roundToCents(startingValue),
    endingValue: roundToCents(endingValue),
    totalReturnPercent: roundToCents(totalReturnPercent),
  };
}

export function simulate(portfolio: Portfolio): SimulationResult {
  const historicalDataByTicker: HistoricalDataByTicker = {};

  for (const pick of portfolio) {
    if (pick.ticker in historicalDataByTicker) {
      continue;
    }

    historicalDataByTicker[pick.ticker] = readHistoricalPrices(pick.ticker) ?? undefined;
  }

  return simulateWithHistoricalData(portfolio, historicalDataByTicker);
}