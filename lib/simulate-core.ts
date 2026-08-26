import { STARTING_BUDGET } from "./draft-reducer";
import type { DraftPick, Portfolio, SimulationResult } from "./types";

export type HistoricalPrice = {
  date: string;
  close: number;
};

export type HistoricalDataByYearAndTicker = Partial<
  Record<DraftPick["year"], Partial<Record<string, HistoricalPrice[]>>>
>;

export type PositionResult = {
  sector: DraftPick["sector"];
  ticker: string;
  year: DraftPick["year"];
  dollarsAllocated: number;
  endingValue: number;
  positionReturnPercent: number;
  hasData: boolean;
};

function getHistoricalPrices(
  historicalDataByYearAndTicker: HistoricalDataByYearAndTicker,
  pick: DraftPick,
): HistoricalPrice[] | undefined {
  return historicalDataByYearAndTicker[pick.year]?.[pick.ticker];
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
  const prices = getHistoricalPrices(historicalDataByYearAndTicker, pick);

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
    };
  }

  const allocatedCapital = getAllocatedCapital(portfolio);
  const leftoverCash = Math.max(0, STARTING_BUDGET - allocatedCapital);

  let investedEndingValue = 0;

  for (const pick of portfolio) {
    if (pick.dollarsAllocated <= 0) {
      continue;
    }

    const position = getPositionResult(pick, historicalDataByYearAndTicker);

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
  label: string;
  value: number;
};

// Trading-day value series, aligned by index within each position's own
// price array rather than by calendar date. Picks can belong to different
// years (multi-year simulation), so a literal date isn't comparable across
// positions in different years at all, "day 1" of a 2019 pick and "day 1"
// of a 2022 pick share no calendar. Within the same year, every ticker's
// historical file has an identical calendar (verified against the fetched
// dataset), so index alignment is equivalent to date alignment there too.
// Trades that accuracy for the (currently unobserved) case of a same-year
// ticker missing a day at the start of its file, which would shift it by
// one slot; deliberately not guarded against, same reasoning as not
// carrying forward stale prices for calendar gaps elsewhere in this file.
//
// Years don't all have the same trading-day count (2020 has 252, every
// other supported year has 251), so a position from a shorter year is held
// at its own last known price once the longer year's positions still have
// days left. This keeps the chart's final point consistent with
// simulateWithHistoricalData's ending value, which always uses each
// position's own actual last price regardless of length.
//
// Summed day by day plus leftover cash held flat throughout. Positions
// without valid data are excluded, same as the return calculation.
export function computePortfolioValueSeries(
  portfolio: Portfolio,
  historicalDataByYearAndTicker: HistoricalDataByYearAndTicker,
): PortfolioValuePoint[] {
  const leftoverCash = Math.max(0, STARTING_BUDGET - getAllocatedCapital(portfolio));

  const positions = portfolio
    .filter((pick) => pick.dollarsAllocated > 0)
    .flatMap((pick) => {
      const prices = getHistoricalPrices(historicalDataByYearAndTicker, pick);
      const startingPrice = prices ? getStartingPrice(prices) : null;
      const endingPrice = prices ? getEndingPrice(prices) : null;

      // Same validity check as getPositionResult, so a position the summary
      // marks as skipped can't still show up in the chart.
      if (!prices || startingPrice === null || endingPrice === null) {
        return [];
      }

      return [{ prices, shares: pick.dollarsAllocated / startingPrice }];
    });

  if (positions.length === 0) {
    return [];
  }

  const tradingDayCount = Math.max(...positions.map((position) => position.prices.length));

  return Array.from({ length: tradingDayCount }, (_, dayIndex) => {
    const value = positions.reduce((sum, position) => {
      const price = position.prices[dayIndex] ?? position.prices[position.prices.length - 1];
      return sum + position.shares * price.close;
    }, leftoverCash);

    return { label: `Day ${dayIndex + 1}`, value: roundToCents(value) };
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
