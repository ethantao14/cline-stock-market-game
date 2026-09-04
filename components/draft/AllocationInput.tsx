"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MIN_ALLOCATION } from "@/lib/budget-validator";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const QUICK_STEP = 500;

interface AllocationInputProps {
  value: string;
  maxAllocation: number;
  remainingBudget: number;
  onChange: (value: string) => void;
}

export function AllocationInput({ value, maxAllocation, remainingBudget, onChange }: AllocationInputProps) {
  const parsedAmount = Number(value);
  const currentAllocation = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : MIN_ALLOCATION;
  const hasValue = value.trim() !== "";
  const isValid = hasValue && Number.isFinite(parsedAmount) && parsedAmount >= MIN_ALLOCATION && parsedAmount <= maxAllocation;

  function setAllocation(amount: number) {
    const nextAllocation = Math.max(MIN_ALLOCATION, Math.min(maxAllocation, amount));
    onChange(String(nextAllocation));
  }

  function adjustAllocation(delta: number) {
    const nextAllocation = Math.max(MIN_ALLOCATION, Math.min(maxAllocation, currentAllocation + delta));
    onChange(String(nextAllocation));
  }

  function handleInputChange(nextValue: string) {
    if (nextValue.trim() === "") {
      onChange(String(MIN_ALLOCATION));
      return;
    }

    const nextAmount = Number(nextValue);

    if (!Number.isFinite(nextAmount)) {
      return;
    }

    setAllocation(nextAmount);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="pick-allocation" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Dollars to allocate
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose between {formatCurrency(MIN_ALLOCATION)} and {formatCurrency(maxAllocation)}.
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Remaining budget: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(remainingBudget)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => adjustAllocation(-QUICK_STEP)}
          disabled={currentAllocation <= MIN_ALLOCATION}
          aria-label={`Subtract ${formatCurrency(QUICK_STEP)} from allocation`}
          className="gap-1.5"
        >
          <Minus className="size-3.5" />
          {formatCurrency(QUICK_STEP)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => adjustAllocation(QUICK_STEP)}
          disabled={currentAllocation >= maxAllocation}
          aria-label={`Add ${formatCurrency(QUICK_STEP)} to allocation`}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          {formatCurrency(QUICK_STEP)}
        </Button>
        <button
          type="button"
          onClick={() => setAllocation(MIN_ALLOCATION)}
          disabled={maxAllocation < MIN_ALLOCATION}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
        >
          Min
        </button>
        <button
          type="button"
          onClick={() => setAllocation(maxAllocation)}
          disabled={maxAllocation < MIN_ALLOCATION}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
        >
          Max
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <input
            id="pick-allocation"
            type="number"
            min={MIN_ALLOCATION}
            max={maxAllocation}
            step="500"
            value={value}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={String(MIN_ALLOCATION)}
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-slate-400 dark:focus-visible:ring-slate-700"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">Use the buttons or type a custom amount.</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Current allocation: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(currentAllocation)}</span>
        </p>
      </div>

      {hasValue && !isValid ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Enter an amount between {formatCurrency(MIN_ALLOCATION)} and {formatCurrency(maxAllocation)}.
        </p>
      ) : null}
    </div>
  );
}