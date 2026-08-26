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

function tooltipLabelFormatter(label: ReactNode, payload: ReadonlyArray<Payload<ValueType, NameType>>): ReactNode {
  void payload
  return typeof label === "string" ? label : ""
}

export function PortfolioValueChart({ series }: { series: PortfolioValuePoint[] }) {
  if (series.length === 0) {
    return null
  }

  return (
    <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
          Portfolio Value Over Time
        </CardTitle>
        <CardDescription>
          Combined value of your invested picks plus any unspent budget, day by day.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrency(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              width={72}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f172a"
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
