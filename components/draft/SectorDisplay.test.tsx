import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HISTORICAL_DATA } from "@/data/historical-index";
import type { SimulationYear } from "@/lib/draft-reducer";

import { SectorDisplay } from "./SectorDisplay";

const stock = { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" as const };

afterEach(() => {
  cleanup();
});

function renderSectorDisplay({
  isLocked = false,
  currentYear = 2005,
  spentYear,
  showStartingPrice = false,
}: {
  isLocked?: boolean;
  currentYear?: SimulationYear;
  spentYear?: SimulationYear;
  showStartingPrice?: boolean;
} = {}) {
  return render(
    <SectorDisplay
      sector="Technology"
      stock={stock}
      isLocked={isLocked}
      currentYear={currentYear}
      spentYear={spentYear}
      selectedTicker={null}
      showStartingPrice={showStartingPrice}
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

  it("shows the January historical price for the drafted year in informed mode", () => {
    const january2005Price = HISTORICAL_DATA.AAPL.find((entry) => entry.date.startsWith("2005-01-"))?.close;

    expect(january2005Price).toBeDefined();

    renderSectorDisplay({ isLocked: true, spentYear: 2005, showStartingPrice: true });

    expect(screen.getByText(new RegExp(`\\$${Number(january2005Price?.toFixed(2)).toString().replace('.', '\\.')} as of Jan 2005`))).toBeInTheDocument();
  });

  it("shows the current round year's January historical price for an open sector in informed mode", () => {
    const january1996Price = HISTORICAL_DATA.AAPL.find((entry) => entry.date.startsWith("1996-01-"))?.close;

    expect(january1996Price).toBeDefined();

    renderSectorDisplay({ currentYear: 1996, showStartingPrice: true });

    expect(screen.getByText(new RegExp(`\\$${Number(january1996Price?.toFixed(2)).toString().replace('.', '\\.')} as of Jan 1996`))).toBeInTheDocument();
  });
});