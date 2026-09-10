import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Portfolio } from "@/lib/types";

export function PortfolioSummarySidebar({ picks }: { picks: Portfolio }) {
  return (
    <Card className="border-border/60 bg-card/85">
      <CardHeader>
        <CardTitle>Your picks so far</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No picks yet. Make your first pick to see it here.</p>
        ) : (
          picks.map((pick) => (
            <div
              key={pick.sector}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/60 px-4 py-3"
            >
              <div>
                <Badge variant="outline" className="mb-1">
                  {pick.sector}
                </Badge>
                <p className="text-sm font-semibold text-card-foreground">{pick.ticker}</p>
                <p className="text-xs text-muted-foreground">Simulation year: {pick.year}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
