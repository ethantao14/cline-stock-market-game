import { describe, expect, it } from "vitest";

import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";
import { SECTORS } from "./sectors";
import { HISTORICAL_DATA } from "./historical-index";
import { getAvailableStocks } from "@/lib/available-stocks";

describe("historical data index", () => {
  it("has price data for every stock the draft can offer", () => {
    for (const year of AVAILABLE_SIMULATION_YEARS) {
      for (const sector of SECTORS) {
        for (const stock of getAvailableStocks(sector, year)) {
          const prices = HISTORICAL_DATA[stock.ticker];
          expect(prices).toBeDefined();
          expect(prices?.length).toBeGreaterThan(0);
          expect(prices?.some((entry) => entry.date.startsWith(`${year}-01-`))).toBe(true);
          expect(prices?.some((entry) => entry.date.startsWith(`${year + 10}-01-`))).toBe(true);
        }
      }
    }
  });

  it("has no consecutive-month price ratio above 10x for any ticker", () => {
    const warningThresholdTrips: Array<{
      ticker: string;
      previousDate: string;
      previousClose: number;
      currentDate: string;
      currentClose: number;
      ratio: number;
    }> = [];

    for (const [ticker, prices] of Object.entries(HISTORICAL_DATA)) {
      for (let index = 1; index < prices.length; index += 1) {
        const previous = prices[index - 1];
        const current = prices[index];

        if (previous.close <= 0 || current.close <= 0) {
          continue;
        }

        const ratio = Math.max(current.close / previous.close, previous.close / current.close);

        if (ratio > 3) {
          warningThresholdTrips.push({
            ticker,
            previousDate: previous.date,
            previousClose: previous.close,
            currentDate: current.date,
            currentClose: current.close,
            ratio: Number(ratio.toFixed(2)),
          });
        }

        expect(
          ratio,
          `${ticker} jumped ${ratio.toFixed(2)}x from ${previous.date} (${previous.close}) to ${current.date} (${current.close})`,
        ).toBeLessThanOrEqual(10);
      }
    }

    if (warningThresholdTrips.length > 0) {
      console.warn("Historical data 3x price-ratio warnings:", warningThresholdTrips);
    }
  });
});
