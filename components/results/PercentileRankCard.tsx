import type { RankResult } from "@/lib/rank"
import { getRankTier } from "@/lib/rank"

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function PercentileRankCard({ rank }: { rank: RankResult | null }) {
  if (!rank) {
    return null
  }

  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-sm text-muted-foreground">Your rank</p>
      <p className="mt-1 text-lg font-semibold">
        You beat {rank.percentile}% of random drafts{" "}
        <span className="text-muted-foreground">({getRankTier(rank.percentile)})</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Drafts that played your rounds in a random sector order typically
        returned {formatSignedPercent(rank.medianReturnPercent)}.
      </p>
    </div>
  )
}
