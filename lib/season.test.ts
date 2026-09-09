import { describe, expect, it } from "vitest";

import { SECTORS } from "@/data/sectors";
import type { Sector, Stock } from "@/lib/types";

import { AVAILABLE_SIMULATION_YEARS, type SimulationYear } from "./draft-reducer";
import { buildSeason, drawRoundYears, type AvailableStocksByYearAndSector } from "./season";

function stock(ticker: string, sector: Sector): Stock {
  return { ticker, name: ticker, sector };
}

// Three candidates per sector-year, named so a ticker reveals which index the
// injected randomFn landed on.
function availableStocks(): AvailableStocksByYearAndSector {
  return Object.fromEntries(
    AVAILABLE_SIMULATION_YEARS.map((year) => [
      year,
      Object.fromEntries(
        SECTORS.map((sector) => [
          sector,
          [0, 1, 2].map((index) => stock(`${sector.slice(0, 3).toUpperCase()}${year}-${index}`, sector)),
        ]),
      ),
    ]),
  ) as AvailableStocksByYearAndSector;
}

function sequenceRandomFn(values: number[]): () => number {
  let callIndex = 0;

  return () => {
    const value = values[callIndex % values.length];
    callIndex++;
    return value;
  };
}

describe("buildSeason", () => {
  it("assigns exactly one stock to every sector in every year", () => {
    const season = buildSeason(availableStocks(), sequenceRandomFn([0]));

    expect(season.years).toEqual([...AVAILABLE_SIMULATION_YEARS]);

    for (const year of AVAILABLE_SIMULATION_YEARS) {
      for (const sector of SECTORS) {
        const drawn = season.stockByYearAndSector[year][sector];

        expect(drawn.sector).toBe(sector);
        expect(drawn.ticker).toBe(`${sector.slice(0, 3).toUpperCase()}${year}-0`);
      }
    }
  });

  it("is deterministic for a given randomFn", () => {
    const first = buildSeason(availableStocks(), sequenceRandomFn([0, 0.5, 0.9]));
    const second = buildSeason(availableStocks(), sequenceRandomFn([0, 0.5, 0.9]));

    expect(first).toEqual(second);
  });

  it("can assign the same ticker to a sector in more than one year", () => {
    // One candidate per sector-year, so every year must land on that ticker.
    // Duplicates across years are allowed by design, not filtered out.
    const singleCandidate = Object.fromEntries(
      AVAILABLE_SIMULATION_YEARS.map((year) => [
        year,
        Object.fromEntries(SECTORS.map((sector) => [sector, [stock("ONLY", sector)]])),
      ]),
    ) as AvailableStocksByYearAndSector;

    const season = buildSeason(singleCandidate, sequenceRandomFn([0]));
    const technologyTickers = AVAILABLE_SIMULATION_YEARS.map(
      (year) => season.stockByYearAndSector[year].Technology.ticker,
    );

    expect(technologyTickers).toEqual(AVAILABLE_SIMULATION_YEARS.map(() => "ONLY"));
  });
});

describe("drawRoundYears", () => {
  it("draws one year per sector by default", () => {
    const years = drawRoundYears([...AVAILABLE_SIMULATION_YEARS], undefined, sequenceRandomFn([0]));

    expect(years).toHaveLength(SECTORS.length);
  });

  it("draws with replacement, so a year can repeat across rounds", () => {
    const years: SimulationYear[] = [1996, 1997, 1998, 1999];
    const drawn = drawRoundYears(years, 4, sequenceRandomFn([0, 0, 0.9, 0.9]));

    expect(drawn).toEqual([1996, 1996, 1999, 1999]);
  });
});
