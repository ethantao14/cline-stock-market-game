import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SimulationYear } from "@/lib/draft-reducer";

import { SectorDisplay } from "./SectorDisplay";

const stock = { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" as const };

afterEach(() => {
  cleanup();
});

function renderSectorDisplay({
  isLocked = false,
  spentYear,
}: {
  isLocked?: boolean;
  spentYear?: SimulationYear;
} = {}) {
  return render(
    <SectorDisplay
      sector="Technology"
      stock={stock}
      isLocked={isLocked}
      spentYear={spentYear}
      selectedTicker={null}
      showStartingPrice={false}
      onSelectStock={vi.fn()}
    />,
  );
}

describe("SectorDisplay", () => {
  it("labels an open sector and shows the stock for the current round", () => {
    renderSectorDisplay();

    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.queryByText(/Spent in/)).not.toBeInTheDocument();
  });

  it("shows which stock is sitting in a locked sector this round", () => {
    renderSectorDisplay({ isLocked: true, spentYear: 2004 });

    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  it("shows the year the locked sector was spent", () => {
    renderSectorDisplay({ isLocked: true, spentYear: 2004 });

    expect(screen.getByText("Spent in 2004")).toBeInTheDocument();
    expect(
      screen.getByText(/You spent Technology in 2004\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Technology sector, spent in 2004/i })).toBeInTheDocument();
  });
});