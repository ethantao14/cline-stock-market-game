import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface StockOptionButtonProps {
  stock: Stock;
  isSelected: boolean;
  disabled?: boolean;
  startingPrice?: number;
  onSelect: () => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function StockOptionButton({
  stock,
  isSelected,
  disabled = false,
  startingPrice,
  onSelect,
}: StockOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
          : isSelected
            ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
            : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500",
      )}
    >
      <span className="text-sm font-semibold">{stock.ticker}</span>
      <span
        className={cn(
          "text-xs",
          disabled
            ? "text-slate-400 dark:text-slate-500"
            : isSelected
              ? "text-slate-200 dark:text-slate-800"
              : "text-slate-500 dark:text-slate-400",
        )}
      >
        {stock.name}
      </span>
      {startingPrice !== undefined ? (
        <span
          className={cn(
            "text-xs",
            disabled
              ? "text-slate-400 dark:text-slate-500"
              : isSelected
                ? "text-slate-300 dark:text-slate-700"
                : "text-slate-400 dark:text-slate-500",
          )}
        >
          {formatPrice(startingPrice)} as of Jan 2022
        </span>
      ) : null}
    </button>
  );
}
