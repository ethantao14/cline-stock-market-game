import { describe, expect, it } from "vitest";

import { describePortfolioSeries, describeRankDistribution } from "./chart-summaries";
import type { RankResult } from "./rank";
import type { PortfolioValuePoint } from "./simulate-core";

function point(monthIndex: number, value: number): PortfolioValuePoint {
  return { monthIndex, label: `Year ${monthIndex / 12}`, value };
}

function makeRank(sampledReturns: number[]): RankResult {
  return { percentile: 78, sampleSize: 2000, medianReturnPercent: 3.25, sampledReturns };
}

describe("describePortfolioSeries", () => {
  it("summarizes the endpoints and extremes with one decimal place", () => {
    const series = [point(0, 100), point(12, 160.2), point(24, 85.1), point(120, 142.3)];

    expect(describePortfolioSeries(series)).toBe(
      "Chart summary: your portfolio index starts at 100.0 and ends at 142.3 after 10 years. Its low was 85.1 and its high was 160.2.",
    );
  });

  it("returns an empty string for an empty series", () => {
    expect(describePortfolioSeries([])).toBe("");
  });
});

describe("describeRankDistribution", () => {
  it("summarizes sample size, return extremes, actual return, and percentile", () => {
    expect(describeRankDistribution(makeRank([10, 85, -40.1, 0]), 12.3)).toBe(
      "Chart summary: 2,000 random drafts returned between -40.10% and +85.00%. Your return of +12.30% beat 78% of them.",
    );
  });

  it.each([
    [0, "+0.00%"],
    [-12.3, "-12.30%"],
  ])("formats an actual return of %s with its sign", (actualReturn, formatted) => {
    expect(describeRankDistribution(makeRank([85, 0, 10]), actualReturn)).toBe(
      `Chart summary: 2,000 random drafts returned between +0.00% and +85.00%. Your return of ${formatted} beat 78% of them.`,
    );
  });

  it("returns an empty string for empty sampled returns", () => {
    expect(describeRankDistribution(makeRank([]), 12.3)).toBe("");
  });
});
