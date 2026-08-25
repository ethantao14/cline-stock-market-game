import { readFileSync } from "node:fs";
import path from "node:path";

import { simulateWithHistoricalData } from "./simulate-core";
import type { HistoricalDataByYearAndTicker, HistoricalPrice } from "./simulate-core";
import type { Portfolio, SimulationResult } from "./types";

export type { HistoricalDataByYearAndTicker, HistoricalPrice, PositionResult } from "./simulate-core";
export { getPositionResult, simulateWithHistoricalData } from "./simulate-core";

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

function readHistoricalPrices(year: number, ticker: string): HistoricalPrice[] | null {
  const filePath = path.join(HISTORICAL_DATA_DIR, String(year), `${ticker}.json`);

  try {
    const fileContents = readFileSync(filePath, "utf8");
    return parseHistoricalData(fileContents, ticker);
  } catch (error) {
    console.warn(`Skipping ${ticker}: missing or unreadable historical data file.`, error);
    return null;
  }
}

// Node-only convenience wrapper: reads data/historical/*.json from disk, so
// it can never run in a browser bundle. Client code must call
// simulateWithHistoricalData directly with pre-loaded data instead.
export function simulate(portfolio: Portfolio): SimulationResult {
  const historicalDataByYearAndTicker: HistoricalDataByYearAndTicker = {};

  for (const pick of portfolio) {
    historicalDataByYearAndTicker[pick.year] ??= {};

    if (pick.ticker in historicalDataByYearAndTicker[pick.year]!) {
      continue;
    }

    historicalDataByYearAndTicker[pick.year]![pick.ticker] = readHistoricalPrices(pick.year, pick.ticker) ?? undefined;
  }

  return simulateWithHistoricalData(portfolio, historicalDataByYearAndTicker);
}
