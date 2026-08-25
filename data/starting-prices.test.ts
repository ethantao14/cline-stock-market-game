import { describe, expect, it } from "vitest";

import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";
import { SECTORS } from "./sectors";
import { STARTING_PRICES } from "./starting-prices";
import { getAvailableStocks } from "@/lib/available-stocks";

describe("starting prices", () => {
  it("has a starting price for every available stock", () => {
    for (const year of AVAILABLE_SIMULATION_YEARS) {
      for (const sector of SECTORS) {
        for (const stock of getAvailableStocks(sector, year)) {
          expect(STARTING_PRICES[stock.ticker]).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never includes an ending price or return, only a single positive number", () => {
    for (const price of Object.values(STARTING_PRICES)) {
      expect(typeof price).toBe("number");
      expect(price).toBeGreaterThan(0);
    }
  });
});
