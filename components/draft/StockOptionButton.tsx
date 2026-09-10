import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface StockOptionButtonProps {
  stock: Stock;
  isSelected: boolean;
  disabled?: boolean;
  startingPrice?: number;
  startingPriceYear?: number;
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
  startingPriceYear,
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
          ? "cursor-not-allowed border-border/60 bg-muted text-muted-foreground opacity-50"
          : isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/60 bg-card text-card-foreground hover:border-primary/50",
      )}
    >
      <span className="text-sm font-semibold">{stock.ticker}</span>
      <span
        className={cn(
          "text-xs",
          disabled
            ? "text-muted-foreground"
            : isSelected
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
        )}
      >
        {stock.name}
      </span>
      {startingPrice !== undefined ? (
        <span
          className={cn(
            "text-xs",
            disabled
              ? "text-muted-foreground"
              : isSelected
                ? "text-primary-foreground/70"
                : "text-muted-foreground",
          )}
        >
          {formatPrice(startingPrice)}{startingPriceYear !== undefined ? ` as of Jan ${startingPriceYear}` : ""}
        </span>
      ) : null}
    </button>
  );
}
