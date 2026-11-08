// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SECTORS, STOCKS_BY_SECTOR } from "@/data/sectors";
import {
  AVAILABLE_SIMULATION_YEARS,
  draftReducer,
  initialDraftState,
} from "@/lib/draft-reducer";
import {
  DRAFT_SESSION_STORAGE_KEY,
  DRAFT_SESSION_VERSION,
  type DraftSession,
} from "@/lib/draft-session";
import { buildSeason, drawRoundYears, type AvailableStocksByYearAndSector } from "@/lib/season";

import ResultsPage from "./page";

function makeCompletedSession(): DraftSession {
  const availableStocks = Object.fromEntries(
    AVAILABLE_SIMULATION_YEARS.map((year) => [
      year,
      Object.fromEntries(SECTORS.map((sector) => [sector, [STOCKS_BY_SECTOR[sector][0]]])),
    ]),
  ) as AvailableStocksByYearAndSector;
  const season = buildSeason(availableStocks, () => 0);
  const roundYears = drawRoundYears(season.years, 8, () => 0.5);
  let state = draftReducer(initialDraftState, { type: "START_GAME", season, roundYears });

  for (const sector of SECTORS) {
    const year = roundYears[state.picks.length];
    state = draftReducer(state, {
      type: "SELECT_PICK",
      sector,
      ticker: season.stockByYearAndSector[year][sector].ticker,
    });
  }

  return { version: DRAFT_SESSION_VERSION, season, roundYears, picks: state.picks };
}

describe("ResultsPage saved draft completion", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  function renderSession(pickCount: number) {
    const session = makeCompletedSession();
    session.picks = session.picks.slice(0, pickCount);
    window.localStorage.setItem(DRAFT_SESSION_STORAGE_KEY, JSON.stringify(session));
    render(<ResultsPage />);
  }

  it.each([3, 7])("shows unfinished draft for %i of 8 picks", async (pickCount) => {
    renderSession(pickCount);

    expect(await screen.findByRole("heading", { name: "Draft not finished" })).toBeInTheDocument();
    expect(await screen.findByText(new RegExp(`You made ${pickCount} of 8 picks`))).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Start a new draft" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { name: "Your Portfolio Results" })).not.toBeInTheDocument();
  });

  it("shows results for 8 of 8 picks", async () => {
    renderSession(8);

    expect(await screen.findByRole("heading", { name: "Your Portfolio Results" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Draft not finished" })).not.toBeInTheDocument();
  });

  it("shows no portfolio for 0 of 8 picks", async () => {
    renderSession(0);

    expect(await screen.findByText("No portfolio found")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your Portfolio Results" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Draft not finished" })).not.toBeInTheDocument();
  });
});
