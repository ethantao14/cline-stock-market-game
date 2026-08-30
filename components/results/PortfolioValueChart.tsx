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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

const tooltipFormatter: Formatter<ValueType, NameType> = (value) => {
  return [formatCurrency(Number(value ?? 0)), "Portfolio value"]
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
          Portfolio Value Over Time
        </CardTitle>
        <CardDescription>
          Combined value of your invested picks plus any unspent budget, day by day.
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
              tickFormatter={(value: number) => formatCurrency(value)}
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
