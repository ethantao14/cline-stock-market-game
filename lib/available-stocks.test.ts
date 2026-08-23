import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import fs from "node:fs";
import path from "node:path";

import { getAvailableStocks } from "./available-stocks";

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

describe("getAvailableStocks", () => {
  it("only returns stocks that have a matching historical data file", () => {
    for (const sector of SECTORS) {
      for (const stock of getAvailableStocks(sector)) {
        const filePath = path.join(HISTORICAL_DATA_DIR, `${stock.ticker}.json`);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    }
  });

  it("excludes the known tickers missing historical data", () => {
    const industrials = getAvailableStocks("Industrials").map((stock) => stock.ticker);
    const energy = getAvailableStocks("Energy").map((stock) => stock.ticker);

    expect(industrials).not.toContain("EMR");
    expect(industrials).not.toContain("ETN");
    expect(energy).not.toContain("HES");
    expect(energy).not.toContain("PXD");
  });
});
