import { STOCKS_BY_SECTOR } from "@/data/sectors";
import { STARTING_PRICES } from "@/data/starting-prices";
import type { Sector, Stock } from "@/lib/types";

// Availability is derived from STARTING_PRICES (generated from
// data/historical/*.json) rather than a hand-maintained list, so this can't
// go stale the way a hardcoded exclusion set did before.
export function getAvailableStocks(sector: Sector): Stock[] {
  return STOCKS_BY_SECTOR[sector].filter((stock) => stock.ticker in STARTING_PRICES);
}
