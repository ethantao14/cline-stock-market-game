import { SECTORS } from "@/data/sectors";

import { getPositionResult } from "./simulate-core";
import type { HistoricalDataByTicker, PositionResult } from "./simulate-core";
import type { Season } from "./season";
import type { DraftPick, Sector, Stock } from "./types";

export type SectorCellState = "taken" | "spent" | "open";

export interface SectorCell {
  sector: Sector;
  stock: Stock;
  result: PositionResult;
  state: SectorCellState;
}

export interface RoundBreakdown {
  roundIndex: number;
  year: DraftPick["year"];
  cells: SectorCell[];
}

export interface MissedOpportunity {
  roundIndex: number;
  year: DraftPick["year"];
  sector: Sector;
  ticker: string;
  returnPercent: number;
}

export interface OptimalAssignment {
  totalReturnPercent: number;
  assignment: Sector[];
}

export interface MissedOpportunityAnalysis {
  rounds: RoundBreakdown[];
  bestMissed: MissedOpportunity | null;
  optimal: OptimalAssignment;
}

function scorePermutation(
  matrix: PositionResult[][],
  permutation: number[],
): number {
  let sum = 0;
  let count = 0;

  // Bounded by the matrix, not the permutation: a stored session with fewer
  // round years than sectors would otherwise index past the last row.
  for (let roundIndex = 0; roundIndex < matrix.length; roundIndex += 1) {
    const sectorIndex = permutation[roundIndex];
    const cell = matrix[roundIndex][sectorIndex];

    if (cell.hasData) {
      sum += cell.positionReturnPercent;
      count += 1;
    }
  }

  if (count === 0) {
    return 0;
  }

  return Math.round((sum / count) * 100) / 100;
}

function* generatePermutations(length: number): Generator<number[]> {
  const indices = Array.from({ length: length }, (_, i) => i);
  const c = new Array(length).fill(0);

  yield [...indices];

  let i = 0;
  while (i < length) {
    if (c[i] < i) {
      if (i % 2 === 0) {
        [indices[0], indices[i]] = [indices[i], indices[0]];
      } else {
        [indices[c[i]], indices[i]] = [indices[i], indices[c[i]]];
      }
      yield [...indices];
      c[i] += 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

// Brute forces all 40,320 permutations of 8 sectors over 8 rounds. At that size
// brute force runs instantly and reads far better than implementing Hungarian,
// so we do that.
function findOptimalAssignment(matrix: PositionResult[][]): OptimalAssignment {
  const roundCount = matrix.length;
  const sectorCount = SECTORS.length;

  let bestTotal = -Infinity;
  let bestAssignment: Sector[] = [];

  for (const permutation of generatePermutations(sectorCount)) {
    const total = scorePermutation(matrix, permutation);

    if (total > bestTotal) {
      bestTotal = total;
      bestAssignment = permutation.slice(0, roundCount).map((sectorIndex) => SECTORS[sectorIndex]);
    }
  }

  return {
    totalReturnPercent: bestTotal === -Infinity ? 0 : bestTotal,
    assignment: bestAssignment,
  };
}

export function analyzeMissedOpportunities(
  season: Season,
  roundYears: DraftPick["year"][],
  picks: DraftPick[],
  historicalDataByTicker: HistoricalDataByTicker,
): MissedOpportunityAnalysis {
  const roundCount = roundYears.length;

  // Precompute the 8 by 8 result matrix: one row per round, one column per
  // sector. Each cell is the result of the stock the season assigns to that
  // round's year and that sector.
  const matrix: PositionResult[][] = roundYears.map((year) =>
    SECTORS.map((sector) => {
      const stock = season.stockByYearAndSector[year]?.[sector];

      if (!stock) {
        return {
          sector,
          ticker: "",
          year,
          positionReturnPercent: 0,
          hasData: false,
        };
      }

      const pick: DraftPick = { sector, ticker: stock.ticker, year };
      return getPositionResult(pick, historicalDataByTicker);
    }),
  );

  // Build the per round breakdown, labeling each sector cell by its state at
  // that moment in the draft.
  const rounds: RoundBreakdown[] = roundYears.map((year, roundIndex) => {
    const pickedSector = picks[roundIndex]?.sector;
    const spentSectors = new Set(
      picks.slice(0, roundIndex).map((pick) => pick.sector),
    );

    const cells: SectorCell[] = SECTORS.map((sector, sectorIndex) => {
      const stock = season.stockByYearAndSector[year]?.[sector];
      const result = matrix[roundIndex][sectorIndex];

      let state: SectorCellState;
      if (sector === pickedSector) {
        state = "taken";
      } else if (spentSectors.has(sector)) {
        state = "spent";
      } else {
        state = "open";
      }

      return {
        sector,
        stock: stock ?? { ticker: "", name: "", sector },
        result,
        state,
      };
    });

    return { roundIndex, year, cells };
  });

  // Find the single best return the player saw and did not take, across every
  // round and sector. Only consider cells the player did not pick.
  let bestMissed: MissedOpportunity | null = null;

  // Round years are drawn with replacement, so the same board can come up in
  // several rounds. A cell whose sector and year the player did take is the
  // identical stock at the identical return, which is not a miss.
  const takenYearBySector = new Map<Sector, DraftPick["year"]>(
    picks.map((pick) => [pick.sector, pick.year]),
  );

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    for (let sectorIndex = 0; sectorIndex < SECTORS.length; sectorIndex += 1) {
      const sector = SECTORS[sectorIndex];

      if (takenYearBySector.get(sector) === roundYears[roundIndex]) {
        continue;
      }

      const cell = matrix[roundIndex][sectorIndex];

      if (!cell.hasData) {
        continue;
      }

      if (!bestMissed || cell.positionReturnPercent > bestMissed.returnPercent) {
        bestMissed = {
          roundIndex,
          year: roundYears[roundIndex],
          sector,
          ticker: cell.ticker,
          returnPercent: cell.positionReturnPercent,
        };
      }
    }
  }

  const optimal = findOptimalAssignment(matrix);

  return { rounds, bestMissed, optimal };
}
