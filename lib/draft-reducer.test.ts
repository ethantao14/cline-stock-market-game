import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";

import {
  draftReducer,
  getCurrentSector,
  initialDraftState,
  STARTING_BUDGET,
} from "./draft-reducer";
import type { DraftState } from "./draft-reducer";

describe("draftReducer", () => {
  it("starts with round 0, full budget, and no picks", () => {
    expect(initialDraftState).toEqual({
      roundIndex: 0,
      remainingBudget: STARTING_BUDGET,
      picks: [],
      isComplete: false,
    });
  });

  it("records a valid pick and advances to the next round", () => {
    const next = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2019,
      dollarsAllocated: 1000,
    });

    expect(next.roundIndex).toBe(1);
    expect(next.remainingBudget).toBe(STARTING_BUDGET - 1000);
    expect(next.picks).toEqual([
      { sector: SECTORS[0], ticker: "AAPL", year: 2019, dollarsAllocated: 1000 },
    ]);
    expect(next.isComplete).toBe(false);
  });

  it("rejects a pick that exceeds the remaining budget", () => {
    const next = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2020,
      dollarsAllocated: STARTING_BUDGET + 1,
    });

    expect(next).toEqual(initialDraftState);
  });

  it("rejects a zero or negative allocation", () => {
    const zero = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2021,
      dollarsAllocated: 0,
    });
    const negative = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2022,
      dollarsAllocated: -100,
    });

    expect(zero).toEqual(initialDraftState);
    expect(negative).toEqual(initialDraftState);
  });

  it("ends the draft early once the budget hits zero", () => {
    const next = draftReducer(initialDraftState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2020,
      dollarsAllocated: STARTING_BUDGET,
    });

    expect(next.remainingBudget).toBe(0);
    expect(next.isComplete).toBe(true);
    expect(next.roundIndex).toBe(1);
  });

  it("completes the draft after all 8 rounds without spending everything", () => {
    let state: DraftState = initialDraftState;

    for (let i = 0; i < SECTORS.length; i += 1) {
      state = draftReducer(state, {
        type: "SELECT_PICK",
        ticker: `TICKER${i}`,
        year: (2019 + (i % 4)) as 2019 | 2020 | 2021 | 2022,
        dollarsAllocated: 100,
      });
    }

    expect(state.isComplete).toBe(true);
    expect(state.picks).toHaveLength(SECTORS.length);
    expect(state.picks.every((pick) => pick.year >= 2019 && pick.year <= 2022)).toBe(true);
    expect(state.remainingBudget).toBe(STARTING_BUDGET - 100 * SECTORS.length);
  });

  it("ignores further picks once the draft is complete", () => {
    const completedState: DraftState = {
      roundIndex: SECTORS.length,
      remainingBudget: 500,
      picks: [],
      isComplete: true,
    };

    const next = draftReducer(completedState, {
      type: "SELECT_PICK",
      ticker: "AAPL",
      year: 2019,
      dollarsAllocated: 100,
    });

    expect(next).toBe(completedState);
  });

  it("getCurrentSector returns null once rounds run out", () => {
    const finalRoundState: DraftState = {
      ...initialDraftState,
      roundIndex: SECTORS.length,
    };

    expect(getCurrentSector(finalRoundState)).toBeNull();
  });
});
