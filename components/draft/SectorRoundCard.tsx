"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STARTING_PRICES } from "@/data/starting-prices";
import type { Sector, Stock } from "@/lib/types";

import { StockOptionButton } from "./StockOptionButton";

interface SectorRoundCardProps {
  sector: Sector;
  stocks: Stock[];
  year: 2019 | 2020 | 2021 | 2022;
  remainingBudget: number;
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

export function SectorRoundCard({
  sector,
  stocks,
  year,
  remainingBudget,
  showStartingPrice,
  onDraftPick,
}: SectorRoundCardProps) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const parsedAmount = Number(amountInput);
  const isAmountValid =
    amountInput.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= remainingBudget;
  const canDraft = selectedTicker !== null && isAmountValid;

  function handleDraft() {
    if (!selectedTicker || !isAmountValid) {
      return;
    }

    onDraftPick(selectedTicker, parsedAmount);
    setSelectedTicker(null);
    setAmountInput("");
  }

  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <CardTitle className="text-2xl">{sector}</CardTitle>
        <CardDescription>
          Pick a stock for {year}. You have {formatCurrency(remainingBudget)} left to allocate.
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

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="pick-amount" className="text-sm font-medium text-slate-600">
              Dollars to allocate
            </label>
            <input
              id="pick-amount"
              type="number"
              min={0}
              max={remainingBudget}
              step="1"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="0"
              className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-300"
            />
          </div>
          <Button onClick={handleDraft} disabled={!canDraft}>
            Draft this pick
          </Button>
        </div>

        {amountInput.trim() !== "" && !isAmountValid ? (
          <p className="text-sm text-rose-600">
            Enter an amount greater than $0 and no more than {formatCurrency(remainingBudget)}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
