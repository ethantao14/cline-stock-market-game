import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

import {
  draftReducer,
  getCurrentRoundBoard,
  getLockedSectors,
  getRemainingPicks,
  initialDraftState,
  type DraftState,
  type RoundBoard,
} from "./draft-reducer";

function stock(ticker: string): Stock {
  return { ticker, name: ticker, sector: SECTORS[0] };
}

function boardFor(sector: Sector, tickers: string[], year: RoundBoard["year"] = 2019): RoundBoard {
  return {
    year,
    optionsBySector: { [sector]: tickers.map(stock) } as Record<Sector, Stock[]>,
  };
}

function startRound(state: DraftState, board: RoundBoard): DraftState {
  return draftReducer(state, { type: "START_ROUND", year: board.year, optionsBySector: board.optionsBySector });
}

describe("draftReducer", () => {
  it("starts with no rounds started and no picks", () => {
    expect(initialDraftState).toEqual({
      roundHistory: [],
      picks: [],
      isComplete: false,
    });
  });

  it("START_ROUND adds a board that SELECT_PICK can then be validated against", () => {
    const board = boardFor(SECTORS[0], ["AAPL", "MSFT"]);
    const next = startRound(initialDraftState, board);

    expect(next.roundHistory).toEqual([board]);
    expect(getCurrentRoundBoard(next)).toEqual(board);
  });

  it("ignores a second START_ROUND while one is already awaiting a pick", () => {
    const board = boardFor(SECTORS[0], ["AAPL"]);
    const started = startRound(initialDraftState, board);
    const next = startRound(started, boardFor(SECTORS[1], ["MSFT"]));

    expect(next).toEqual(started);
  });

  it("records a valid pick and clears the board for the next round", () => {
    const board = boardFor(SECTORS[0], ["AAPL", "MSFT"]);
    const started = startRound(initialDraftState, board);

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "AAPL",
    });

    expect(next.picks).toEqual([{ sector: SECTORS[0], ticker: "AAPL", year: board.year }]);
    expect(next.isComplete).toBe(false);
    expect(getCurrentRoundBoard(next)).toBeNull();
  });

  it("rejects a pick when no round has been started yet", () => {
    const next = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "AAPL",
    });

    expect(next).toEqual(initialDraftState);
  });

  it("rejects a pick for a ticker that isn't on that sector's board", () => {
    const started = startRound(initialDraftState, boardFor(SECTORS[0], ["AAPL", "MSFT"]));

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "NVDA",
    });

    expect(next).toEqual(started);
  });

  it("rejects a pick for an already-locked sector", () => {
    const firstBoard = boardFor(SECTORS[0], ["AAPL"]);
    const afterFirstPick = draftReducer(startRound(initialDraftState, firstBoard), {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "AAPL",
    });

    const secondBoard: RoundBoard = {
      year: 2020,
      optionsBySector: {
        [SECTORS[0]]: [stock("GOOGL")],
        [SECTORS[1]]: [stock("MSFT")],
      } as Record<Sector, Stock[]>,
    };
    const started = startRound(afterFirstPick, secondBoard);

    const next = draftReducer(started, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "GOOGL",
    });

    expect(next).toEqual(started);
    expect(getLockedSectors(started)).toEqual([SECTORS[0]]);
  });

  it("completes the draft after all 8 rounds", () => {
    let state: DraftState = initialDraftState;

    for (let i = 0; i < SECTORS.length; i += 1) {
      const sector = SECTORS[i];
      const ticker = `TICKER${i}`;

      state = startRound(state, boardFor(sector, [ticker], 2019));
      state = draftReducer(state, {
        type: "SELECT_PICK",
        sector,
        ticker,
      });
    }

    expect(state.isComplete).toBe(true);
    expect(state.picks).toHaveLength(SECTORS.length);
  });

  it("ignores further actions once the draft is complete", () => {
    const completedState: DraftState = {
      roundHistory: [],
      picks: [],
      isComplete: true,
    };

    const next = draftReducer(completedState, {
      type: "SELECT_PICK",
      sector: SECTORS[0],
      ticker: "AAPL",
    });

    expect(next).toBe(completedState);
  });

  it("resets an in-progress draft back to the initial state", () => {
    const inProgressState: DraftState = {
      roundHistory: [boardFor(SECTORS[0], ["AAPL"]), boardFor(SECTORS[1], ["MSFT"])],
      picks: [
        { sector: SECTORS[0], ticker: "AAPL", year: 2019 },
        { sector: SECTORS[1], ticker: "MSFT", year: 2020 },
      ],
      isComplete: false,
    };

    const next = draftReducer(inProgressState, { type: "RESET_DRAFT" });

    expect(next).toEqual(initialDraftState);
  });

  it("getCurrentRoundBoard returns null once every round has a matching pick", () => {
    const finishedRoundsState: DraftState = {
      ...initialDraftState,
      roundHistory: [boardFor(SECTORS[0], ["AAPL"])],
      picks: [{ sector: SECTORS[0], ticker: "AAPL", year: 2019 }],
    };

    expect(getCurrentRoundBoard(finishedRoundsState)).toBeNull();
  });

  it("getRemainingPicks counts down from the sector count as picks are made", () => {
    const twoPicksIn: DraftState = {
      ...initialDraftState,
      picks: [
        { sector: SECTORS[0], ticker: "AAPL", year: 2019 },
        { sector: SECTORS[1], ticker: "MSFT", year: 2020 },
      ],
    };

    expect(getRemainingPicks(initialDraftState)).toBe(SECTORS.length);
    expect(getRemainingPicks(twoPicksIn)).toBe(SECTORS.length - 2);
  });
});
