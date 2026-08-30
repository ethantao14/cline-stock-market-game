import { Card, CardContent } from "@/components/ui/card";
import { STARTING_BUDGET } from "@/lib/draft-reducer";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function BudgetMeter({ remainingBudget }: { remainingBudget: number }) {
  const spent = STARTING_BUDGET - remainingBudget;
  const spentPercent = Math.min(100, Math.max(0, (spent / STARTING_BUDGET) * 100));

  return (
    <Card className="border-white/70 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Remaining budget</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(remainingBudget)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{formatCurrency(spent)} allocated</span>
          <span>{formatCurrency(STARTING_BUDGET)} total</span>
        </div>
      </CardContent>
    </Card>
  );
}
