import { beforeEach, describe, expect, it, vi } from "vitest";

import { SECTORS } from "@/data/sectors";
import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";
import fs from "node:fs";
import path from "node:path";

import { getAvailableStocks } from "./available-stocks";

const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), "data/historical");

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getAvailableStocks", () => {
  it("only returns stocks that have a matching historical data file", () => {
    for (const year of AVAILABLE_SIMULATION_YEARS) {
      for (const sector of SECTORS) {
        for (const stock of getAvailableStocks(sector, year)) {
          const filePath = path.join(HISTORICAL_DATA_DIR, `${stock.ticker}.json`);
          expect(fs.existsSync(filePath)).toBe(true);

          const fileContents = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(fileContents) as Array<{ date: string; close: number }>;
          expect(data.some((entry) => entry.date.startsWith(`${year}-01-`))).toBe(true);
          expect(data.some((entry) => entry.date.startsWith(`${year + 10}-01-`))).toBe(true);
        }
      }
    }
  });

  it("includes every sector ticker that now has historical data", () => {
    const industrials = getAvailableStocks("Industrials", 2012).map((stock) => stock.ticker);

    expect(industrials).toContain("EMR");
    expect(industrials).toContain("ETN");
  });

  it("allows a ticker with historical data even when it has no STARTING_PRICES entry", () => {
    const mockedFile = JSON.stringify([
      { date: "2005-01-01", close: 10 },
      { date: "2015-01-01", close: 20 },
    ]);
    const originalReadFileSync = fs.readFileSync;

    vi.spyOn(fs, "readFileSync").mockImplementation((filePath, options) => {
      const normalizedPath = String(filePath);

      if (normalizedPath.endsWith(`${path.sep}AAPL.json`)) {
        return mockedFile as never;
      }

      return originalReadFileSync(filePath, options as never);
    });

    const technologyTickers = getAvailableStocks("Technology", 2005).map((stock) => stock.ticker);

    expect(technologyTickers).toContain("AAPL");
  });

  it("keeps all 160 sector/year cells populated and updates the offerable pick count", () => {
    const cellSizes = AVAILABLE_SIMULATION_YEARS.flatMap((year) =>
      SECTORS.map((sector) => getAvailableStocks(sector, year).length),
    );

    expect(cellSizes).toHaveLength(160);
    expect(cellSizes.every((size) => size > 0)).toBe(true);
    expect(Math.min(...cellSizes)).toBe(11);
    expect(cellSizes.reduce((sum, size) => sum + size, 0)).toBe(2469);
  });
});
