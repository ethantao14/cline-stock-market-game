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
    <div className="rounded-2xl bg-white/5 p-4 dark:bg-white/10">
      <p className="text-sm text-slate-400 dark:text-slate-500">Your rank</p>
      <p className="mt-1 text-lg font-semibold">
        You beat {rank.percentile}% of random drafts{" "}
        <span className="text-slate-400 dark:text-slate-500">({getRankTier(rank.percentile)})</span>
      </p>
      <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
        Random drafts with your same picks&apos; sectors, years, and allocations typically
        returned {formatSignedPercent(rank.medianReturnPercent)}.
      </p>
    </div>
  )
}
