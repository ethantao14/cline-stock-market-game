import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StockOptionButton } from "./StockOptionButton";

const stock = { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" as const };

describe("StockOptionButton", () => {
  it("shows only ticker and name in blind mode", () => {
    render(<StockOptionButton stock={stock} isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.queryByText(/as of Jan 2022/)).not.toBeInTheDocument();
  });

  it("shows the starting price when provided, in informed mode", () => {
    render(
      <StockOptionButton
        stock={stock}
        isSelected={false}
        startingPrice={182.01}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/\$182\.01 as of Jan 2022/)).toBeInTheDocument();
  });
});
