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
        dollarsAllocated: 1500,
        endingValue: 1425,
        positionReturnPercent: -5,
        hasData: true,
      },
      {
        sector: "Healthcare",
        year: 2021,
        ticker: "JNJ",
        dollarsAllocated: 2000,
        endingValue: 2334,
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
        startingValue: 10000,
        endingValue: 12543.5,
        totalReturnPercent: 25.43,
        positions,
        rank,
      }),
    ).toBe(`Stock Market Draft Results

Starting Capital: $10,000.00
Ending Value: $12,543.50
Total Return: +25.43%

Portfolio:
Technology (2022): AAPL - $1,500.00 allocated → $1,425.00 ending (-5%)
Healthcare (2021): JNJ - $2,000.00 allocated → $2,334.00 ending (+16.7%)

Percentile Rank: 78th percentile vs random drafts`);
  });
});