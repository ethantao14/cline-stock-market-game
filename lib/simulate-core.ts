import type { DraftPick, Portfolio, SimulationResult } from "./types";
import { getHoldingWindowForPick } from "./historical-price-window";

export type HistoricalPrice = {
  date: string;
  close: number;
};

export type HistoricalDataByTicker = Partial<Record<string, HistoricalPrice[]>>;

export type PositionResult = {
  sector: DraftPick["sector"];
  ticker: string;
  year: DraftPick["year"];
  positionReturnPercent: number;
  hasData: boolean;
};

function getHistoricalPrices(
  historicalDataByTicker: HistoricalDataByTicker,
  pick: DraftPick,
): HistoricalPrice[] | undefined {
  return historicalDataByTicker[pick.ticker];
}

function getHoldingWindow(prices: HistoricalPrice[], pickYear: DraftPick["year"]): HistoricalPrice[] {
  return getHoldingWindowForPick(prices, pickYear);
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

export function getPositionResult(
  pick: DraftPick,
  historicalDataByTicker: HistoricalDataByTicker,
): PositionResult {
  const prices = getHistoricalPrices(historicalDataByTicker, pick);
  const holdingWindow = prices ? getHoldingWindow(prices, pick.year) : [];

  if (holdingWindow.length === 0) {
    return {
      sector: pick.sector,
      ticker: pick.ticker,
      year: pick.year,
      positionReturnPercent: 0,
      hasData: false,
    };
  }

  const startingPrice = getStartingPrice(holdingWindow);
  const endingPrice = getEndingPrice(holdingWindow);

  if (startingPrice === null || endingPrice === null) {
    console.warn(`Skipping ${pick.ticker}: invalid starting or ending price.`);

    return {
      sector: pick.sector,
      ticker: pick.ticker,
      year: pick.year,
      positionReturnPercent: 0,
      hasData: false,
    };
  }

  const positionReturnPercent = roundToCents(((endingPrice - startingPrice) / startingPrice) * 100);

  return {
    sector: pick.sector,
    ticker: pick.ticker,
    year: pick.year,
    positionReturnPercent,
    hasData: true,
  };
}

// Equal-weight mean of each position's own percent change. A position
// without data is excluded from the average rather than counted as zero,
// since zero would understate an average built from real returns only.
export function simulateWithHistoricalData(
  portfolio: Portfolio,
  historicalDataByTicker: HistoricalDataByTicker,
): SimulationResult {
  const positionsWithData = portfolio
    .map((pick) => getPositionResult(pick, historicalDataByTicker))
    .filter((position) => position.hasData);

  if (positionsWithData.length === 0) {
    return { totalReturnPercent: 0 };
  }

  const totalReturnPercent =
    positionsWithData.reduce((sum, position) => sum + position.positionReturnPercent, 0) / positionsWithData.length;

  return { totalReturnPercent: roundToCents(totalReturnPercent) };
}

export type PortfolioValuePoint = {
  label: string;
  value: number;
};

const INDEX_START_VALUE = 100;

// Equal-weight index starting at 100, averaged point by point across each
// position's 121-month holding window. The series is aligned by window index,
// not calendar date, since picks from different years share no calendar. The
// final point matches the equal-weight return the summary reports.
export function computePortfolioValueSeries(
  portfolio: Portfolio,
  historicalDataByTicker: HistoricalDataByTicker,
): PortfolioValuePoint[] {
  const positions = portfolio.flatMap((pick) => {
    const prices = getHistoricalPrices(historicalDataByTicker, pick);
    const holdingWindow = prices ? getHoldingWindow(prices, pick.year) : [];
    const startingPrice = holdingWindow.length > 0 ? getStartingPrice(holdingWindow) : null;
    const endingPrice = holdingWindow.length > 0 ? getEndingPrice(holdingWindow) : null;

    // Same validity check as getPositionResult, so a position the summary
    // marks as skipped can't still show up in the chart.
    if (holdingWindow.length === 0 || startingPrice === null || endingPrice === null) {
      return [];
    }

    return [{ prices: holdingWindow, startingPrice }];
  });

  if (positions.length === 0) {
    return [];
  }

  const tradingDayCount = Math.max(...positions.map((position) => position.prices.length));

  return Array.from({ length: tradingDayCount }, (_, dayIndex) => {
    const indexTotal = positions.reduce((sum, position) => {
      const price = position.prices[dayIndex] ?? position.prices[position.prices.length - 1];
      return sum + (INDEX_START_VALUE * price.close) / position.startingPrice;
    }, 0);

    return { label: `Year ${Math.floor(dayIndex / 12)}`, value: roundToCents(indexTotal / positions.length) };
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
