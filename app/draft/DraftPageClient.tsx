"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PortfolioSummarySidebar } from "@/components/draft/PortfolioSummarySidebar";
import { SectorDisplay } from "@/components/draft/SectorDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/data/sectors";
import { DraftProvider, useDraft } from "@/lib/draft-context";
import {
  getCurrentRoundBoard,
  getLockedSectors,
  getRemainingPicks,
  type SimulationYear,
} from "@/lib/draft-reducer";
import {
  DRAFT_SESSION_STORAGE_KEY,
  DRAFT_SESSION_VERSION,
  type DraftSession,
} from "@/lib/draft-session";
import { buildSeason, drawRoundYears, type AvailableStocksByYearAndSector } from "@/lib/season";
import { cn } from "@/lib/utils";
import type { Sector } from "@/lib/types";

const YEAR_BADGE_STYLE_VALUES = [
  "border-violet-200 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-card text-violet-700 dark:border-violet-500/30 dark:text-violet-300",
  "border-sky-200 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-card text-sky-700 dark:border-sky-500/30 dark:text-sky-300",
  "border-emerald-200 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-card text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300",
  "border-amber-200 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-card text-amber-700 dark:border-amber-500/30 dark:text-amber-300",
] as const;

function getYearBadgeStyle(year: SimulationYear): string {
  return YEAR_BADGE_STYLE_VALUES[year % YEAR_BADGE_STYLE_VALUES.length];
}

function DraftBoard({
  availableStocksByYearAndSector,
  showStartingPrice,
}: {
  availableStocksByYearAndSector: AvailableStocksByYearAndSector;
  showStartingPrice: boolean;
}) {
  const router = useRouter();
  const { state, dispatch } = useDraft();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const currentRound = getCurrentRoundBoard(state);
  const lockedSectors = useMemo(() => getLockedSectors(state), [state]);
  // Each locked sector was spent in a specific round year; keep that around so
  // the locked card can say both what's sitting there now and when you spent it.
  const spentYearBySector = useMemo(
    () => new Map(state.picks.map((pick) => [pick.sector, pick.year])),
    [state.picks],
  );
  const remainingPicks = getRemainingPicks(state);
  const availableUnlockedSectors = useMemo(
    () => SECTORS.filter((sector) => !lockedSectors.includes(sector)),
    [lockedSectors],
  );
  const resolvedSelectedSector =
    selectedSector && availableUnlockedSectors.includes(selectedSector)
      ? selectedSector
      : null;
  const resolvedSelectedTicker =
    resolvedSelectedSector && currentRound
      ? (selectedSector === resolvedSelectedSector &&
        selectedTicker &&
        currentRound.stockBySector[resolvedSelectedSector]?.ticker === selectedTicker
          ? selectedTicker
          : null)
      : null;
  const canConfirmPick = Boolean(currentRound && resolvedSelectedSector && resolvedSelectedTicker);

  useEffect(() => {
    if (state.isComplete) {
      router.push("/results");
    }
  }, [router, state.isComplete]);

  useEffect(() => {
    if (!state.season) {
      return;
    }

    const session: DraftSession = {
      version: DRAFT_SESSION_VERSION,
      season: state.season,
      roundYears: state.roundYears,
      picks: state.picks,
    };

    window.localStorage.setItem(DRAFT_SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [state.picks, state.roundYears, state.season]);

  useEffect(() => {
    // Drawn in an effect rather than during render: the season is random, and
    // generating it while rendering would produce different stocks on the
    // server and the client, which is a hydration mismatch on every load.
    if (state.season) {
      return;
    }

    const season = buildSeason(availableStocksByYearAndSector);

    dispatch({ type: "START_GAME", season, roundYears: drawRoundYears(season.years) });
  }, [availableStocksByYearAndSector, dispatch, state.season]);

  function handleResetDraft() {
    dispatch({ type: "RESET_DRAFT" });
    window.localStorage.removeItem(DRAFT_SESSION_STORAGE_KEY);
    setSelectedSector(null);
    setSelectedTicker(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectStock(sector: Sector, ticker: string) {
    if (lockedSectors.includes(sector)) {
      return;
    }

    setSelectedSector(sector);
    setSelectedTicker(ticker);
  }

  function handleFocusSector(sector: Sector) {
    if (lockedSectors.includes(sector)) {
      return;
    }

    setSelectedSector(sector);
  }

  const handleConfirmPick = useCallback(() => {
    if (!currentRound || !resolvedSelectedSector || !resolvedSelectedTicker) {
      return;
    }

    dispatch({
      type: "SELECT_PICK",
      sector: resolvedSelectedSector,
      ticker: resolvedSelectedTicker,
    });

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setSelectedSector(null);
    setSelectedTicker(null);
  }, [currentRound, dispatch, resolvedSelectedSector, resolvedSelectedTicker]);

  useEffect(() => {
    if (!canConfirmPick) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      handleConfirmPick();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canConfirmPick, handleConfirmPick]);

  if (!currentRound) {
    return (
      <Card className="border-border/60 bg-card/85">
        <CardHeader>
          <CardTitle>Loading draft board</CardTitle>
          <CardDescription>Generating this round’s year and sector stock options.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleResetDraft} disabled={state.picks.length === 0}>
            Reset Draft
          </Button>
        </div>

        <Card className="overflow-hidden border-border/60 bg-card/85">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((sector) => {
                  const isLocked = lockedSectors.includes(sector);
                  const isSelectedSector = !isLocked && resolvedSelectedSector === sector;

                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => handleFocusSector(sector)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isLocked
                          ? "border-primary bg-primary text-primary-foreground"
                          : isSelectedSector
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-muted/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                      aria-pressed={isSelectedSector}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  "rounded-[2rem] border p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]",
                  getYearBadgeStyle(currentRound.year),
                )}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] opacity-80">Round Year</p>
                    <p className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">Picking for {currentRound.year}</p>
                    <p className="mt-4 text-base text-muted-foreground">
                      Your picks in this round will be evaluated using {currentRound.year} historical performance.
                    </p>
                  </div>
                  <div className="self-start rounded-full border border-border/60 bg-card/80 px-6 py-3 text-xl font-semibold shadow-sm">
                    Year {currentRound.year}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
                <p>All 8 sectors are visible at once. Locked sectors show what you could&apos;ve had this round.</p>
                <div className="flex gap-4">
                  <p>
                    Picks made: <span className="font-semibold text-foreground">{state.picks.length}</span> / {SECTORS.length}
                  </p>
                  <p>
                    Remaining picks: <span className="font-semibold text-foreground">{remainingPicks}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {SECTORS.map((sector) => (
                <SectorDisplay
                  key={`${currentRound.year}-${sector}-${state.picks.length}`}
                  sector={sector}
                  stock={currentRound.stockBySector[sector]}
                  isLocked={lockedSectors.includes(sector)}
                  currentYear={currentRound.year}
                  spentYear={spentYearBySector.get(sector)}
                  selectedTicker={resolvedSelectedSector === sector ? resolvedSelectedTicker : null}
                  showStartingPrice={showStartingPrice}
                  onSelectStock={(ticker) => handleSelectStock(sector, ticker)}
                />
              ))}
            </div>

            <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/60 p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Finalize this pick</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selected sector: <span className="font-semibold text-foreground">{resolvedSelectedSector ?? "None"}</span>
                    {" · "}
                    Selected stock: <span className="font-semibold text-foreground">{resolvedSelectedTicker ?? "None"}</span>
                  </p>
                </div>
                <Button onClick={handleConfirmPick} disabled={!canConfirmPick}>
                  Confirm Draft Pick
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <PortfolioSummarySidebar picks={state.picks} />
      </div>
    </div>
  );
}

function DraftPageContent({ availableStocksByYearAndSector }: { availableStocksByYearAndSector: AvailableStocksByYearAndSector }) {
  const searchParams = useSearchParams();
  const isInformed = searchParams.get("mode") === "informed";

  return (
    <main
      className="min-h-screen px-6 py-10 md:px-10 md:py-14"
      style={{ backgroundImage: "var(--page-bg)" }}
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {isInformed ? "Informed Draft" : "Blind Draft"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Build Your Portfolio
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            {isInformed
              ? "See all 8 sectors every round, compare the fresh stock board, and live with the regret of what locked sectors could have offered you next."
              : "Every round reveals a new year and a fresh 8-sector board. Once you lock a sector, it stays visible only as a greyed-out reminder of what you passed up later."}
          </p>
        </div>
        <DraftProvider>
          <DraftBoard availableStocksByYearAndSector={availableStocksByYearAndSector} showStartingPrice={isInformed} />
        </DraftProvider>
      </div>
    </main>
  );
}

export function DraftPageClient({ availableStocksByYearAndSector }: { availableStocksByYearAndSector: AvailableStocksByYearAndSector }) {
  return (
    <Suspense fallback={null}>
      <DraftPageContent availableStocksByYearAndSector={availableStocksByYearAndSector} />
    </Suspense>
  );
}