"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STARTING_PRICES } from "@/data/starting-prices";
import { MIN_ALLOCATION } from "@/lib/budget-validator";
import type { Sector, Stock } from "@/lib/types";

import { StockOptionButton } from "./StockOptionButton";

interface SectorRoundCardProps {
  sector: Sector;
  stocks: Stock[];
  year: 2019 | 2020 | 2021 | 2022;
  remainingBudget: number;
  maxAllocation: number;
  showStartingPrice: boolean;
  onDraftPick: (ticker: string, dollarsAllocated: number) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const QUICK_ALLOCATION_AMOUNTS = [500] as const;

export function SectorRoundCard({
  sector,
  stocks,
  year,
  remainingBudget,
  maxAllocation,
  showStartingPrice,
  onDraftPick,
}: SectorRoundCardProps) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const parsedAmount = Number(amountInput);
  const currentAllocation = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const isAmountValid =
    amountInput.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= MIN_ALLOCATION &&
    parsedAmount <= maxAllocation;
  const canDraft = selectedTicker !== null && isAmountValid;

  function handleDraft() {
    if (!selectedTicker || !isAmountValid) {
      return;
    }

    onDraftPick(selectedTicker, parsedAmount);
    setSelectedTicker(null);
    setAmountInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || !selectedTicker || !isAmountValid) {
      return;
    }

    event.preventDefault();
    handleDraft();
  }

  function handleQuickAllocation(delta: number) {
    const nextAllocation = Math.max(0, Math.min(maxAllocation, currentAllocation + delta));
    setAmountInput(String(nextAllocation));
  }

  return (
    <Card className="border-white/70 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85">
      <CardHeader>
        <CardTitle className="text-2xl">{sector}</CardTitle>
        <CardDescription>
          Pick a stock for {year}. Allocate between {formatCurrency(MIN_ALLOCATION)} and{" "}
          {formatCurrency(maxAllocation)} for this pick ({formatCurrency(remainingBudget)} left overall).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => (
            <StockOptionButton
              key={stock.ticker}
              stock={stock}
              isSelected={selectedTicker === stock.ticker}
              startingPrice={showStartingPrice ? STARTING_PRICES[stock.ticker] : undefined}
              onSelect={() => setSelectedTicker(stock.ticker)}
            />
          ))}
        </div>

        <div
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="pick-amount" className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Dollars to allocate
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Running total: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(currentAllocation)}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_ALLOCATION_AMOUNTS.map((quickAmount) => {
                  const wouldGoNegative = currentAllocation - quickAmount < 0;
                  const wouldExceedMax = currentAllocation + quickAmount > maxAllocation;

                  return (
                    <div key={quickAmount} className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAllocation(-quickAmount)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.stopPropagation();
                          }
                        }}
                        disabled={wouldGoNegative}
                        title={wouldGoNegative ? "Nothing left to remove" : `Subtract ${formatCurrency(quickAmount)}`}
                        aria-label={`Subtract ${formatCurrency(quickAmount)} from allocation`}
                        className="gap-1.5"
                      >
                        <Minus className="size-3.5" />
                        {formatCurrency(quickAmount)}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAllocation(quickAmount)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.stopPropagation();
                          }
                        }}
                        disabled={wouldExceedMax}
                        title={wouldExceedMax ? "Pick maximum reached" : `Add ${formatCurrency(quickAmount)}`}
                        aria-label={`Add ${formatCurrency(quickAmount)} to allocation`}
                        className="gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        {formatCurrency(quickAmount)}
                      </Button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAmountInput(String(MIN_ALLOCATION))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                    }
                  }}
                  disabled={maxAllocation < MIN_ALLOCATION}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  Min
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(maxAllocation))}
                  onKeyDown={(event) => {
                    // Stops this Enter press from bubbling to the parent's
                    // handleKeyDown, which would otherwise submit the draft with
                    // the amount already in the input before this button's own
                    // click (which sets the max amount) gets a chance to run.
                    if (event.key === "Enter") {
                      event.stopPropagation();
                    }
                  }}
                  disabled={maxAllocation < MIN_ALLOCATION}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  Max
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="pick-amount"
                  type="number"
                  min={MIN_ALLOCATION}
                  max={maxAllocation}
                  step="1"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  placeholder="0"
                  className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-slate-400 dark:focus-visible:ring-slate-700"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">Type a custom amount anytime.</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleDraft} disabled={!canDraft}>
                Draft this pick
              </Button>
            </div>
          </div>
        </div>

        {amountInput.trim() !== "" && !isAmountValid ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            Enter an amount between {formatCurrency(MIN_ALLOCATION)} and {formatCurrency(maxAllocation)}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
