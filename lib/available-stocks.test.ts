import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";
import fs from "node:fs";
import path from "node:path";

import { getAvailableStocks } from "./available-stocks";

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

describe("getAvailableStocks", () => {
  it("only returns stocks that have a matching historical data file", () => {
    for (const year of AVAILABLE_SIMULATION_YEARS) {
      for (const sector of SECTORS) {
        for (const stock of getAvailableStocks(sector, year)) {
          const filePath = path.join(HISTORICAL_DATA_DIR, String(year), `${stock.ticker}.json`);
          expect(fs.existsSync(filePath)).toBe(true);
        }
      }
    }
  });

  it("includes every sector ticker that now has historical data", () => {
    const industrials = getAvailableStocks("Industrials", 2022).map((stock) => stock.ticker);

    expect(industrials).toContain("EMR");
    expect(industrials).toContain("ETN");
  });
});
