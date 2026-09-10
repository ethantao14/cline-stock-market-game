import { STARTING_PRICES } from "@/data/starting-prices";
import { cn } from "@/lib/utils";
import type { SimulationYear } from "@/lib/draft-reducer";
import type { Sector, Stock } from "@/lib/types";

import { StockOptionButton } from "./StockOptionButton";

interface SectorDisplayProps {
  sector: Sector;
  stock: Stock | undefined;
  isLocked: boolean;
  // The year the player spent this sector, only present when isLocked.
  spentYear: SimulationYear | undefined;
  selectedTicker: string | null;
  showStartingPrice: boolean;
  onSelectStock: (ticker: string) => void;
}

export function SectorDisplay({
  sector,
  stock,
  isLocked,
  spentYear,
  selectedTicker,
  showStartingPrice,
  onSelectStock,
}: SectorDisplayProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border bg-card/85 p-5 shadow-sm transition-opacity",
        isLocked ? "border-border/60 opacity-60" : "border-border/60",
      )}
      aria-label={`${sector} sector${isLocked && spentYear !== undefined ? `, spent in ${spentYear}` : ""}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">{sector}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLocked
              ? spentYear !== undefined
                ? `You spent ${sector} in ${spentYear}. This is the stock sitting here this round — the one you passed on.`
                : "Already spent, this is the stock you could have had this round."
              : "This sector's stock for this year."}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
            isLocked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-muted/60 text-muted-foreground",
          )}
        >
          {isLocked ? (spentYear !== undefined ? `Spent in ${spentYear}` : "Locked") : "Open"}
        </span>
      </div>

      <div className="grid gap-3">
        {stock ? (
          <StockOptionButton
            stock={stock}
            isSelected={!isLocked && selectedTicker === stock.ticker}
            disabled={isLocked}
            startingPrice={showStartingPrice ? STARTING_PRICES[stock.ticker] : undefined}
            onSelect={() => onSelectStock(stock.ticker)}
          />
        ) : null}
      </div>
    </section>
  );
}