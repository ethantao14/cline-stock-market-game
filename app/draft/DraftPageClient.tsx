"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BudgetMeter } from "@/components/draft/BudgetMeter";
import { DraftProgressIndicator } from "@/components/draft/DraftProgressIndicator";
import { PortfolioSummarySidebar } from "@/components/draft/PortfolioSummarySidebar";
import { SectorRoundCard } from "@/components/draft/SectorRoundCard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/data/sectors";
import { DraftProvider, useDraft } from "@/lib/draft-context";
import { getCurrentSector, type SimulationYear } from "@/lib/draft-reducer";
import { cn } from "@/lib/utils";
import type { Sector, Stock } from "@/lib/types";

type AvailableStocksByYearAndSector = Record<SimulationYear, Record<Sector, Stock[]>>;
const YEAR_BADGE_STYLES: Record<SimulationYear, string> = {
  2019: "border-violet-200 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-white text-violet-700",
  2020: "border-sky-200 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-white text-sky-700",
  2021: "border-emerald-200 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-white text-emerald-700",
  2022: "border-amber-200 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-white text-amber-700",
};

function getRandomSimulationYear(): SimulationYear {
  return (Math.floor(Math.random() * 4) + 2019) as SimulationYear;
}

function RoundYearReveal({
  roundKey,
  currentSector,
  availableStocksByYearAndSector,
  remainingBudget,
  showStartingPrice,
  onDraftPick,
}: {
  roundKey: string;
  currentSector: Sector;
  availableStocksByYearAndSector: AvailableStocksByYearAndSector;
  remainingBudget: number;
  showStartingPrice: boolean;
  onDraftPick: (ticker: string, year: SimulationYear, dollarsAllocated: number) => void;
}) {
  const [revealedYear] = useState<SimulationYear>(() => getRandomSimulationYear());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => window.clearTimeout(revealTimer);
  }, []);

  const currentStocks = useMemo(() => {
    return availableStocksByYearAndSector[revealedYear][currentSector];
  }, [availableStocksByYearAndSector, currentSector, revealedYear]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-[2rem] border px-6 py-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out",
          YEAR_BADGE_STYLES[revealedYear],
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-current/70">Round year</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight md:text-5xl">Picking for {revealedYear}</p>
            <p className="mt-2 text-sm text-slate-600">
              Your picks in this round will be evaluated using {revealedYear} historical performance.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-current/15 bg-white/70 px-4 py-2 text-sm font-medium text-current shadow-sm">
            Year {revealedYear}
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
          key={`${roundKey}-${revealedYear}`}
          sector={currentSector}
          year={revealedYear}
          stocks={currentStocks}
          remainingBudget={remainingBudget}
          showStartingPrice={showStartingPrice}
          onDraftPick={(ticker, dollarsAllocated) =>
            onDraftPick(ticker, revealedYear, dollarsAllocated)
          }
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
  const currentSector = getCurrentSector(state);

  const currentRoundKey = `${state.roundIndex}-${currentSector ?? "complete"}`;

  useEffect(() => {
    if (state.isComplete) {
      window.localStorage.setItem("portfolio", JSON.stringify(state.picks));
      router.push("/results");
    }
  }, [state.isComplete, state.picks, router]);

  useEffect(() => {
    if (state.roundIndex === 0 || state.isComplete) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.roundIndex, state.isComplete]);

  if (state.isComplete) {
    return (
      <Card className="border-white/70 bg-white/85 text-center">
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
        <DraftProgressIndicator sectors={SECTORS} roundIndex={state.roundIndex} />
        <RoundYearReveal
          key={currentRoundKey}
          roundKey={currentRoundKey}
          currentSector={currentSector}
          availableStocksByYearAndSector={availableStocksByYearAndSector}
          remainingBudget={state.remainingBudget}
          showStartingPrice={showStartingPrice}
          onDraftPick={(ticker, year, dollarsAllocated) =>
            dispatch({ type: "SELECT_PICK", ticker, year, dollarsAllocated })
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            {isInformed ? "Informed Draft" : "Blind Draft"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Build Your Portfolio
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
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