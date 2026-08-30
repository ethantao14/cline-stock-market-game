"use client"

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
import { computeHistogramBins } from "@/lib/histogram"
import type { RankResult } from "@/lib/rank"

const BIN_COUNT = 20

const tooltipFormatter: Formatter<ValueType, NameType> = (value) => {
  return [`${value} random draft${value === 1 ? "" : "s"}`, "Count"]
}

function findBinIndexForReturn(bins: ReturnType<typeof computeHistogramBins>, actualReturnPercent: number): number {
  const matchingIndex = bins.findIndex(
    (bin) => actualReturnPercent >= bin.rangeStart && actualReturnPercent <= bin.rangeEnd,
  )

  if (matchingIndex !== -1) {
    return matchingIndex
  }

  // Actual return fell outside every bin's range (can happen at the exact
  // max/min edge due to floating point); clamp to the nearest edge bin.
  return actualReturnPercent < bins[0]?.rangeStart ? 0 : bins.length - 1
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

  const bins = computeHistogramBins(rank.sampledReturns, BIN_COUNT)

  if (bins.length === 0) {
    return null
  }

  const actualReturnBinLabel = bins[findBinIndexForReturn(bins, actualReturnPercent)].label

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
              dataKey="label"
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
            <Tooltip formatter={tooltipFormatter} />
            <Bar dataKey="count" fill="var(--chart-line)" radius={[4, 4, 0, 0]} />
            <ReferenceLine
              x={actualReturnBinLabel}
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
