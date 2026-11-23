import type { RankResult } from "./rank"
import type { PortfolioValuePoint } from "./simulate-core"

function formatIndexValue(value: number): string {
  return value.toFixed(1)
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function describePortfolioSeries(series: PortfolioValuePoint[]): string {
  if (series.length === 0) return ""

  const first = series[0]
  const last = series[series.length - 1]
  let low = first.value
  let high = first.value
  for (const point of series) {
    low = Math.min(low, point.value)
    high = Math.max(high, point.value)
  }

  return `Chart summary: your portfolio index starts at ${formatIndexValue(first.value)} and ends at ${formatIndexValue(last.value)} after ${last.monthIndex / 12} years. Its low was ${formatIndexValue(low)} and its high was ${formatIndexValue(high)}.`
}

export function describeRankDistribution(rank: RankResult, actualReturnPercent: number): string {
  if (rank.sampledReturns.length === 0) return ""

  let low = rank.sampledReturns[0]
  let high = rank.sampledReturns[0]
  for (const value of rank.sampledReturns) {
    low = Math.min(low, value)
    high = Math.max(high, value)
  }

  return `Chart summary: ${rank.sampleSize.toLocaleString("en-US")} random drafts returned between ${formatSignedPercent(low)} and ${formatSignedPercent(high)}. Your return of ${formatSignedPercent(actualReturnPercent)} beat ${rank.percentile}% of them.`
}
