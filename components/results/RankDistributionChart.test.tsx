// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { Children, cloneElement, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { describeRankDistribution } from "@/lib/chart-summaries";
import type { RankResult } from "@/lib/rank";
import { RankDistributionChart } from "./RankDistributionChart";

vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: { children: ReactElement }) =>
    cloneElement(Children.only(children) as ReactElement<{ width: number; height: number }>, {
      width: 800,
      height: 288,
    }),
}));

function makeRank(sampledReturns: number[] = [-40.1, 0, 12.3, 85]): RankResult {
  return { percentile: 78, sampleSize: 2000, medianReturnPercent: 6.15, sampledReturns };
}

afterEach(cleanup);

describe("RankDistributionChart", () => {
  it("includes the rank summary in a screen-reader-only element inside the card", () => {
    const rank = makeRank();
    const actualReturnPercent = 12.3;
    const { container } = render(
      <RankDistributionChart rank={rank} actualReturnPercent={actualReturnPercent} />,
    );
    const summary = container.querySelector<HTMLElement>(".sr-only");

    expect(summary).toBeInTheDocument();
    expect(summary?.textContent).toBe(describeRankDistribution(rank, actualReturnPercent));
    expect(container.firstElementChild).toContainElement(summary);
  });

  it("renders nothing for a null rank", () => {
    const { container } = render(<RankDistributionChart rank={null} actualReturnPercent={12.3} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for empty sampled returns", () => {
    const { container } = render(
      <RankDistributionChart rank={makeRank([])} actualReturnPercent={12.3} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
