import { SECTORS } from "@/data/sectors";

import { getMaxAllocation, MIN_ALLOCATION } from "./budget-validator";
import type { DraftPick, Portfolio, Sector, Stock } from "./types";

export const STARTING_BUDGET = 10000;
export const AVAILABLE_SIMULATION_YEARS = [2019, 2020, 2021, 2022] as const;

export type SimulationYear = (typeof AVAILABLE_SIMULATION_YEARS)[number];

export interface RoundBoard {
  year: SimulationYear;
  optionsBySector: Record<Sector, Stock[]>;
}

export interface DraftState {
  roundHistory: RoundBoard[];
  remainingBudget: number;
  picks: Portfolio;
  isComplete: boolean;
}

export type DraftAction =
  | {
      type: "START_ROUND";
      year: SimulationYear;
      optionsBySector: Record<Sector, Stock[]>;
    }
  | {
      type: "SELECT_PICK";
      sector: Sector;
      ticker: string;
      dollarsAllocated: number;
    }
  | {
      type: "RESET_DRAFT";
    };

export const initialDraftState: DraftState = {
  roundHistory: [],
  remainingBudget: STARTING_BUDGET,
  picks: [],
  isComplete: false,
};

// picks[i] was drafted from roundHistory[i]'s board, so the board without a
// matching pick yet (if any) is always the one currently on offer.
export function getCurrentRoundBoard(state: DraftState): RoundBoard | null {
  return state.roundHistory[state.picks.length] ?? null;
}

export function getLockedSectors(state: DraftState): Sector[] {
  return state.picks.map((pick) => pick.sector);
}

export function getRemainingPicks(state: DraftState): number {
  return SECTORS.length - state.picks.length;
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  if (action.type === "RESET_DRAFT") {
    return initialDraftState;
  }

  if (state.isComplete) {
    return state;
  }

  switch (action.type) {
    case "START_ROUND": {
      // Only one board can be awaiting a pick at a time.
      if (state.roundHistory.length > state.picks.length) {
        return state;
      }

      const board: RoundBoard = { year: action.year, optionsBySector: action.optionsBySector };

      return { ...state, roundHistory: [...state.roundHistory, board] };
    }
    case "SELECT_PICK": {
      const board = getCurrentRoundBoard(state);

      if (!board || getLockedSectors(state).includes(action.sector)) {
        return state;
      }

      const sectorOptions = board.optionsBySector[action.sector] ?? [];

      if (!sectorOptions.some((stock) => stock.ticker === action.ticker)) {
        return state;
      }

      const amount = action.dollarsAllocated;
      const maxAllocation = getMaxAllocation(state.remainingBudget, getRemainingPicks(state));

      if (!Number.isFinite(amount) || amount < MIN_ALLOCATION || amount > maxAllocation) {
        return state;
      }

      const pick: DraftPick = {
        sector: action.sector,
        ticker: action.ticker,
        year: board.year,
        dollarsAllocated: amount,
      };

      const picks = [...state.picks, pick];

      return {
        ...state,
        picks,
        remainingBudget: state.remainingBudget - amount,
        isComplete: picks.length >= SECTORS.length,
      };
    }
    default:
      return state;
  }
}
