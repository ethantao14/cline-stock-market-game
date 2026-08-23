import { readFileSync } from "node:fs";
import path from "node:path";

import type { Portfolio, SimulationResult } from "./types";

type HistoricalPrice = {
  date: string;
  close: number;
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

export function simulate(portfolio: Portfolio): SimulationResult {
  if (portfolio.length === 0) {
    return {
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
    };
  }

  let startingValue = 0;
  let endingValue = 0;

  for (const pick of portfolio) {
    if (pick.dollarsAllocated <= 0) {
      continue;
    }

    const historicalPrices = readHistoricalPrices(pick.ticker);

    if (!historicalPrices) {
      continue;
    }

    const startingPrice = getStartingPrice(historicalPrices);
    const endingPrice = getEndingPrice(historicalPrices);

    if (startingPrice === null || endingPrice === null) {
      console.warn(`Skipping ${pick.ticker}: invalid starting or ending price.`);
      continue;
    }

    const sharesPurchased = pick.dollarsAllocated / startingPrice;
    const positionEndingValue = sharesPurchased * endingPrice;

    startingValue += pick.dollarsAllocated;
    endingValue += positionEndingValue;
  }

  if (startingValue === 0) {
    return {
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
    };
  }

  const totalReturnPercent =
    ((endingValue - startingValue) / startingValue) * 100;

  return {
    startingValue: roundToCents(startingValue),
    endingValue: roundToCents(endingValue),
    totalReturnPercent: roundToCents(totalReturnPercent),
  };
}