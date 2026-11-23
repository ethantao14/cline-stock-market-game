// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { Children, cloneElement, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { describePortfolioSeries } from "@/lib/chart-summaries";
import type { PortfolioValuePoint } from "@/lib/simulate-core";
import { PortfolioValueChart } from "./PortfolioValueChart";

vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: { children: ReactElement }) =>
    cloneElement(Children.only(children) as ReactElement<{ width: number; height: number }>, {
      width: 800,
      height: 288,
    }),
}));

function point(monthIndex: number, value: number): PortfolioValuePoint {
  return { monthIndex, label: `Year ${monthIndex / 12}`, value };
}

afterEach(cleanup);

describe("PortfolioValueChart", () => {
  it("includes the portfolio summary in a screen-reader-only element inside the card", () => {
    const series = [point(0, 100), point(12, 85.1), point(24, 160.2), point(120, 142.3)];
    const { container } = render(<PortfolioValueChart series={series} />);
    const summary = container.querySelector<HTMLElement>(".sr-only");

    expect(summary).toBeInTheDocument();
    expect(summary?.textContent).toBe(describePortfolioSeries(series));
    expect(container.firstElementChild).toContainElement(summary);
  });

  it("renders nothing for an empty series", () => {
    const { container } = render(<PortfolioValueChart series={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
