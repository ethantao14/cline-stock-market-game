"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BudgetMeter } from "@/components/draft/BudgetMeter";
import { DraftProgressIndicator } from "@/components/draft/DraftProgressIndicator";
import { PortfolioSummarySidebar } from "@/components/draft/PortfolioSummarySidebar";
import { SectorRoundCard } from "@/components/draft/SectorRoundCard";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/data/sectors";
import { getMaxAllocation } from "@/lib/budget-validator";
import { DraftProvider, useDraft } from "@/lib/draft-context";
import { getCurrentRoundBoard, getRemainingPicks, type RoundBoard, type SimulationYear } from "@/lib/draft-reducer";
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

function RoundYearReveal({
  roundKey,
  currentSector,
  board,
  remainingBudget,
  maxAllocation,
  showStartingPrice,
  onStartRound,
  onDraftPick,
}: {
  roundKey: string;
  currentSector: Sector;
  board: RoundBoard | null;
  remainingBudget: number;
  maxAllocation: number;
  showStartingPrice: boolean;
  onStartRound: () => void;
  onDraftPick: (ticker: string, dollarsAllocated: number) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delayed rather than dispatched on mount, so the very first client
    // render matches the server-rendered (statically prerendered) HTML
    // exactly, both showing no board yet. Starting the round during the
    // initializer/render would pick different random options during
    // hydration than whatever the server happened to bake into the static
    // HTML, which is a hydration mismatch on every single page load, not an
    // edge case.
    const revealTimer = window.setTimeout(onStartRound, 50);

    return () => window.clearTimeout(revealTimer);
  }, [onStartRound]);

  useEffect(() => {
    // Deliberately a separate effect/render from the one that starts the
    // round: batching both into one setTimeout callback mounted the card
    // already isVisible, skipping the fade-in transition entirely since
    // there was no earlier "mounted but hidden" render to animate from.
    if (!board) {
      return;
    }

    const visibleTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => window.clearTimeout(visibleTimer);
  }, [board]);

  if (!board) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
      </div>
    );
  }

  const { year, optionsBySector } = board;
  const currentStocks = optionsBySector[currentSector];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-[2rem] border px-6 py-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out",
          YEAR_BADGE_STYLES[year],
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-current/70">Round year</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight md:text-5xl">Picking for {year}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your picks in this round will be evaluated using {year} historical performance.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-current/15 bg-white/70 px-4 py-2 text-sm font-medium text-current shadow-sm dark:bg-slate-950/60">
            Year {year}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "transition-all duration-700 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <SectorRoundCard
          key={`${roundKey}-${year}`}
          sector={currentSector}
          year={year}
          stocks={currentStocks}
          remainingBudget={remainingBudget}
          maxAllocation={maxAllocation}
          showStartingPrice={showStartingPrice}
          onDraftPick={onDraftPick}
        />
      </div>
    </div>
  );
}

function DraftFlow({
  availableStocksByYearAndSector,
  showStartingPrice,
}: {
  availableStocksByYearAndSector: AvailableStocksByYearAndSector;
  showStartingPrice: boolean;
}) {
  const router = useRouter();
  const { state, dispatch } = useDraft();
  // The full new mechanic (any unlocked sector, pickable in any order) is
  // Part 2's UI work; this keeps today's fixed sector-by-sector sequence
  // running end-to-end against the rewritten reducer in the meantime.
  const currentSector = SECTORS[state.picks.length] ?? null;
  const board = getCurrentRoundBoard(state);
  const maxAllocation = getMaxAllocation(state.remainingBudget, getRemainingPicks(state));

  const currentRoundKey = `${state.picks.length}-${currentSector ?? "complete"}`;

  useEffect(() => {
    if (state.isComplete) {
      window.localStorage.setItem("portfolio", JSON.stringify(state.picks));
      router.push("/results");
    }
  }, [state.isComplete, state.picks, router]);

  useEffect(() => {
    if (state.picks.length === 0 || state.isComplete) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.picks.length, state.isComplete]);

  const handleStartRound = useCallback(() => {
    const year = getRandomSimulationYear();
    const optionsBySector = Object.fromEntries(
      SECTORS.map((sector) => [sector, selectStockOptions(availableStocksByYearAndSector[year][sector])]),
    ) as Record<Sector, Stock[]>;

    dispatch({ type: "START_ROUND", year, optionsBySector });
  }, [availableStocksByYearAndSector, dispatch]);

  function handleResetDraft() {
    const shouldReset = window.confirm("Are you sure? This will clear your draft.");

    if (!shouldReset) {
      return;
    }

    dispatch({ type: "RESET_DRAFT" });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (!currentSector) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleResetDraft} disabled={state.picks.length === 0}>
            Reset Draft
          </Button>
        </div>
        <DraftProgressIndicator sectors={SECTORS} roundIndex={state.picks.length} />
        <RoundYearReveal
          key={currentRoundKey}
          roundKey={currentRoundKey}
          currentSector={currentSector}
          board={board}
          remainingBudget={state.remainingBudget}
          maxAllocation={maxAllocation}
          showStartingPrice={showStartingPrice}
          onStartRound={handleStartRound}
          onDraftPick={(ticker, dollarsAllocated) =>
            dispatch({ type: "SELECT_PICK", sector: currentSector, ticker, dollarsAllocated })
          }
        />
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isInformed ? "Informed Draft" : "Blind Draft"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
            Build Your Portfolio
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500 dark:text-slate-400">
            {isInformed
              ? "Pick one stock per sector, knowing each stock's price at the start of 2022. How it performs from there is still up to you to judge."
              : "Pick one stock per sector using nothing but your own judgment. No prices, no fundamentals, just conviction."}
          </p>
        </div>
        <DraftProvider>
          <DraftFlow
            availableStocksByYearAndSector={availableStocksByYearAndSector}
            showStartingPrice={isInformed}
          />
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