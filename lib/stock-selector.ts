import type { Stock } from "@/lib/types";

const MAX_OPTIONS = 3;

// Takes an already-fetched candidate list rather than looking sectors/years up
// itself, since this needs to run inside the client-side draft reducer where
// node:fs (lib/available-stocks.ts) can't run.
export function selectStockOptions(candidates: Stock[], randomFn: () => number = Math.random): Stock[] {
  const remaining = [...candidates];
  const optionCount = Math.min(MAX_OPTIONS, remaining.length);
  const selected: Stock[] = [];

  for (let i = 0; i < optionCount; i++) {
    const randomIndex = Math.floor(randomFn() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }

  return selected;
}
