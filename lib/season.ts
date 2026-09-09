import { SECTORS } from "@/data/sectors";

import { AVAILABLE_SIMULATION_YEARS, type SimulationYear } from "./draft-reducer";
import type { Sector, Stock } from "./types";

export type AvailableStocksByYearAndSector = Record<SimulationYear, Record<Sector, Stock[]>>;

export interface Season {
  years: SimulationYear[];
  stockByYearAndSector: Record<SimulationYear, Record<Sector, Stock>>;
}

function pickOne<T>(candidates: T[], randomFn: () => number): T {
  return candidates[Math.floor(randomFn() * candidates.length)];
}

// Draws the whole season up front: one stock per sector per year, fixed for
// the rest of the playthrough. Draws are independent, so the same ticker
// standing in for a sector in several years is expected, not a bug.
export function buildSeason(
  availableStocksByYearAndSector: AvailableStocksByYearAndSector,
  randomFn: () => number = Math.random,
): Season {
  const stockByYearAndSector = Object.fromEntries(
    AVAILABLE_SIMULATION_YEARS.map((year) => [
      year,
      Object.fromEntries(
        SECTORS.map((sector) => [sector, pickOne(availableStocksByYearAndSector[year][sector], randomFn)]),
      ),
    ]),
  ) as Season["stockByYearAndSector"];

  return { years: [...AVAILABLE_SIMULATION_YEARS], stockByYearAndSector };
}

// Years are drawn with replacement, so a year can come up twice in one game.
// A repeated year shows the same board minus whatever sectors are spent by
// then, which is the intended behavior rather than an oversight.
export function drawRoundYears(
  years: SimulationYear[],
  roundCount: number = SECTORS.length,
  randomFn: () => number = Math.random,
): SimulationYear[] {
  return Array.from({ length: roundCount }, () => pickOne(years, randomFn));
}
