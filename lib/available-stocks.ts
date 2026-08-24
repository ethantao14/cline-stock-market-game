import { STOCKS_BY_SECTOR } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

// A small handful of shared-list tickers still lack a matching historical file.
// Filtered out here for the draft flow until the remaining data gap is resolved.
const TICKERS_WITHOUT_HISTORICAL_DATA = new Set(["EMR", "ETN"]);

export function getAvailableStocks(sector: Sector): Stock[] {
  return STOCKS_BY_SECTOR[sector].filter(
    (stock) => !TICKERS_WITHOUT_HISTORICAL_DATA.has(stock.ticker),
  );
}
