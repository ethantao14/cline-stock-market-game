"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HISTORICAL_DATA_BY_YEAR_AND_TICKER } from "@/data/historical-data";
import { STARTING_BUDGET } from "@/lib/draft-reducer";
import { simulateWithHistoricalData } from "@/lib/simulate-core";
import type { DraftPick, Portfolio, Sector, SimulationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTOR_BADGE_STYLES: Record<Sector, string> = {
  Technology: "border-sky-200 bg-sky-500/10 text-sky-700",
  Healthcare: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  Financials: "border-violet-200 bg-violet-500/10 text-violet-700",
  Energy: "border-amber-200 bg-amber-500/10 text-amber-700",
  "Consumer Discretionary": "border-pink-200 bg-pink-500/10 text-pink-700",
  "Consumer Staples": "border-teal-200 bg-teal-500/10 text-teal-700",
  Industrials: "border-slate-200 bg-slate-500/10 text-slate-700",
  Utilities: "border-indigo-200 bg-indigo-500/10 text-indigo-700",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrency(value: number): string {
  const formatted = formatCurrency(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function isDraftPick(value: unknown): value is DraftPick {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pick = value as Record<string, unknown>;

  return (
    typeof pick.sector === "string" &&
    typeof pick.ticker === "string" &&
    typeof pick.year === "number" &&
    Number.isFinite(pick.year) &&
    typeof pick.dollarsAllocated === "number"
  );
}

export default function ResultsPage() {
  const [portfolio] = useState<Portfolio>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const storedPortfolio = window.localStorage.getItem("portfolio");

      if (!storedPortfolio) {
        return [];
      }

      const parsed = JSON.parse(storedPortfolio) as unknown;

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isDraftPick);
    } catch {
      return [];
    }
  });

  const simulationResult = useMemo<SimulationResult | null>(() => {
    if (portfolio.length === 0) {
      return null;
    }

    return simulateWithHistoricalData(portfolio, HISTORICAL_DATA_BY_YEAR_AND_TICKER);
  }, [portfolio]);

  const positionResults = simulationResult?.positions ?? [];
  const validPositionCount = positionResults.filter((position) => position.hasData).length;
  const missingPositionCount = simulationResult?.missingDataPicks.length ?? 0;
  const hasPortfolio = portfolio.length > 0;

  if (!hasPortfolio || !simulationResult) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <Card className="border-white/70 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-slate-950">No portfolio to simulate yet</CardTitle>
              <CardDescription className="text-slate-500">
                Complete a draft first, then come back here to see how your picks performed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/draft"
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Start a draft
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const profitLoss = simulationResult.endingValue - simulationResult.startingValue;
  const isPositive = profitLoss >= 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <Card className="overflow-hidden border-none bg-slate-950 text-white shadow-2xl shadow-slate-300/40">
            <CardHeader className="pb-6">
              <Badge className="w-fit border border-white/15 bg-white/10 text-slate-100 hover:bg-white/10">
                Portfolio Results
              </Badge>
              <CardTitle className="mt-4 text-4xl tracking-tight">Your multi-year simulation is in.</CardTitle>
              <CardDescription className="max-w-2xl text-slate-300">
                Each position was simulated using its assigned historical year. Positions without data were flagged and excluded from invested return calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 border-t border-white/10 bg-white/5 p-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-300">Starting Capital</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(simulationResult.startingValue)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Ending Value</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(simulationResult.endingValue)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Net Change</p>
                <p className={cn("mt-2 text-3xl font-semibold", isPositive ? "text-emerald-300" : "text-rose-300")}>
                  {formatSignedCurrency(profitLoss)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-950">Performance Snapshot</CardTitle>
              <CardDescription className="text-slate-500">
                Quick read on how your draft stacked up across assigned simulation years.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">Total Return</p>
                <p className={cn("mt-2 text-3xl font-semibold", isPositive ? "text-emerald-300" : "text-rose-300")}>
                  {formatSignedPercent(simulationResult.totalReturnPercent)}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Positions with data</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{validPositionCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Missing data picks</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{missingPositionCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Budget Baseline</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(STARTING_BUDGET)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Position Breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">
                Every drafted pick, including warnings for years where historical data was unavailable.
              </p>
            </div>
            <Link href="/draft" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              Draft again
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {positionResults.map((position) => (
              <Card
                key={`${position.sector}-${position.ticker}-${position.year}`}
                className="border-white/70 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl text-slate-950">{position.ticker}</CardTitle>
                      <CardDescription className="text-slate-500">Simulation year: {position.year}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn("border", SECTOR_BADGE_STYLES[position.sector])}>{position.sector}</Badge>
                      {!position.hasData ? (
                        <Badge className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                          Missing data
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Allocated</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(position.dollarsAllocated)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Ending Value</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(position.endingValue)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-sm text-slate-500">Position Return</p>
                    <p
                      className={cn(
                        "mt-2 text-2xl font-semibold tracking-tight",
                        position.hasData
                          ? position.positionReturnPercent >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                          : "text-amber-600",
                      )}
                    >
                      {position.hasData ? formatSignedPercent(position.positionReturnPercent) : "No data"}
                    </p>
                    {!position.hasData ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Historical data not available for this stock in {position.year}.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950">Summary Stats</CardTitle>
              <CardDescription className="text-slate-500">
                Core totals for your completed simulation, with missing-data picks excluded from invested performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Starting Value</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(simulationResult.startingValue || STARTING_BUDGET)}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Ending Value</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(simulationResult.endingValue)}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Total Return %</p>
                  <p
                    className={cn(
                      "mt-2 text-3xl font-semibold tracking-tight",
                      isPositive ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}