import { STARTING_BUDGET } from "./draft-reducer";
import type {
  DraftPick,
  Portfolio,
  SimulationMissingDataPick,
  SimulationPositionResult,
  SimulationResult,
} from "./types";

export type HistoricalPrice = {
  date: string;
  close: number;
};

export type HistoricalDataByYearAndTicker = Partial<Record<string, HistoricalPrice[]>>;
export type PositionResult = SimulationPositionResult;

export function getHistoricalDataKey(year: number, ticker: string): string {
  return `${year}:${ticker}`;
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
  historicalDataByYearAndTicker: HistoricalDataByYearAndTicker,
): PositionResult {
  const prices = historicalDataByYearAndTicker[getHistoricalDataKey(pick.year, pick.ticker)];

  if (!prices || prices.length === 0) {
    return {
      sector: pick.sector,
      ticker: pick.ticker,
      year: pick.year,
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
      year: pick.year,
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
    year: pick.year,
    dollarsAllocated: pick.dollarsAllocated,
    endingValue,
    positionReturnPercent,
    hasData: true,
  };
}

export function simulateWithHistoricalData(
  portfolio: Portfolio,
  historicalDataByYearAndTicker: HistoricalDataByYearAndTicker,
): SimulationResult {
  if (portfolio.length === 0) {
    return {
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
      positions: [],
      missingDataPicks: [],
    };
  }

  const allocatedCapital = getAllocatedCapital(portfolio);
  const leftoverCash = Math.max(0, STARTING_BUDGET - allocatedCapital);

  let investedEndingValue = 0;
  const positions: SimulationPositionResult[] = [];
  const missingDataPicks: SimulationMissingDataPick[] = [];

  for (const pick of portfolio) {
    if (pick.dollarsAllocated <= 0) {
      continue;
    }

    const position = getPositionResult(pick, historicalDataByYearAndTicker);
    positions.push(position);

    if (!position.hasData) {
      missingDataPicks.push({
        sector: position.sector,
        ticker: position.ticker,
        year: position.year,
      });
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
    positions,
    missingDataPicks,
  };
}