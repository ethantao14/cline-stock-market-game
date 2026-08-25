import { SECTORS } from "@/data/sectors";

import type { DraftPick, Portfolio, Sector } from "./types";

export const STARTING_BUDGET = 10000;
export const AVAILABLE_SIMULATION_YEARS = [2019, 2020, 2021, 2022] as const;

export type SimulationYear = (typeof AVAILABLE_SIMULATION_YEARS)[number];

export interface DraftState {
  roundIndex: number;
  remainingBudget: number;
  picks: Portfolio;
  isComplete: boolean;
}

export type DraftAction = {
  type: "SELECT_PICK";
  ticker: string;
  year: SimulationYear;
  dollarsAllocated: number;
};

export const initialDraftState: DraftState = {
  roundIndex: 0,
  remainingBudget: STARTING_BUDGET,
  picks: [],
  isComplete: false,
};

export function getCurrentSector(state: DraftState): Sector | null {
  return SECTORS[state.roundIndex] ?? null;
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  if (state.isComplete) {
    return state;
  }

  switch (action.type) {
    case "SELECT_PICK": {
      const sector = getCurrentSector(state);

      if (!sector) {
        return state;
      }

      const amount = action.dollarsAllocated;

      if (!Number.isFinite(amount) || amount <= 0 || amount > state.remainingBudget) {
        return state;
      }

      const pick: DraftPick = {
        sector,
        ticker: action.ticker,
        year: action.year,
        dollarsAllocated: amount,
      };

      const picks = [...state.picks, pick];
      const remainingBudget = state.remainingBudget - amount;
      const roundIndex = state.roundIndex + 1;
      const isComplete = roundIndex >= SECTORS.length || remainingBudget <= 0;

      return { roundIndex, remainingBudget, picks, isComplete };
    }
    default:
      return state;
  }
}
