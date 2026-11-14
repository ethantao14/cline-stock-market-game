import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { RankResult } from "@/lib/rank";
import { PercentileRankCard } from "./PercentileRankCard";

function makeRank(overrides: Partial<RankResult> = {}): RankResult {
  return {
    percentile: 78,
    sampleSize: 2000,
    medianReturnPercent: 3.25,
    sampledReturns: [],
    ...overrides,
  };
}

describe("PercentileRankCard", () => {
  it("renders nothing when rank is null", () => {
    const { container } = render(<PercentileRankCard rank={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the percentile and rank tier", () => {
    const { container } = render(<PercentileRankCard rank={makeRank()} />);

    expect(container.firstElementChild).toHaveTextContent("Your rank");
    expect(container.firstElementChild).toHaveTextContent("You beat 78% of random drafts");
    expect(container.firstElementChild).toHaveTextContent("(Sharp Picker)");
  });

  it.each([
    [90, "Elite Drafter"],
    [89, "Sharp Picker"],
    [70, "Sharp Picker"],
    [40, "Coin Flip"],
    [15, "Below Average"],
    [14, "Rough Draft"],
    [0, "Rough Draft"],
  ])("shows %s percentile as %s", (percentile, tier) => {
    const { container } = render(<PercentileRankCard rank={makeRank({ percentile })} />);

    expect(container.firstElementChild).toHaveTextContent(`(${tier})`);
  });

  it.each([
    [3.25, "+3.25%"],
    [-4.1, "-4.10%"],
    [0, "+0.00%"],
    [12.346, "+12.35%"],
  ])("formats median return %s as %s", (medianReturnPercent, formattedReturn) => {
    const { container } = render(
      <PercentileRankCard rank={makeRank({ medianReturnPercent })} />,
    );

    expect(container.firstElementChild).toHaveTextContent(`returned ${formattedReturn}.`);
  });
});
