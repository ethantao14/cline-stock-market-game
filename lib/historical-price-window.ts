import type { DraftPick } from "@/lib/types";

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

export function findPriceForMonth(prices: HistoricalPricePoint[], year: number, month: number): HistoricalPricePoint | undefined {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return prices.find((entry) => entry.date.startsWith(prefix));
}

export function getHoldingWindowForPick(prices: HistoricalPricePoint[], pickYear: DraftPick["year"]): HistoricalPricePoint[] {
  const start = findPriceForMonth(prices, pickYear, 1);
  const end = findPriceForMonth(prices, pickYear + 10, 1);

  if (!start || !end) {
    return [];
  }

  return prices.filter((entry) => entry.date >= start.date && entry.date <= end.date);
}

export function getJanuaryOpeningPriceForYear(prices: HistoricalPricePoint[], year: DraftPick["year"]): number | null {
  return findPriceForMonth(prices, year, 1)?.close ?? null;
}