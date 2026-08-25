import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getHistoricalDataKey,
  simulateWithHistoricalData,
  type HistoricalDataByYearAndTicker,
  type HistoricalPrice,
} from "./simulate-core";
import type { Portfolio, SimulationResult } from "./types";

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

function getHistoricalFilePath(year: number, ticker: string): string {
  return path.join(HISTORICAL_DATA_DIR, String(year), `${ticker}.json`);
}

function parseHistoricalData(json: string, ticker: string, year: number): HistoricalPrice[] | null {
  try {
    const parsed = JSON.parse(json) as unknown;

    if (!Array.isArray(parsed)) {
      console.warn(`Skipping ${ticker} (${year}): historical data is not an array.`);
      return null;
    }

    const prices = parsed.filter(isHistoricalPrice);

    if (prices.length !== parsed.length) {
      console.warn(`Skipping ${ticker} (${year}): historical data contains invalid entries.`);
      return null;
    }

    if (prices.length === 0) {
      console.warn(`Skipping ${ticker} (${year}): historical data is empty.`);
      return null;
    }

    return prices;
  } catch (error) {
    console.warn(`Skipping ${ticker} (${year}): failed to parse historical data.`, error);
    return null;
  }
}

function readHistoricalPrices(year: number, ticker: string): HistoricalPrice[] | null {
  const filePath = getHistoricalFilePath(year, ticker);

  try {
    const fileContents = readFileSync(filePath, "utf8");
    return parseHistoricalData(fileContents, ticker, year);
  } catch {
    console.warn(`No historical data for ${ticker} in ${year}`);
    return null;
  }
}

export function simulate(portfolio: Portfolio): SimulationResult {
  const historicalDataByYearAndTicker: HistoricalDataByYearAndTicker = {};

  for (const pick of portfolio) {
    const key = getHistoricalDataKey(pick.year, pick.ticker);

    if (key in historicalDataByYearAndTicker) {
      continue;
    }

    historicalDataByYearAndTicker[key] = readHistoricalPrices(pick.year, pick.ticker) ?? undefined;
  }

  return simulateWithHistoricalData(portfolio, historicalDataByYearAndTicker);
}