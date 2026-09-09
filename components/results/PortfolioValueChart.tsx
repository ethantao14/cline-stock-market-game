"use client"

import type { ReactNode } from "react"
import type {
  Formatter,
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortfolioValuePoint } from "@/lib/simulate-core"

function formatIndexValue(value: number): string {
  return value.toFixed(1)
}

const tooltipFormatter: Formatter<ValueType, NameType> = (value) => {
  return [formatIndexValue(Number(value ?? 0)), "Portfolio index"]
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

function tooltipLabelFormatter(label: ReactNode, payload: ReadonlyArray<Payload<ValueType, NameType>>): ReactNode {
  void payload
  return typeof label === "string" ? label : ""
}

export function PortfolioValueChart({ series }: { series: PortfolioValuePoint[] }) {
  if (series.length === 0) {
    return null
  }

  return (
    <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/40">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Portfolio Index Over Time
        </CardTitle>
        <CardDescription>
          Equal-weight index of your 8 picks, starting at 100 at purchase and tracked through Year 10.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-tick)" }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatIndexValue(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-tick)" }}
              width={72}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipTextStyle}
              labelStyle={tooltipTextStyle}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--chart-line)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
