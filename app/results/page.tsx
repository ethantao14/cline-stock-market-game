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
import {
  computePortfolioValueSeries,
  findBestAndWorstPositions,
  getPositionResult,
  simulateWithHistoricalData,
} from "@/lib/simulate-core"
import { DRAFT_SESSION_STORAGE_KEY, parseDraftSession } from "@/lib/draft-session"
import { computePercentileRank } from "@/lib/rank"
import { analyzeMissedOpportunities } from "@/lib/missed-opportunity"
import type { MissedOpportunityAnalysis } from "@/lib/missed-opportunity"
import { PortfolioValueChart } from "@/components/results/PortfolioValueChart"
import { RankDistributionChart } from "@/components/results/RankDistributionChart"
import { PercentileRankCard } from "@/components/results/PercentileRankCard"
import { cn } from "@/lib/utils"
import type { RankResult } from "@/lib/rank"
import type { PositionResult } from "@/lib/simulate-core"
import type { DraftPick, Sector } from "@/lib/types"

import { HISTORICAL_DATA } from "@/data/historical-index"

type PositionDisplayResult = PositionResult & {
  openingPrice: number | null
  closingPrice: number | null
}

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

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function formatCompactPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${Number(value.toFixed(2)).toString()}%`
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100
}

function getPositionDisplayResult(pick: DraftPick): PositionDisplayResult {
  const position = getPositionResult(pick, HISTORICAL_DATA)
  const prices = HISTORICAL_DATA[pick.ticker]

  if (!prices || prices.length === 0) {
    return {
      ...position,
      openingPrice: null,
      closingPrice: null,
    }
  }

  const openingPrice = prices[0]?.close ?? null
  const closingPrice = prices[prices.length - 1]?.close ?? null

  if (!position.hasData || openingPrice === null || closingPrice === null || openingPrice <= 0) {
    return {
      ...position,
      openingPrice,
      closingPrice,
    }
  }

  return {
    ...position,
    openingPrice: roundToCents(openingPrice),
    closingPrice: roundToCents(closingPrice),
  }
}

export function buildResultsClipboardText({
  totalReturnPercent,
  positions,
  rank,
}: {
  totalReturnPercent: number
  positions: PositionResult[]
  rank: RankResult | null
}): string {
  const portfolioLines = positions.map((position) => {
    const returnText = position.hasData ? formatCompactPercent(position.positionReturnPercent) : "No data"

    return `${position.sector} (${position.year}): ${position.ticker} (${returnText})`
  })

  const percentileText = rank
    ? `${rank.percentile}${rank.percentile === 1 ? "st" : rank.percentile === 2 ? "nd" : rank.percentile === 3 ? "rd" : rank.percentile >= 11 && rank.percentile <= 13 ? "th" : rank.percentile % 10 === 1 ? "st" : rank.percentile % 10 === 2 ? "nd" : rank.percentile % 10 === 3 ? "rd" : "th"} percentile vs random drafts`
    : "Unavailable"

  return [
    "Stock Market Draft Results",
    "",
    `Total Return: ${formatSignedPercent(totalReturnPercent)}`,
    "",
    "Portfolio:",
    ...portfolioLines,
    "",
    `Percentile Rank: ${percentileText}`,
  ].join("\n")
}

export default function ResultsPage() {
  const [session] = useState(() => {
    if (typeof window === "undefined") {
      return null
    }

    try {
      return parseDraftSession(window.localStorage.getItem(DRAFT_SESSION_STORAGE_KEY))
    } catch {
      return null
    }
  })
  const portfolio = useMemo(() => session?.picks ?? [], [session])
  const positionResults = useMemo(() => {
    return portfolio.map((pick) => getPositionDisplayResult(pick))
  }, [portfolio])

  const simulationResult = useMemo(() => {
    return simulateWithHistoricalData(portfolio, HISTORICAL_DATA)
  }, [portfolio])

  const isPositive = simulationResult.totalReturnPercent >= 0
  const hasPortfolio = portfolio.length > 0
  const validPositionCount = positionResults.filter((position) => position.hasData).length

  const { bestPosition, worstPosition } = useMemo(() => {
    return findBestAndWorstPositions(positionResults)
  }, [positionResults])

  const rankResult = useMemo(() => {
    if (!session?.season || session.roundYears.length !== portfolio.length) {
      return null
    }

    return computePercentileRank(
      portfolio,
      session.season,
      session.roundYears,
      HISTORICAL_DATA,
      simulationResult.totalReturnPercent,
    )
  }, [portfolio, session, simulationResult])

  const resultsClipboardText = useMemo(() => {
    return buildResultsClipboardText({
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

  // Only for a finished draft. The draft page saves all 8 round years after
  // every pick, so running this mid-draft would show the player boards and
  // returns for rounds they have not reached yet.
  const missedOpportunityAnalysis = useMemo<MissedOpportunityAnalysis | null>(() => {
    if (!session || !session.season || session.roundYears.length === 0) {
      return null
    }

    if (session.picks.length !== session.roundYears.length) {
      return null
    }

    return analyzeMissedOpportunities(session.season, session.roundYears, session.picks, HISTORICAL_DATA)
  }, [session])

  if (!hasPortfolio) {
    return (
      <main
        className="min-h-screen px-6 py-10 md:px-10 md:py-14"
        style={{ backgroundImage: "var(--page-bg)" }}
      >
        <div className="mx-auto max-w-3xl">
          <Card className="border-border/60 bg-card/85 text-center shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-card-foreground">No portfolio found</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Go draft first to see how your portfolio would have performed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8 pt-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    <main
      className="min-h-screen px-6 py-8 md:px-10 md:py-12"
      style={{ backgroundImage: "var(--page-bg)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section>
          <Card className="border-border/60 bg-card/85 shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
            <CardHeader>
              <CardTitle className="text-2xl text-card-foreground">Portfolio Summary</CardTitle>
              <CardDescription className="text-muted-foreground">
                Total percent change and percentile rank versus random drafts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-muted/60 p-5">
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p
                    className={cn(
                      "mt-2 text-3xl font-semibold tracking-tight",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-muted/60 p-5">
                  <p className="text-sm text-muted-foreground">Percentile Rank</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
                    {rankResult ? `${rankResult.percentile}th` : "N/A"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">vs random drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%)] text-transparent" />
            <CardContent className="relative p-8 md:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Multi-Year Backtest
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-card-foreground md:text-5xl">
                    Your Portfolio Results
                  </h1>
                </div>
                <Badge className="rounded-full border-border/60 bg-primary px-3 py-1 text-primary-foreground">
                  {validPositionCount} simulated positions
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 md:items-end">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total percent change</p>
                  <p
                    className={cn(
                      "mt-3 text-5xl font-semibold tracking-tight md:text-6xl",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {formatSignedPercent(simulationResult.totalReturnPercent)}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Average percent change across your {validPositionCount} simulated picks.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scored on price change only. Dividends are not included.
                  </p>
                </div>

                <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/75 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Outcome</span>
                    <span className={cn("font-semibold", isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                      {isPositive ? "Outperformed" : "Underperformed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="shrink-0 rounded-full bg-card/80 px-4 dark:bg-card/80"
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
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/85 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/40">
            <CardHeader>
              <CardTitle className="text-card-foreground">Performance Snapshot</CardTitle>
              <CardDescription className="text-muted-foreground">
                Quick read on how your blind draft stacked up over the year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <PercentileRankCard rank={rankResult} />
              {bestPosition && worstPosition ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Best pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {bestPosition.ticker}{" "}
                      <span
                        className={
                          bestPosition.positionReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {formatSignedPercent(bestPosition.positionReturnPercent)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Worst pick</p>
                    <p className="mt-1 text-lg font-semibold">
                      {worstPosition.ticker}{" "}
                      <span
                        className={
                          worstPosition.positionReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {formatSignedPercent(worstPosition.positionReturnPercent)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
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
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Portfolio Composition
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each position shows its assigned year, opening price, closing price, and realized return.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {positionResults.map((position) => (
              <Card
                key={`${position.sector}-${position.ticker}-${position.year}`}
                className="border-border/60 bg-card/85 shadow-lg shadow-black/10 backdrop-blur-sm dark:shadow-black/40"
              >
                <CardHeader className="gap-3 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Badge className={cn("border", SECTOR_BADGE_STYLES[position.sector])}>
                        {position.sector}
                      </Badge>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {position.year} simulation
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-card-foreground">
                      {position.ticker}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/60 p-3">
                      <p className="text-muted-foreground">Opening Price</p>
                      <p className="mt-1 font-semibold text-card-foreground">
                        {position.openingPrice !== null ? formatCurrency(position.openingPrice) : "No data"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/60 p-3">
                      <p className="text-muted-foreground">Closing Price</p>
                      <p className="mt-1 font-semibold text-card-foreground">
                        {position.closingPrice !== null ? formatCurrency(position.closingPrice) : "No data"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-sm text-muted-foreground">Position Return</p>
                    <p
                      className={cn(
                        "mt-2 text-2xl font-semibold tracking-tight",
                        position.hasData
                          ? position.positionReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {position.hasData ? formatSignedPercent(position.positionReturnPercent) : "No data"}
                    </p>
                    {!position.hasData ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Historical data unavailable for this ticker, so it was skipped.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {missedOpportunityAnalysis ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Missed Opportunities
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  What you took versus what was on the table each round, and the best you could have done from the same boards.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-card/85 shadow-lg shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground">Best Pick You Passed On</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    The single best return you saw and did not take.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {missedOpportunityAnalysis.bestMissed ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Badge className={cn("border", SECTOR_BADGE_STYLES[missedOpportunityAnalysis.bestMissed.sector])}>
                            {missedOpportunityAnalysis.bestMissed.sector}
                          </Badge>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Round {missedOpportunityAnalysis.bestMissed.roundIndex + 1} &middot; {missedOpportunityAnalysis.bestMissed.year}
                          </p>
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-card-foreground">
                          {missedOpportunityAnalysis.bestMissed.ticker}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-3 text-2xl font-semibold tracking-tight",
                          missedOpportunityAnalysis.bestMissed.returnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {formatSignedPercent(missedOpportunityAnalysis.bestMissed.returnPercent)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No missed opportunities to show.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/85 shadow-lg shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground">Your Total vs. Best Possible</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    How your draft compares to the optimal assignment across the same boards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/60 p-3">
                      <p className="text-muted-foreground">Your Return</p>
                      <p
                        className={cn(
                          "mt-1 text-xl font-semibold tracking-tight",
                          simulationResult.totalReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {formatSignedPercent(simulationResult.totalReturnPercent)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/60 p-3">
                      <p className="text-muted-foreground">Best Possible</p>
                      <p
                        className={cn(
                          "mt-1 text-xl font-semibold tracking-tight",
                          missedOpportunityAnalysis.optimal.totalReturnPercent >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {formatSignedPercent(missedOpportunityAnalysis.optimal.totalReturnPercent)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 space-y-4">
              {missedOpportunityAnalysis.rounds.map((round) => (
                <Card
                  key={round.roundIndex}
                  className="border-border/60 bg-card/85 shadow-lg shadow-black/10 backdrop-blur-sm dark:shadow-black/40"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg text-card-foreground">
                        Round {round.roundIndex + 1}
                      </CardTitle>
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {round.year}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {round.cells.map((cell) => (
                        <div
                          key={cell.sector}
                          className={cn(
                            "rounded-2xl border p-3",
                            cell.state === "taken"
                              ? "border-primary/40 bg-primary/10"
                              : cell.state === "spent"
                                ? "border-border/60 bg-muted/60 opacity-60"
                                : "border-border/60 bg-card/60",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              className={cn(
                                "border text-xs",
                                cell.state === "spent"
                                  ? "border-border/60 bg-muted text-muted-foreground"
                                  : SECTOR_BADGE_STYLES[cell.sector],
                              )}
                            >
                              {cell.sector}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-card-foreground">
                            {cell.stock.ticker || "N/A"}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-medium",
                              cell.result.hasData
                                ? cell.result.positionReturnPercent >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {cell.result.hasData ? formatSignedPercent(cell.result.positionReturnPercent) : "No data"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {cell.state === "taken"
                              ? "Picked"
                              : cell.state === "spent"
                                ? "Already used"
                                : "Available"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <Card className="border-border/60 bg-card/85 text-center shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                  Ready for another round?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every draft draws a fresh season and new round years from 1996–2015, and every pick is held 10 years, so no two runs play out the same.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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