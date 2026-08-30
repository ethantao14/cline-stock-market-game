import { cn } from "@/lib/utils";
import type { Sector } from "@/lib/types";

interface DraftProgressIndicatorProps {
  sectors: Sector[];
  roundIndex: number;
}

export function DraftProgressIndicator({ sectors, roundIndex }: DraftProgressIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sectors.map((sector, index) => (
        <span
          key={sector}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            index < roundIndex
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : index === roundIndex
                ? "border-slate-900 bg-white text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100"
                : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500",
          )}
        >
          {sector}
        </span>
      ))}
    </div>
  );
}
