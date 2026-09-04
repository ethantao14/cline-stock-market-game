import { STARTING_PRICES } from "@/data/starting-prices";
import { cn } from "@/lib/utils";
import type { Sector, Stock } from "@/lib/types";

import { StockOptionButton } from "./StockOptionButton";

interface SectorDisplayProps {
  sector: Sector;
  stocks: Stock[];
  isLocked: boolean;
  selectedTicker: string | null;
  showStartingPrice: boolean;
  onSelectStock: (ticker: string) => void;
}

export function SectorDisplay({
  sector,
  stocks,
  isLocked,
  selectedTicker,
  showStartingPrice,
  onSelectStock,
}: SectorDisplayProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border bg-white/85 p-5 shadow-sm transition-opacity dark:bg-slate-900/85",
        isLocked
          ? "border-slate-200/80 opacity-60 dark:border-slate-800"
          : "border-white/70 dark:border-slate-800",
      )}
      aria-label={`${sector} sector`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{sector}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isLocked ? "Locked this draft — these are the stocks you could have had this round." : "Choose one of these three stocks."}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
            isLocked
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
          )}
        >
          {isLocked ? "Locked" : "Open"}
        </span>
      </div>

      <div className="grid gap-3">
        {stocks.map((stock) => (
          <StockOptionButton
            key={stock.ticker}
            stock={stock}
            isSelected={!isLocked && selectedTicker === stock.ticker}
            disabled={isLocked}
            startingPrice={showStartingPrice ? STARTING_PRICES[stock.ticker] : undefined}
            onSelect={() => onSelectStock(stock.ticker)}
          />
        ))}
      </div>
    </section>
  );
}