import { SECTORS } from "@/data/sectors";

import type { Season } from "./season";
import type { DraftPick, Portfolio, Sector, Stock } from "./types";

export const AVAILABLE_SIMULATION_YEARS = [2019, 2020, 2021, 2022] as const;

export type SimulationYear = (typeof AVAILABLE_SIMULATION_YEARS)[number];

export interface RoundBoard {
  year: SimulationYear;
  stockBySector: Record<Sector, Stock>;
}

export interface DraftState {
  season: Season | null;
  roundYears: SimulationYear[];
  picks: Portfolio;
  isComplete: boolean;
}

export type DraftAction =
  | {
      type: "START_GAME";
      season: Season;
      roundYears: SimulationYear[];
    }
  | {
      type: "SELECT_PICK";
      sector: Sector;
      ticker: string;
    }
  | {
      type: "RESET_DRAFT";
    };

export const initialDraftState: DraftState = {
  season: null,
  roundYears: [],
  picks: [],
  isComplete: false,
};

// The board is derived rather than stored: round N is always roundYears[N]
// read against the season table, so revisiting a round can never show a
// different stock than the one that was on offer the first time.
export function getCurrentRoundBoard(state: DraftState): RoundBoard | null {
  const year = state.roundYears[state.picks.length];

  if (!state.season || year === undefined) {
    return null;
  }

  return { year, stockBySector: state.season.stockByYearAndSector[year] };
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
    case "START_GAME": {
      // A season is drawn once per playthrough. Re-seeding mid-draft would
      // change stocks the player has already seen, so it is ignored.
      if (state.season) {
        return state;
      }

      return { ...state, season: action.season, roundYears: action.roundYears };
    }
    case "SELECT_PICK": {
      const board = getCurrentRoundBoard(state);

      if (!board || getLockedSectors(state).includes(action.sector)) {
        return state;
      }

      if (board.stockBySector[action.sector]?.ticker !== action.ticker) {
        return state;
      }

      const pick: DraftPick = {
        sector: action.sector,
        ticker: action.ticker,
        year: board.year,
      };

      const picks = [...state.picks, pick];

      return {
        ...state,
        picks,
        isComplete: picks.length >= SECTORS.length,
      };
    }
    default:
      return state;
  }
}
