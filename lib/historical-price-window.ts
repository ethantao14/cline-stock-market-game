import type { DraftPick } from "@/lib/types";

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

const HOLDING_WINDOW_MONTH_COUNT = 121;

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const absoluteMonth = year * 12 + (month - 1) + delta;

  return {
    year: Math.floor(absoluteMonth / 12),
    month: (absoluteMonth % 12) + 1,
  };
}

function makeMonthDate(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function dedupeByMonth(prices: HistoricalPricePoint[]): HistoricalPricePoint[] {
  const seenMonths = new Set<string>();

  return prices.filter((entry) => {
    const monthKey = getMonthKey(entry.date);

    if (seenMonths.has(monthKey)) {
      return false;
    }

    seenMonths.add(monthKey);
    return true;
  });
}

export function findPriceForMonth(prices: HistoricalPricePoint[], year: number, month: number): HistoricalPricePoint | undefined {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return prices.find((entry) => entry.date.startsWith(prefix));
}

export function getHoldingWindowForPick(prices: HistoricalPricePoint[], pickYear: DraftPick["year"]): HistoricalPricePoint[] {
  const normalizedPrices = dedupeByMonth(prices);
  const start = findPriceForMonth(normalizedPrices, pickYear, 1);
  const end = findPriceForMonth(normalizedPrices, pickYear + 10, 1);

  if (!start || !end) {
    return [];
  }

  const priceByMonth = new Map(normalizedPrices.map((entry) => [getMonthKey(entry.date), entry]));
  const holdingWindow: HistoricalPricePoint[] = [];
  let previousPrice: HistoricalPricePoint | undefined;

  for (let offset = 0; offset < HOLDING_WINDOW_MONTH_COUNT; offset += 1) {
    const { year, month } = addMonths(pickYear, 1, offset);
    const targetDate = makeMonthDate(year, month);
    const monthKey = getMonthKey(targetDate);
    const exactEntry = priceByMonth.get(monthKey);

    if (exactEntry) {
      holdingWindow.push(exactEntry);
      previousPrice = exactEntry;
      continue;
    }

    if (!previousPrice) {
      return [];
    }

    holdingWindow.push({ date: targetDate, close: previousPrice.close });
    previousPrice = holdingWindow[holdingWindow.length - 1];
  }

  return holdingWindow;
}

export function getJanuaryOpeningPriceForYear(prices: HistoricalPricePoint[], year: DraftPick["year"]): number | null {
  return findPriceForMonth(prices, year, 1)?.close ?? null;
}