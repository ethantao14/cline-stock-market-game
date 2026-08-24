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

  it("includes every sector ticker that now has historical data", () => {
    const industrials = getAvailableStocks("Industrials").map((stock) => stock.ticker);

    expect(industrials).toContain("EMR");
    expect(industrials).toContain("ETN");
  });
});
