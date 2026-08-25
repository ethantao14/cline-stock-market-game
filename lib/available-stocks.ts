import fs from "node:fs";
import path from "node:path";

import { STOCKS_BY_SECTOR } from "@/data/sectors";
import { STARTING_PRICES } from "@/data/starting-prices";
import type { Sector, Stock } from "@/lib/types";

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

export function getAvailableStocks(sector: Sector, year: 2019 | 2020 | 2021 | 2022): Stock[] {
  return STOCKS_BY_SECTOR[sector].filter((stock) => {
    if (!(stock.ticker in STARTING_PRICES)) {
      return false;
    }

    return fs.existsSync(path.join(HISTORICAL_DATA_DIR, String(year), `${stock.ticker}.json`));
  });
}
