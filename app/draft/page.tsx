"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetMeter } from "@/components/draft/BudgetMeter";
import { DraftProgressIndicator } from "@/components/draft/DraftProgressIndicator";
import { PortfolioSummarySidebar } from "@/components/draft/PortfolioSummarySidebar";
import { SectorRoundCard } from "@/components/draft/SectorRoundCard";
import { SECTORS } from "@/data/sectors";
import { getAvailableStocks } from "@/lib/available-stocks";
import { DraftProvider, useDraft } from "@/lib/draft-context";
import { getCurrentSector } from "@/lib/draft-reducer";

function DraftFlow() {
  const router = useRouter();
  const { state, dispatch } = useDraft();
  const currentSector = getCurrentSector(state);

  useEffect(() => {
    if (state.isComplete) {
      window.localStorage.setItem("portfolio", JSON.stringify(state.picks));
      router.push("/results");
    }
  }, [state.isComplete, state.picks, router]);

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
        <SectorRoundCard
          sector={currentSector}
          stocks={getAvailableStocks(currentSector)}
          remainingBudget={state.remainingBudget}
          onDraftPick={(ticker, dollarsAllocated) =>
            dispatch({ type: "SELECT_PICK", ticker, dollarsAllocated })
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

export default function DraftPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Blind Draft
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Build Your Portfolio
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
            Pick one stock per sector using nothing but your own judgment. No prices, no
            fundamentals, just conviction.
          </p>
        </div>
        <DraftProvider>
          <DraftFlow />
        </DraftProvider>
      </div>
    </main>
  );
}
