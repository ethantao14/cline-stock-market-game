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
              ? "border-primary bg-primary text-primary-foreground"
              : index === roundIndex
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-muted/60 text-muted-foreground",
          )}
        >
          {sector}
        </span>
      ))}
    </div>
  );
}
