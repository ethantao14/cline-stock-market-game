"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { Formatter, NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { computeHistogramBins, type HistogramBin } from "@/lib/histogram"
import type { RankResult } from "@/lib/rank"

const BIN_COUNT = 20

const tooltipFormatter: Formatter<ValueType, NameType> = (value) => {
  return [`${value} random draft${value === 1 ? "" : "s"}`, "Count"]
}

// Recharts' Tooltip has no theme awareness of its own, so its box and text
// colors are set explicitly here rather than left at Recharts' hardcoded
// light-mode default, which read as washed-out gray-on-white in dark mode.
const tooltipContentStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--chart-grid)",
  borderRadius: "0.75rem",
}
const tooltipTextStyle = { color: "var(--popover-foreground)" }

// Assumes actualReturnPercent was passed as an extraDomainValue to
// computeHistogramBins, so it always falls within some bin's range; the
// fallback below only guards floating-point edge cases, not real misses.
function findBinIndexForReturn(bins: HistogramBin[], actualReturnPercent: number): number {
  // Matches computeHistogramBins' own counting: each bin is [start, end)
  // except the last, which is [start, end] so the true max isn't dropped.
  const matchingIndex = bins.findIndex((bin, index) => {
    const isLastBin = index === bins.length - 1
    const isBelowEnd = isLastBin ? actualReturnPercent <= bin.rangeEnd : actualReturnPercent < bin.rangeEnd
    return actualReturnPercent >= bin.rangeStart && isBelowEnd
  })

  return matchingIndex === -1 ? bins.length - 1 : matchingIndex
}

export function RankDistributionChart({
  rank,
  actualReturnPercent,
}: {
  rank: RankResult | null
  actualReturnPercent: number
}) {
  if (!rank) {
    return null
  }

  // actualReturnPercent as an extra domain value keeps the "You" marker from
  // being clamped to an edge bin when the real return is more extreme than
  // every sampled draft, which would understate how far outside it landed.
  const bins = computeHistogramBins(rank.sampledReturns, BIN_COUNT, [actualReturnPercent])

  if (bins.length === 0) {
    return null
  }

  const actualReturnBinIndex = findBinIndexForReturn(bins, actualReturnPercent)

  // Keyed by index, not the rounded label text: small allocations can make
  // adjacent bins round to the same label, which would misplace the marker.
  function tooltipLabelFormatter(index: ReactNode): ReactNode {
    return typeof index === "number" ? (bins[index]?.label ?? "") : ""
  }

  return (
    <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/40">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Distribution of Random Drafts
        </CardTitle>
        <CardDescription>
          Total returns from {rank.sampleSize.toLocaleString()} simulated drafts using your same sectors, years, and
          allocations, with a random ticker swapped in for each pick.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 24, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="index"
              tickFormatter={(index: number) => bins[index]?.label ?? ""}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-tick)" }}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipTextStyle}
              labelStyle={tooltipTextStyle}
            />
            <Bar dataKey="count" fill="var(--chart-line)" radius={[4, 4, 0, 0]} />
            <ReferenceLine
              x={actualReturnBinIndex}
              stroke="var(--chart-reference)"
              strokeWidth={2}
              label={{ value: "You", position: "top", fill: "var(--chart-reference)", fontSize: 12 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
