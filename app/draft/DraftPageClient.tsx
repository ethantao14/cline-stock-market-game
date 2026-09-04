"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AllocationInput } from "@/components/draft/AllocationInput";
import { BudgetMeter } from "@/components/draft/BudgetMeter";
import { PortfolioSummarySidebar } from "@/components/draft/PortfolioSummarySidebar";
import { SectorDisplay } from "@/components/draft/SectorDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/data/sectors";
import { getMaxAllocation, MIN_ALLOCATION } from "@/lib/budget-validator";
import { DraftProvider, useDraft } from "@/lib/draft-context";
import {
  getCurrentRoundBoard,
  getLockedSectors,
  getRemainingPicks,
  type SimulationYear,
} from "@/lib/draft-reducer";
import { selectStockOptions } from "@/lib/stock-selector";
import { cn } from "@/lib/utils";
import type { Sector, Stock } from "@/lib/types";

type AvailableStocksByYearAndSector = Record<SimulationYear, Record<Sector, Stock[]>>;

const YEAR_BADGE_STYLES: Record<SimulationYear, string> = {
  2019: "border-violet-200 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-white text-violet-700 dark:border-violet-500/30 dark:to-slate-900 dark:text-violet-300",
  2020: "border-sky-200 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-white text-sky-700 dark:border-sky-500/30 dark:to-slate-900 dark:text-sky-300",
  2021: "border-emerald-200 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-white text-emerald-700 dark:border-emerald-500/30 dark:to-slate-900 dark:text-emerald-300",
  2022: "border-amber-200 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-white text-amber-700 dark:border-amber-500/30 dark:to-slate-900 dark:text-amber-300",
};

function getRandomSimulationYear(): SimulationYear {
  return (Math.floor(Math.random() * 4) + 2019) as SimulationYear;
}

function DraftBoard({
  availableStocksByYearAndSector,
  showStartingPrice,
}: {
  availableStocksByYearAndSector: AvailableStocksByYearAndSector;
  showStartingPrice: boolean;
}) {
  const router = useRouter();
  const { state, dispatch } = useDraft();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [allocationInput, setAllocationInput] = useState("");

  const currentRound = getCurrentRoundBoard(state);
  const lockedSectors = useMemo(() => getLockedSectors(state), [state]);
  const remainingPicks = getRemainingPicks(state);
  const maxAllocation = getMaxAllocation(state.remainingBudget, remainingPicks);
  const availableUnlockedSectors = useMemo(
    () => SECTORS.filter((sector) => !lockedSectors.includes(sector)),
    [lockedSectors],
  );
  const resolvedSelectedSector =
    selectedSector && availableUnlockedSectors.includes(selectedSector)
      ? selectedSector
      : null;
  const resolvedSelectedTicker =
    resolvedSelectedSector && currentRound
      ? (selectedSector === resolvedSelectedSector &&
        selectedTicker &&
        currentRound.optionsBySector[resolvedSelectedSector]?.some((stock) => stock.ticker === selectedTicker)
          ? selectedTicker
          : null)
      : null;
  const parsedAllocation = Number(allocationInput);
  const isAllocationValid =
    allocationInput.trim() !== "" &&
    Number.isFinite(parsedAllocation) &&
    parsedAllocation >= MIN_ALLOCATION &&
    parsedAllocation <= maxAllocation;

  useEffect(() => {
    if (state.isComplete) {
      const timeout = window.setTimeout(() => {
        router.push("/results");
      }, 600);

      return () => window.clearTimeout(timeout);
    }
  }, [router, state.isComplete]);

  useEffect(() => {
    if (state.isComplete || currentRound) {
      return;
    }

    const year = getRandomSimulationYear();
    const optionsBySector = Object.fromEntries(
      SECTORS.map((sector) => [sector, selectStockOptions(availableStocksByYearAndSector[year][sector])]),
    ) as Record<Sector, Stock[]>;

    dispatch({ type: "START_ROUND", year, optionsBySector });
  }, [availableStocksByYearAndSector, currentRound, dispatch, state.isComplete]);

  function handleResetDraft() {
    dispatch({ type: "RESET_DRAFT" });
    setSelectedSector(null);
    setSelectedTicker(null);
    setAllocationInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectStock(sector: Sector, ticker: string) {
    if (lockedSectors.includes(sector)) {
      return;
    }

    setSelectedSector(sector);
    setSelectedTicker(ticker);
  }

  function handleFocusSector(sector: Sector) {
    if (lockedSectors.includes(sector)) {
      return;
    }

    setSelectedSector(sector);
  }

  function handleConfirmPick() {
    if (!currentRound || !resolvedSelectedSector || !resolvedSelectedTicker || !isAllocationValid) {
      return;
    }

    dispatch({
      type: "SELECT_PICK",
      sector: resolvedSelectedSector,
      ticker: resolvedSelectedTicker,
      dollarsAllocated: parsedAllocation,
    });
    setSelectedSector(null);
    setSelectedTicker(null);
    setAllocationInput("");
  }

  if (state.isComplete) {
    return (
      <Card className="border-white/70 bg-white/85 text-center dark:border-slate-800 dark:bg-slate-900/85">
        <CardHeader>
          <CardTitle>Draft complete</CardTitle>
          <CardDescription>Taking you to your results...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!currentRound) {
    return (
      <Card className="border-white/70 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85">
        <CardHeader>
          <CardTitle>Loading draft board</CardTitle>
          <CardDescription>Generating this round’s year and sector stock options.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleResetDraft} disabled={state.picks.length === 0}>
            Reset Draft
          </Button>
        </div>

        <Card className="overflow-hidden border-white/70 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((sector) => {
                  const isLocked = lockedSectors.includes(sector);
                  const isSelectedSector = !isLocked && resolvedSelectedSector === sector;

                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => handleFocusSector(sector)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isLocked
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                          : isSelectedSector
                            ? "border-slate-900 bg-white text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100",
                      )}
                      aria-pressed={isSelectedSector}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  "rounded-[2rem] border p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]",
                  YEAR_BADGE_STYLES[currentRound.year],
                )}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] opacity-80">Round Year</p>
                    <p className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">Picking for {currentRound.year}</p>
                    <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
                      Your picks in this round will be evaluated using {currentRound.year} historical performance.
                    </p>
                  </div>
                  <div className="self-start rounded-full border border-white/70 bg-white/80 px-6 py-3 text-xl font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                    Year {currentRound.year}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between">
                <p>All 8 sectors are visible at once. Locked sectors show what you could&apos;ve had this round.</p>
                <div className="flex gap-4">
                  <p>
                    Picks made: <span className="font-semibold text-slate-900 dark:text-slate-100">{state.picks.length}</span> / {SECTORS.length}
                  </p>
                  <p>
                    Remaining picks: <span className="font-semibold text-slate-900 dark:text-slate-100">{remainingPicks}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {SECTORS.map((sector) => (
                <SectorDisplay
                  key={`${currentRound.year}-${sector}-${state.picks.length}`}
                  sector={sector}
                  stocks={currentRound.optionsBySector[sector] ?? []}
                  isLocked={lockedSectors.includes(sector)}
                  selectedTicker={resolvedSelectedSector === sector ? resolvedSelectedTicker : null}
                  showStartingPrice={showStartingPrice}
                  onSelectStock={(ticker) => handleSelectStock(sector, ticker)}
                />
              ))}
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Finalize this pick</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Selected sector: <span className="font-semibold text-slate-900 dark:text-slate-100">{resolvedSelectedSector ?? "None"}</span>
                    {" · "}
                    Selected stock: <span className="font-semibold text-slate-900 dark:text-slate-100">{resolvedSelectedTicker ?? "None"}</span>
                  </p>
                </div>
                <Button onClick={handleConfirmPick} disabled={!resolvedSelectedSector || !resolvedSelectedTicker || !isAllocationValid}>
                  Confirm Draft Pick
                </Button>
              </div>

              <AllocationInput
                value={allocationInput}
                maxAllocation={maxAllocation}
                remainingBudget={state.remainingBudget}
                onChange={setAllocationInput}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <BudgetMeter remainingBudget={state.remainingBudget} />
        <PortfolioSummarySidebar picks={state.picks} />
      </div>
    </div>
  );
}

function DraftPageContent({ availableStocksByYearAndSector }: { availableStocksByYearAndSector: AvailableStocksByYearAndSector }) {
  const searchParams = useSearchParams();
  const isInformed = searchParams.get("mode") === "informed";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_38%),linear-gradient(to_bottom,_#0f172a,_#101a2b)]">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isInformed ? "Informed Draft" : "Blind Draft"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
            Build Your Portfolio
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-500 dark:text-slate-400">
            {isInformed
              ? "See all 8 sectors every round, compare the fresh stock board, and live with the regret of what locked sectors could have offered you next."
              : "Every round reveals a new year and a fresh 8-sector board. Once you lock a sector, it stays visible only as a greyed-out reminder of what you passed up later."}
          </p>
        </div>
        <DraftProvider>
          <DraftBoard availableStocksByYearAndSector={availableStocksByYearAndSector} showStartingPrice={isInformed} />
        </DraftProvider>
      </div>
    </main>
  );
}

export function DraftPageClient({ availableStocksByYearAndSector }: { availableStocksByYearAndSector: AvailableStocksByYearAndSector }) {
  return (
    <Suspense fallback={null}>
      <DraftPageContent availableStocksByYearAndSector={availableStocksByYearAndSector} />
    </Suspense>
  );
}