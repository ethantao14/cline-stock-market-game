import { STOCKS_BY_SECTOR } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

// A handful of tickers in the shared sector lists (data/sectors.ts) don't have
// a matching file in data/historical/, so picking them would silently show
// "No data" on the results page. Filtered out here, scoped to the draft flow,
// rather than editing the shared sectors list.
const TICKERS_WITHOUT_HISTORICAL_DATA = new Set(["HES", "PXD", "EMR", "ETN"]);

export function getAvailableStocks(sector: Sector): Stock[] {
  return STOCKS_BY_SECTOR[sector].filter(
    (stock) => !TICKERS_WITHOUT_HISTORICAL_DATA.has(stock.ticker),
  );
}
