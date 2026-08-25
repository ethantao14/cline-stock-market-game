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

export type PortfolioValuePoint = {
  date: string;
  value: number;
};

// One trading-day value series per pick, keyed by the pick's own historical
// prices, then summed day by day plus leftover cash held flat throughout.
// Positions without valid data are excluded, same as the return calculation.
export function computePortfolioValueSeries(
  portfolio: Portfolio,
  historicalDataByTicker: HistoricalDataByTicker,
): PortfolioValuePoint[] {
  const leftoverCash = Math.max(0, STARTING_BUDGET - getAllocatedCapital(portfolio));

  const positions = portfolio
    .filter((pick) => pick.dollarsAllocated > 0)
    .flatMap((pick) => {
      const prices = historicalDataByTicker[pick.ticker];
      const startingPrice = prices ? getStartingPrice(prices) : null;

      if (!prices || startingPrice === null) {
        return [];
      }

      return [{ prices, shares: pick.dollarsAllocated / startingPrice }];
    });

  const referencePrices = positions[0]?.prices;

  if (!referencePrices) {
    return [];
  }

  return referencePrices.map((referenceDay, dayIndex) => {
    const value = positions.reduce((sum, position) => {
      const dayPrice = position.prices[dayIndex];
      return dayPrice ? sum + position.shares * dayPrice.close : sum;
    }, leftoverCash);

    return { date: referenceDay.date, value: roundToCents(value) };
  });
}

export type BestAndWorstPositions = {
  bestPosition: PositionResult | null;
  worstPosition: PositionResult | null;
};

// Ranks by positionReturnPercent among positions with real data. Ignores
// positions with hasData: false, since there's no return to rank them by.
export function findBestAndWorstPositions(positions: PositionResult[]): BestAndWorstPositions {
  const validPositions = positions.filter((position) => position.hasData);

  if (validPositions.length === 0) {
    return { bestPosition: null, worstPosition: null };
  }

  return validPositions.reduce<BestAndWorstPositions>(
    (extremes, position) => ({
      bestPosition:
        !extremes.bestPosition ||
        position.positionReturnPercent > extremes.bestPosition.positionReturnPercent
          ? position
          : extremes.bestPosition,
      worstPosition:
        !extremes.worstPosition ||
        position.positionReturnPercent < extremes.worstPosition.positionReturnPercent
          ? position
          : extremes.worstPosition,
    }),
    { bestPosition: null, worstPosition: null },
  );
}
