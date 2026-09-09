import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { buildResultsClipboardText } from "./page";
import type { RankResult } from "@/lib/rank";
import type { PositionResult } from "@/lib/simulate-core";

describe("buildResultsClipboardText", () => {
  it("formats the results summary with years and the real percentile rank", () => {
    const positions: PositionResult[] = [
      {
        sector: "Technology",
        year: 2022,
        ticker: "AAPL",
        positionReturnPercent: -5,
        hasData: true,
      },
      {
        sector: "Healthcare",
        year: 2021,
        ticker: "JNJ",
        positionReturnPercent: 16.7,
        hasData: true,
      },
    ];

    const rank: RankResult = {
      percentile: 78,
      sampleSize: 2000,
      medianReturnPercent: 3.25,
      sampledReturns: [],
    };

    expect(
      buildResultsClipboardText({
        totalReturnPercent: 25.43,
        positions,
        rank,
      }),
    ).toBe(`Stock Market Draft Results

Total Return: +25.43%

Portfolio:
Technology (2022): AAPL (-5%)
Healthcare (2021): JNJ (+16.7%)

Percentile Rank: 78th percentile vs random drafts`);
  });

  it("marks positions with no historical data as No data", () => {
    const positions: PositionResult[] = [
      {
        sector: "Energy",
        year: 2020,
        ticker: "XOM",
        positionReturnPercent: 0,
        hasData: false,
      },
    ];

    const rank: RankResult = {
      percentile: 50,
      sampleSize: 1000,
      medianReturnPercent: 2.1,
      sampledReturns: [],
    };

    const text = buildResultsClipboardText({
      totalReturnPercent: 0,
      positions,
      rank,
    });

    expect(text).toContain("Energy (2020): XOM (No data)");
  });
});