"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { STARTING_BUDGET } from "@/lib/draft-reducer"
import {
  computePortfolioValueSeries,
  findBestAndWorstPositions,
  getPositionResult,
  simulateWithHistoricalData,
} from "@/lib/simulate-core"
import { computePercentileRank } from "@/lib/rank"
import { PortfolioValueChart } from "@/components/results/PortfolioValueChart"
import { RankDistributionChart } from "@/components/results/RankDistributionChart"
import { PercentileRankCard } from "@/components/results/PercentileRankCard"
import { cn } from "@/lib/utils"
import type { RankResult } from "@/lib/rank"
import type { PositionResult } from "@/lib/simulate-core"
import type { DraftPick, Portfolio, Sector } from "@/lib/types"

import { HISTORICAL_DATA } from "@/data/historical-index"

const SECTOR_BADGE_STYLES: Record<Sector, string> = {
  Technology: "border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-500/30 dark:text-sky-300",
  Healthcare: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300",
  Financials: "border-violet-200 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:text-violet-300",
  Energy: "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300",
  "Consumer Discretionary": "border-pink-200 bg-pink-500/10 text-pink-700 dark:border-pink-500/30 dark:text-pink-300",
  "Consumer Staples": "border-teal-200 bg-teal-500/10 text-teal-700 dark:border-teal-500/30 dark:text-teal-300",
  Industrials: "border-slate-200 bg-slate-500/10 text-slate-700 dark:border-slate-500/30 dark:text-slate-300",
  Utilities: "border-indigo-200 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-300",
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

function formatCompactPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${Number(value.toFixed(2)).toString()}%`
}

export function buildResultsClipboardText({
  startingValue,
  endingValue,
  totalReturnPercent,
  positions,
  rank,
}: {
  startingValue: number
  endingValue: number
  totalReturnPercent: number
  positions: PositionResult[]
  rank: RankResult | null
}): string {
  const portfolioLines = positions.map((position) => {
    const endingValueText = position.hasData ? formatCurrency(position.endingValue) : "No data"
    const returnText = position.hasData ? formatCompactPercent(position.positionReturnPercent) : "No data"

    return `${position.sector} (${position.year}): ${position.ticker} - ${formatCurrency(position.dollarsAllocated)} allocated → ${endingValueText} ending (${returnText})`
  })

  const percentileText = rank
    ? `${rank.percentile}${rank.percentile === 1 ? "st" : rank.percentile === 2 ? "nd" : rank.percentile === 3 ? "rd" : rank.percentile >= 11 && rank.percentile <= 13 ? "th" : rank.percentile % 10 === 1 ? "st" : rank.percentile % 10 === 2 ? "nd" : rank.percentile % 10 === 3 ? "rd" : "th"} percentile vs random drafts`
    : "Unavailable"

  return [
    "Stock Market Draft Results",
    "",
    `Starting Capital: ${formatCurrency(startingValue)}`,
    `Ending Value: ${formatCurrency(endingValue)}`,
    `Total Return: ${formatSignedPercent(totalReturnPercent)}`,
    "",
    "Portfolio:",
    ...portfolioLines,
    "",
    `Percentile Rank: ${percentileText}`,
  ].join("\n")
}

function isDraftPick(value: unknown): value is DraftPick {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const pick = value as Record<string, unknown>

  return (
    typeof pick.sector === "string" &&
    typeof pick.ticker === "string" &&
    typeof pick.year === "number" &&
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

  const rankResult = useMemo(() => {
    return computePercentileRank(portfolio, HISTORICAL_DATA, simulationResult.totalReturnPercent)
  }, [portfolio, simulationResult])

  const resultsClipboardText = useMemo(() => {
    return buildResultsClipboardText({
      startingValue: simulationResult.startingValue || STARTING_BUDGET,
      endingValue: simulationResult.endingValue,
      totalReturnPercent: simulationResult.totalReturnPercent,
      positions: positionResults,
      rank: rankResult,
    })
  }, [positionResults, rankResult, simulationResult])

  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    if (copyStatus === "idle") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus("idle")
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [copyStatus])

  const valueSeries = useMemo(() => {
    return computePortfolioValueSeries(portfolio, HISTORICAL_DATA)
  }, [portfolio])

  if (!hasPortfolio || !simulationResult) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-10 md:px-10 md:py-14 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_38%),linear-gradient(to_bottom,_#0f172a,_#101a2b)]">
        <div className="mx-auto max-w-3xl">
          <Card className="border-white/70 bg-white/85 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-slate-950 dark:text-slate-100">No portfolio found</CardTitle>
              <CardDescription className="text-base text-slate-500 dark:text-slate-400">
                Go draft first to see how your portfolio would have performed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8 pt-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300 dark:focus-visible:ring-slate-600"
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 md:px-10 md:py-12 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_38%),linear-gradient(to_bottom,_#0f172a,_#101a2b)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="relative overflow-hidden border-white/70 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%)]" />
            <CardContent className="relative p-8 md:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Multi-Year Backtest
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
                    Your Portfolio Results
                  </h1>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="shrink-0 rounded-full border-slate-300/80 bg-white/80 px-4 dark:border-slate-700 dark:bg-slate-900/70"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(resultsClipboardText)
                      setCopyStatus("success")
                    } catch {
                      setCopyStatus("error")
                    }
                  }}
                  aria-live="polite"
                >
                  {copyStatus === "success" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copyStatus === "success"
                    ? "Copied"
                    : copyStatus === "error"
                      ? "Copy failed"
                      : "Copy Results"}
                </Button>
                </div>
                <Badge className="rounded-full border-slate-200 bg-slate-950 px-3 py-1 text-slate-50 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
                  {validPositionCount} simulated positions
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 md:items-end">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net portfolio return</p>
                  <p
                    className={cn(
                      "mt-3 text-5xl font-semibold tracking-tight md:text-6xl",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatSignedCurrency(profitLoss)}
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-xl font-medium",
                      isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                </div>

                <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Starting capital</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(simulationResult.startingValue || STARTING_BUDGET)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Ending value</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(simulationResult.endingValue)}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Outcome</span>
                    <span className={cn("font-semibold", isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
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
              <PercentileRankCard rank={rankResult} />
              {bestPosition && worstPosition ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Best pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {bestPosition.ticker}{" "}
                      <span
                        className={
                          bestPosition.positionReturnPercent >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {formatSignedPercent(bestPosition.positionReturnPercent)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Worst pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {worstPosition.ticker}{" "}
                      <span
                        className={
                          worstPosition.positionReturnPercent >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
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
          <PortfolioValueChart series={valueSeries} />
        </section>

        <section>
          <RankDistributionChart rank={rankResult} actualReturnPercent={simulationResult.totalReturnPercent} />
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                Portfolio Composition
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Each position shows its assigned year, allocation, ending value, and realized return.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {positionResults.map((position) => (
              <Card
                key={`${position.sector}-${position.ticker}-${position.year}`}
                className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/40"
              >
                <CardHeader className="gap-3 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Badge className={cn("border", SECTOR_BADGE_STYLES[position.sector])}>
                        {position.sector}
                      </Badge>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {position.year} simulation
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                      {position.ticker}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="text-slate-500 dark:text-slate-400">Allocated</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(position.dollarsAllocated)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="text-slate-500 dark:text-slate-400">Ending Value</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(position.endingValue)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Position Return</p>
                    <p
                      className={cn(
                        "mt-2 text-2xl font-semibold tracking-tight",
                        position.hasData
                          ? position.positionReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {position.hasData ? formatSignedPercent(position.positionReturnPercent) : "No data"}
                    </p>
                    {!position.hasData ? (
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
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
          <Card className="border-white/70 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/50">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950 dark:text-slate-100">Summary Stats</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Core totals for your completed multi-year simulation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Starting Value</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                    {formatCurrency(simulationResult.startingValue || STARTING_BUDGET)}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ending Value</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                    {formatCurrency(simulationResult.endingValue)}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Return %</p>
                  <p
                    className={cn(
                      "mt-2 text-3xl font-semibold tracking-tight",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/70 bg-white/85 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/50">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                  Ready for another round?
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Each draft assigns a new random year per pick, so no two runs play out the same.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300 dark:focus-visible:ring-slate-600"
              >
                Play again
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}