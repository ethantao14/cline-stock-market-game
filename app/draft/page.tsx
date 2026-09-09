import type { Metadata } from "next";

import { DraftPageClient } from "./DraftPageClient";

import { SECTORS } from "@/data/sectors";
import { getAvailableStocks } from "@/lib/available-stocks";
import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";
import type { AvailableStocksByYearAndSector } from "@/lib/season";

export const metadata: Metadata = {
  title: "Draft",
};

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