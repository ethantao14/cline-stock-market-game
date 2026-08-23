import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Portfolio } from "@/lib/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function PortfolioSummarySidebar({ picks }: { picks: Portfolio }) {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <CardTitle>Your picks so far</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {picks.length === 0 ? (
          <p className="text-sm text-slate-400">No picks yet. Make your first pick to see it here.</p>
        ) : (
          picks.map((pick) => (
            <div
              key={pick.sector}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div>
                <Badge variant="outline" className="mb-1">
                  {pick.sector}
                </Badge>
                <p className="text-sm font-semibold text-slate-900">{pick.ticker}</p>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(pick.dollarsAllocated)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
