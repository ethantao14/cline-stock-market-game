"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { STARTING_BUDGET } from "@/lib/draft-reducer"
import {
  findBestAndWorstPositions,
  getPositionResult,
  simulateWithHistoricalData,
} from "@/lib/simulate-core"
import { cn } from "@/lib/utils"
import type { DraftPick, Portfolio, Sector } from "@/lib/types"

import { HISTORICAL_DATA } from "@/data/historical-index"

const SECTOR_BADGE_STYLES: Record<Sector, string> = {
  Technology: "border-sky-200 bg-sky-500/10 text-sky-700",
  Healthcare: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  Financials: "border-violet-200 bg-violet-500/10 text-violet-700",
  Energy: "border-amber-200 bg-amber-500/10 text-amber-700",
  "Consumer Discretionary": "border-pink-200 bg-pink-500/10 text-pink-700",
  "Consumer Staples": "border-teal-200 bg-teal-500/10 text-teal-700",
  Industrials: "border-slate-200 bg-slate-500/10 text-slate-700",
  Utilities: "border-indigo-200 bg-indigo-500/10 text-indigo-700",
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatSignedCurrency(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function isDraftPick(value: unknown): value is DraftPick {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const pick = value as Record<string, unknown>

  return (
    typeof pick.sector === "string" &&
    typeof pick.ticker === "string" &&
    typeof pick.dollarsAllocated === "number"
  )
}

export default function ResultsPage() {
  const [portfolio] = useState<Portfolio>(() => {
    if (typeof window === "undefined") {
      return []
    }

    try {
      const storedPortfolio = window.localStorage.getItem("portfolio")

      if (!storedPortfolio) {
        return []
      }

      const parsed = JSON.parse(storedPortfolio) as unknown

      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter(isDraftPick)
    } catch {
      return []
    }
  })
  const positionResults = useMemo(() => {
    return portfolio.map((pick) => getPositionResult(pick, HISTORICAL_DATA))
  }, [portfolio])

  const simulationResult = useMemo(() => {
    return simulateWithHistoricalData(portfolio, HISTORICAL_DATA)
  }, [portfolio])

  const profitLoss = simulationResult
    ? simulationResult.endingValue - simulationResult.startingValue
    : 0
  const isPositive = profitLoss >= 0
  const hasPortfolio = portfolio.length > 0
  const validPositionCount = positionResults.filter((position) => position.hasData).length

  const { bestPosition, worstPosition } = useMemo(() => {
    return findBestAndWorstPositions(positionResults)
  }, [positionResults])

  if (!hasPortfolio || !simulationResult) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Card className="border-white/70 bg-white/85 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-slate-950">No portfolio found</CardTitle>
              <CardDescription className="text-base text-slate-500">
                Go draft first to see how your portfolio would have performed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8 pt-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Go draft first
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="relative overflow-hidden border-white/70 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%)]" />
            <CardContent className="relative p-8 md:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    2022 Backtest
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                    Your Portfolio Results
                  </h1>
                </div>
                <Badge className="rounded-full border-slate-200 bg-slate-950 px-3 py-1 text-slate-50">
                  {validPositionCount} simulated positions
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 md:items-end">
                <div>
                  <p className="text-sm font-medium text-slate-500">Net portfolio return</p>
                  <p
                    className={cn(
                      "mt-3 text-5xl font-semibold tracking-tight md:text-6xl",
                      isPositive ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {formatSignedCurrency(profitLoss)}
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-xl font-medium",
                      isPositive ? "text-emerald-700" : "text-rose-700",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                </div>

                <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Starting capital</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(simulationResult.startingValue || STARTING_BUDGET)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Ending value</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(simulationResult.endingValue)}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Outcome</span>
                    <span className={cn("font-semibold", isPositive ? "text-emerald-700" : "text-rose-700")}>
                      {isPositive ? "Outperformed" : "Underperformed"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-slate-950 text-slate-50 shadow-2xl shadow-slate-300/30">
            <CardHeader>
              <CardTitle className="text-slate-50">Performance Snapshot</CardTitle>
              <CardDescription className="text-slate-400">
                Quick read on how your blind draft stacked up over the year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {bestPosition && worstPosition ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Best pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {bestPosition.ticker}{" "}
                      <span className="text-emerald-400">
                        {formatSignedPercent(bestPosition.positionReturnPercent)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Worst pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {worstPosition.ticker}{" "}
                      <span className="text-rose-400">
                        {formatSignedPercent(worstPosition.positionReturnPercent)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <p className="text-sm text-slate-400">Positions with data</p>
                  <p className="mt-1 text-3xl font-semibold">{validPositionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Skipped positions</p>
                  <p className="mt-1 text-3xl font-semibold">{positionResults.length - validPositionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Portfolio Composition
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Each position shows your allocation, ending value, and realized 2022 return.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {positionResults.map((position) => (
              <Card
                key={`${position.sector}-${position.ticker}`}
                className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-sm"
              >
                <CardHeader className="gap-3 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={cn("border", SECTOR_BADGE_STYLES[position.sector])}>
                      {position.sector}
                    </Badge>
                    <span className="text-2xl font-semibold tracking-tight text-slate-950">
                      {position.ticker}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Allocated</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(position.dollarsAllocated)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Ending Value</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(position.endingValue)}
                      </p>
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
                          : "text-slate-400",
                      )}
                    >
                      {position.hasData ? formatSignedPercent(position.positionReturnPercent) : "No data"}
                    </p>
                    {!position.hasData ? (
                      <p className="mt-2 text-xs text-slate-400">
                        Historical data unavailable for this ticker, so it was skipped.
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
                Core totals for your completed 2022 simulation.
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
  )
}