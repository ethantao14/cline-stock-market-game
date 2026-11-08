import "@testing-library/jest-dom/vitest";
import { act, within } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SECTORS, STOCKS_BY_SECTOR } from "@/data/sectors";
import {
  AVAILABLE_SIMULATION_YEARS,
  draftReducer,
  initialDraftState,
} from "@/lib/draft-reducer";
import {
  DRAFT_SESSION_STORAGE_KEY,
  DRAFT_SESSION_VERSION,
  parseDraftSession,
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

describe("ResultsPage hydration", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    root = undefined;
    container.remove();
    window.localStorage.clear();
  });

  it("hydrates without recoverable errors and shows results for a saved eight-pick session", async () => {
    // jsdom has a window even during renderToString. Keep storage empty here
    // so the prerender cannot see the browser's saved session.
    container.innerHTML = renderToString(<ResultsPage />);

    const session = makeCompletedSession();
    expect(session.picks).toHaveLength(8);
    const serializedSession = JSON.stringify(session);
    expect(parseDraftSession(serializedSession)).toEqual(session);
    window.localStorage.setItem(DRAFT_SESSION_STORAGE_KEY, serializedSession);
    const onRecoverableError = vi.fn();

    await act(async () => {
      root = hydrateRoot(container, <ResultsPage />, { onRecoverableError });
    });

    expect(within(container).getByRole("heading", { name: "Your Portfolio Results" })).toBeInTheDocument();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("hydrates without recoverable errors and shows the empty state after mount with no session", async () => {
    container.innerHTML = renderToString(<ResultsPage />);
    const onRecoverableError = vi.fn();

    await act(async () => {
      root = hydrateRoot(container, <ResultsPage />, { onRecoverableError });
    });

    expect(within(container).getByText("No portfolio found")).toBeInTheDocument();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("prerenders a neutral loading state instead of the empty portfolio state", () => {
    const html = renderToString(<ResultsPage />);

    expect(html).toContain("Loading your results");
    expect(html).not.toContain("No portfolio found");
  });
});
