import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface StockOptionButtonProps {
  stock: Stock;
  isSelected: boolean;
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
  startingPrice,
  onSelect,
}: StockOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-colors",
        isSelected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-400",
      )}
    >
      <span className="text-sm font-semibold">{stock.ticker}</span>
      <span className={cn("text-xs", isSelected ? "text-slate-200" : "text-slate-500")}>
        {stock.name}
      </span>
      {startingPrice !== undefined ? (
        <span className={cn("text-xs", isSelected ? "text-slate-300" : "text-slate-400")}>
          {formatPrice(startingPrice)} as of Jan 2022
        </span>
      ) : null}
    </button>
  );
}
