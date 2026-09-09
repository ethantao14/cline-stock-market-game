import fs from "node:fs";
import path from "node:path";

import { STOCKS_BY_SECTOR } from "@/data/sectors";
import { STARTING_PRICES } from "@/data/starting-prices";
import type { Sector, Stock } from "@/lib/types";

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

type HistoricalPrice = {
  date: string;
  close: number;
};

function hasHistoricalDataForYear(ticker: string, year: 2019 | 2020 | 2021 | 2022): boolean {
  const filePath = path.join(HISTORICAL_DATA_DIR, `${ticker}.json`);

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContents) as HistoricalPrice[];

    return data.some((entry) => entry.date.startsWith(`${year}-`));
  } catch {
    return false;
  }
}

export function getAvailableStocks(sector: Sector, year: 2019 | 2020 | 2021 | 2022): Stock[] {
  return STOCKS_BY_SECTOR[sector].filter((stock) => {
    if (!(stock.ticker in STARTING_PRICES)) {
      return false;
    }

    return hasHistoricalDataForYear(stock.ticker, year);
  });
}
