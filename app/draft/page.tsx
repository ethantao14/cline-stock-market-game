import { DraftPageClient } from "./DraftPageClient";

import { SECTORS } from "@/data/sectors";
import { getAvailableStocks } from "@/lib/available-stocks";
import { AVAILABLE_SIMULATION_YEARS, type SimulationYear } from "@/lib/draft-reducer";
import type { Sector, Stock } from "@/lib/types";

type AvailableStocksByYearAndSector = Record<SimulationYear, Record<Sector, Stock[]>>;

function getAvailableStocksByYearAndSector(): AvailableStocksByYearAndSector {
  return Object.fromEntries(
    AVAILABLE_SIMULATION_YEARS.map((year) => [
      year,
      Object.fromEntries(SECTORS.map((sector) => [sector, getAvailableStocks(sector, year)])),
    ]),
  ) as AvailableStocksByYearAndSector;
}

export default function DraftPage() {
  const availableStocksByYearAndSector = getAvailableStocksByYearAndSector();

  return <DraftPageClient availableStocksByYearAndSector={availableStocksByYearAndSector} />;
}