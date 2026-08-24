import { describe, expect, it } from "vitest";

import { SECTORS } from "./sectors";
import { HISTORICAL_DATA } from "./historical-index";
import { getAvailableStocks } from "@/lib/available-stocks";

describe("historical data index", () => {
  it("has price data for every stock the draft can offer", () => {
    for (const sector of SECTORS) {
      for (const stock of getAvailableStocks(sector)) {
        const prices = HISTORICAL_DATA[stock.ticker];
        expect(prices).toBeDefined();
        expect(prices?.length).toBeGreaterThan(0);
      }
    }
  });
});
