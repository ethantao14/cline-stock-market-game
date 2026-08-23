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
import { cn } from "@/lib/utils"
import type { DraftPick, Portfolio, Sector, SimulationResult } from "@/lib/types"

import AAPL from "@/data/historical/AAPL.json"
import ABBV from "@/data/historical/ABBV.json"
import ABT from "@/data/historical/ABT.json"
import ADBE from "@/data/historical/ADBE.json"
import AEE from "@/data/historical/AEE.json"
import AEP from "@/data/historical/AEP.json"
import AIG from "@/data/historical/AIG.json"
import AMD from "@/data/historical/AMD.json"
import AMGN from "@/data/historical/AMGN.json"
import AMZN from "@/data/historical/AMZN.json"
import AVGO from "@/data/historical/AVGO.json"
import AWK from "@/data/historical/AWK.json"
import AXP from "@/data/historical/AXP.json"
import BA from "@/data/historical/BA.json"
import BAC from "@/data/historical/BAC.json"
import BKNG from "@/data/historical/BKNG.json"
import BKR from "@/data/historical/BKR.json"
import BLK from "@/data/historical/BLK.json"
import BMY from "@/data/historical/BMY.json"
import C from "@/data/historical/C.json"
import CAT from "@/data/historical/CAT.json"
import CI from "@/data/historical/CI.json"
import CL from "@/data/historical/CL.json"
import CLX from "@/data/historical/CLX.json"
import CMG from "@/data/historical/CMG.json"
import CMS from "@/data/historical/CMS.json"
import COF from "@/data/historical/COF.json"
import COP from "@/data/historical/COP.json"
import COST from "@/data/historical/COST.json"
import CRM from "@/data/historical/CRM.json"
import CSCO from "@/data/historical/CSCO.json"
import CSX from "@/data/historical/CSX.json"
import CVS from "@/data/historical/CVS.json"
import CVX from "@/data/historical/CVX.json"
import D from "@/data/historical/D.json"
import DE from "@/data/historical/DE.json"
import DHI from "@/data/historical/DHI.json"
import DUK from "@/data/historical/DUK.json"
import DVN from "@/data/historical/DVN.json"
import EBAY from "@/data/historical/EBAY.json"
import ED from "@/data/historical/ED.json"
import EOG from "@/data/historical/EOG.json"
import ES from "@/data/historical/ES.json"
import ETR from "@/data/historical/ETR.json"
import EXC from "@/data/historical/EXC.json"
import F from "@/data/historical/F.json"
import FANG from "@/data/historical/FANG.json"
import FDX from "@/data/historical/FDX.json"
import FE from "@/data/historical/FE.json"
import GD from "@/data/historical/GD.json"
import GE from "@/data/historical/GE.json"
import GILD from "@/data/historical/GILD.json"
import GIS from "@/data/historical/GIS.json"
import GM from "@/data/historical/GM.json"
import GOOGL from "@/data/historical/GOOGL.json"
import GS from "@/data/historical/GS.json"
import HAL from "@/data/historical/HAL.json"
import HCA from "@/data/historical/HCA.json"
import HD from "@/data/historical/HD.json"
import HON from "@/data/historical/HON.json"
import HSY from "@/data/historical/HSY.json"
import IBM from "@/data/historical/IBM.json"
import INTC from "@/data/historical/INTC.json"
import INTU from "@/data/historical/INTU.json"
import ISRG from "@/data/historical/ISRG.json"
import JNJ from "@/data/historical/JNJ.json"
import JPM from "@/data/historical/JPM.json"
import KDP from "@/data/historical/KDP.json"
import KMB from "@/data/historical/KMB.json"
import KMI from "@/data/historical/KMI.json"
import KO from "@/data/historical/KO.json"
import KR from "@/data/historical/KR.json"
import LLY from "@/data/historical/LLY.json"
import LMT from "@/data/historical/LMT.json"
import LOW from "@/data/historical/LOW.json"
import MA from "@/data/historical/MA.json"
import MAR from "@/data/historical/MAR.json"
import MCD from "@/data/historical/MCD.json"
import MDLZ from "@/data/historical/MDLZ.json"
import MDT from "@/data/historical/MDT.json"
import MET from "@/data/historical/MET.json"
import META from "@/data/historical/META.json"
import MMM from "@/data/historical/MMM.json"
import MO from "@/data/historical/MO.json"
import MPC from "@/data/historical/MPC.json"
import MRK from "@/data/historical/MRK.json"
import MS from "@/data/historical/MS.json"
import MSFT from "@/data/historical/MSFT.json"
import NEE from "@/data/historical/NEE.json"
import NKE from "@/data/historical/NKE.json"
import NOC from "@/data/historical/NOC.json"
import NOW from "@/data/historical/NOW.json"
import NSC from "@/data/historical/NSC.json"
import NVDA from "@/data/historical/NVDA.json"
import ORCL from "@/data/historical/ORCL.json"
import OXY from "@/data/historical/OXY.json"
import PEG from "@/data/historical/PEG.json"
import PEP from "@/data/historical/PEP.json"
import PFE from "@/data/historical/PFE.json"
import PG from "@/data/historical/PG.json"
import PM from "@/data/historical/PM.json"
import PNC from "@/data/historical/PNC.json"
import PPL from "@/data/historical/PPL.json"
import PSX from "@/data/historical/PSX.json"
import PYPL from "@/data/historical/PYPL.json"
import QCOM from "@/data/historical/QCOM.json"
import RCL from "@/data/historical/RCL.json"
import ROST from "@/data/historical/ROST.json"
import RTX from "@/data/historical/RTX.json"
import SBUX from "@/data/historical/SBUX.json"
import SCHW from "@/data/historical/SCHW.json"
import SLB from "@/data/historical/SLB.json"
import SO from "@/data/historical/SO.json"
import SPGI from "@/data/historical/SPGI.json"
import SRE from "@/data/historical/SRE.json"
import STZ from "@/data/historical/STZ.json"
import SYY from "@/data/historical/SYY.json"
import TFC from "@/data/historical/TFC.json"
import TGT from "@/data/historical/TGT.json"
import TJX from "@/data/historical/TJX.json"
import TMO from "@/data/historical/TMO.json"
import TRGP from "@/data/historical/TRGP.json"
import TSLA from "@/data/historical/TSLA.json"
import TXN from "@/data/historical/TXN.json"
import UNH from "@/data/historical/UNH.json"
import UNP from "@/data/historical/UNP.json"
import UPS from "@/data/historical/UPS.json"
import USB from "@/data/historical/USB.json"
import V from "@/data/historical/V.json"
import VLO from "@/data/historical/VLO.json"
import VRTX from "@/data/historical/VRTX.json"
import WEC from "@/data/historical/WEC.json"
import WFC from "@/data/historical/WFC.json"
import WM from "@/data/historical/WM.json"
import WMB from "@/data/historical/WMB.json"
import WMT from "@/data/historical/WMT.json"
import XEL from "@/data/historical/XEL.json"
import XOM from "@/data/historical/XOM.json"
import YUM from "@/data/historical/YUM.json"
import ZTS from "@/data/historical/ZTS.json"

type HistoricalPrice = {
  date: string
  close: number
}

type PositionResult = {
  sector: Sector
  ticker: string
  dollarsAllocated: number
  endingValue: number
  positionReturnPercent: number
  hasData: boolean
}

const HISTORICAL_DATA: Record<string, HistoricalPrice[]> = {
  AAPL,
  ABBV,
  ABT,
  ADBE,
  AEE,
  AEP,
  AIG,
  AMD,
  AMGN,
  AMZN,
  AVGO,
  AWK,
  AXP,
  BA,
  BAC,
  BKNG,
  BKR,
  BLK,
  BMY,
  C,
  CAT,
  CI,
  CL,
  CLX,
  CMG,
  CMS,
  COF,
  COP,
  COST,
  CRM,
  CSCO,
  CSX,
  CVS,
  CVX,
  D,
  DE,
  DHI,
  DUK,
  DVN,
  EBAY,
  ED,
  EOG,
  ES,
  ETR,
  EXC,
  F,
  FANG,
  FDX,
  FE,
  GD,
  GE,
  GILD,
  GIS,
  GM,
  GOOGL,
  GS,
  HAL,
  HCA,
  HD,
  HON,
  HSY,
  IBM,
  INTC,
  INTU,
  ISRG,
  JNJ,
  JPM,
  KDP,
  KMB,
  KMI,
  KO,
  KR,
  LLY,
  LMT,
  LOW,
  MA,
  MAR,
  MCD,
  MDLZ,
  MDT,
  MET,
  META,
  MMM,
  MO,
  MPC,
  MRK,
  MS,
  MSFT,
  NEE,
  NKE,
  NOC,
  NOW,
  NSC,
  NVDA,
  ORCL,
  OXY,
  PEG,
  PEP,
  PFE,
  PG,
  PM,
  PNC,
  PPL,
  PSX,
  PYPL,
  QCOM,
  RCL,
  ROST,
  RTX,
  SBUX,
  SCHW,
  SLB,
  SO,
  SPGI,
  SRE,
  STZ,
  SYY,
  TFC,
  TGT,
  TJX,
  TMO,
  TRGP,
  TSLA,
  TXN,
  UNH,
  UNP,
  UPS,
  USB,
  V,
  VLO,
  VRTX,
  WEC,
  WFC,
  WM,
  WMB,
  WMT,
  XEL,
  XOM,
  YUM,
  ZTS,
}

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

function getPositionResult(pick: DraftPick): PositionResult {
  const prices = HISTORICAL_DATA[pick.ticker]

  if (!prices || prices.length === 0) {
    return {
      sector: pick.sector,
      ticker: pick.ticker,
      dollarsAllocated: pick.dollarsAllocated,
      endingValue: 0,
      positionReturnPercent: 0,
      hasData: false,
    }
  }

  const buyPrice = prices[0]?.close
  const sellPrice = prices[prices.length - 1]?.close

  if (!buyPrice || buyPrice <= 0 || sellPrice === undefined || sellPrice < 0) {
    return {
      sector: pick.sector,
      ticker: pick.ticker,
      dollarsAllocated: pick.dollarsAllocated,
      endingValue: 0,
      positionReturnPercent: 0,
      hasData: false,
    }
  }

  const shares = pick.dollarsAllocated / buyPrice
  const endingValue = Math.round(shares * sellPrice * 100) / 100
  const positionReturnPercent =
    Math.round((((endingValue - pick.dollarsAllocated) / pick.dollarsAllocated) * 100) * 100) /
    100

  return {
    sector: pick.sector,
    ticker: pick.ticker,
    dollarsAllocated: pick.dollarsAllocated,
    endingValue,
    positionReturnPercent,
    hasData: true,
  }
}

function simulatePortfolio(portfolio: Portfolio): SimulationResult {
  const positions = portfolio
    .filter((pick) => pick.dollarsAllocated > 0)
    .map(getPositionResult)
    .filter((position) => position.hasData)

  const startingValue = positions.reduce((sum, position) => sum + position.dollarsAllocated, 0)
  const endingValue = positions.reduce((sum, position) => sum + position.endingValue, 0)

  if (startingValue === 0) {
    return {
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
    }
  }

  return {
    startingValue: Math.round(startingValue * 100) / 100,
    endingValue: Math.round(endingValue * 100) / 100,
    totalReturnPercent:
      Math.round((((endingValue - startingValue) / startingValue) * 100) * 100) / 100,
  }
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
    return portfolio.map(getPositionResult)
  }, [portfolio])

  const simulationResult = useMemo(() => {
    return simulatePortfolio(portfolio)
  }, [portfolio])

  const profitLoss = simulationResult
    ? simulationResult.endingValue - simulationResult.startingValue
    : 0
  const isPositive = profitLoss >= 0
  const hasPortfolio = portfolio.length > 0
  const validPositionCount = positionResults.filter((position) => position.hasData).length

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
                      {formatCurrency(simulationResult.startingValue || 10000)}
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
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Best for</p>
                <p className="mt-1 text-lg font-semibold">Reviewing conviction by sector</p>
              </div>
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
                    {formatCurrency(simulationResult.startingValue || 10000)}
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