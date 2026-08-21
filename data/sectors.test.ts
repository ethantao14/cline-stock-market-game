import { describe, expect, it } from "vitest";
import { SECTORS, STOCKS_BY_SECTOR } from "./sectors";

describe("sectors data", () => {
  it("has exactly 8 sectors", () => {
    expect(SECTORS).toHaveLength(8);
  });

  it("has a stock list for every sector, sized 15-20", () => {
    for (const sector of SECTORS) {
      const stocks = STOCKS_BY_SECTOR[sector];
      expect(stocks.length).toBeGreaterThanOrEqual(15);
      expect(stocks.length).toBeLessThanOrEqual(20);
    }
  });

  it("has no duplicate tickers across sectors", () => {
    const allTickers = SECTORS.flatMap((sector) =>
      STOCKS_BY_SECTOR[sector].map((stock) => stock.ticker),
    );
    expect(new Set(allTickers).size).toBe(allTickers.length);
  });

  it("labels every stock with the sector its list is keyed under", () => {
    for (const sector of SECTORS) {
      for (const stock of STOCKS_BY_SECTOR[sector]) {
        expect(stock.sector).toBe(sector);
      }
    }
  });
});
