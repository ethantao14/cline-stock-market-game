import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

import {
  AVAILABLE_SIMULATION_YEARS,
  draftReducer,
  getCurrentRoundBoard,
  getLockedSectors,
  getRemainingPicks,
  initialDraftState,
  type DraftState,
  type SimulationYear,
} from "./draft-reducer";
import type { Season } from "./season";

// Every sector's stock in year Y is "<SECTOR-INITIALS><Y>", so a test can name
// the exact ticker a given round and sector is offering without a lookup.
function tickerFor(sector: Sector, year: SimulationYear): string {
  const initials = sector
    .split(" ")
    .map((word) => word[0])
    .join("");

  return `${initials}${year}`;
}

function stock(sector: Sector, year: SimulationYear): Stock {
  const ticker = tickerFor(sector, year);
  return { ticker, name: ticker, sector };
}

function seasonFixture(): Season {
  return {
    years: [...AVAILABLE_SIMULATION_YEARS],
    stockByYearAndSector: Object.fromEntries(
      AVAILABLE_SIMULATION_YEARS.map((year) => [
        year,
        Object.fromEntries(SECTORS.map((sector) => [sector, stock(sector, year)])),
      ]),
    ) as Season["stockByYearAndSector"],
  };
}

function startGame(roundYears: SimulationYear[]): DraftState {
  return draftReducer(initialDraftState, {
    type: "START_GAME",
    season: seasonFixture(),
    roundYears,
  });
}

const EIGHT_ROUNDS: SimulationYear[] = [1996, 1997, 1998, 1999, 1996, 1997, 1998, 1999];

describe("draftReducer", () => {
  it("starts with no season, no round years, and no picks", () => {
    expect(initialDraftState).toEqual({
      season: null,
      roundYears: [],
      picks: [],
      isComplete: false,
    });
  });

  it("START_GAME seeds the season and exposes the first round's board", () => {
    const next = startGame(EIGHT_ROUNDS);

    expect(next.roundYears).toEqual(EIGHT_ROUNDS);
    expect(getCurrentRoundBoard(next)).toEqual({
      year: 1996,
      stockBySector: seasonFixture().stockByYearAndSector[1996],
    });
  });

  it("ignores a second START_GAME so a drawn season can't change mid-draft", () => {
    const started = startGame(EIGHT_ROUNDS);
    const next = draftReducer(started, {
      type: "START_GAME",
      season: seasonFixture(),
      roundYears: [1999, 1999, 1999, 1999, 1999, 1999, 1999, 1999],
    });

    expect(next).toEqual(started);
  });

  it("returns no board before the game has started", () => {
    expect(getCurrentRoundBoard(initialDraftState)).toBeNull();
  });

  it("records a pick against the current round's year and advances the board", () => {
    const started = startGame(EIGHT_ROUNDS);

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    expect(next.picks).toEqual([{ sector: SECTORS[0], ticker: tickerFor(SECTORS[0], 1996), year: 1996 }]);
    expect(getCurrentRoundBoard(next)?.year).toBe(1997);
  });

  it("rejects a pick whose ticker isn't the one that sector is offering this round", () => {
    const started = startGame(EIGHT_ROUNDS);

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1999),
    });

    expect(next).toEqual(started);
  });

  it("rejects a pick for an already-spent sector", () => {
    const started = startGame(EIGHT_ROUNDS);
    const afterFirstPick = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    const next = draftReducer(afterFirstPick, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1997),
    });

    expect(next).toEqual(afterFirstPick);
    expect(getLockedSectors(next)).toEqual([SECTORS[0]]);
  });

  it("serves the same board again when a year repeats, minus the spent sectors", () => {
    const repeatedYears: SimulationYear[] = [1996, 1996, 1997, 1998, 1999, 1996, 1997, 1998];
    const started = startGame(repeatedYears);

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    const secondBoard = getCurrentRoundBoard(next);

    expect(secondBoard?.year).toBe(1996);
    expect(secondBoard?.stockBySector).toEqual(getCurrentRoundBoard(started)?.stockBySector);
    expect(getLockedSectors(next)).toEqual([SECTORS[0]]);
  });

  it("completes the draft after all 8 sectors are spent", () => {
    let state = startGame(EIGHT_ROUNDS);

    SECTORS.forEach((sector, roundIndex) => {
      state = draftReducer(state, {
        type: "SELECT_PICK",
        sector,
        ticker: tickerFor(sector, EIGHT_ROUNDS[roundIndex]),
      });
    });

    expect(state.isComplete).toBe(true);
    expect(state.picks).toHaveLength(SECTORS.length);
    expect(getCurrentRoundBoard(state)).toBeNull();
  });

  it("ignores further actions once the draft is complete", () => {
    let state = startGame(EIGHT_ROUNDS);

    SECTORS.forEach((sector, roundIndex) => {
      state = draftReducer(state, {
        type: "SELECT_PICK",
        sector,
        ticker: tickerFor(sector, EIGHT_ROUNDS[roundIndex]),
      });
    });

    const next = draftReducer(state, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    expect(next).toEqual(state);
  });

  it("resets an in-progress draft back to the initial state", () => {
    const started = startGame(EIGHT_ROUNDS);
    const afterPick = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    expect(draftReducer(afterPick, { type: "RESET_DRAFT" })).toEqual(initialDraftState);
  });

  it("getRemainingPicks counts down from the sector count as picks are made", () => {
    const started = startGame(EIGHT_ROUNDS);
    const afterPick = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: tickerFor(SECTORS[0], 1996),
    });

    expect(getRemainingPicks(started)).toBe(SECTORS.length);
    expect(getRemainingPicks(afterPick)).toBe(SECTORS.length - 1);
  });
});
