import type { SimulationYear } from "./draft-reducer";
import type { Season } from "./season";
import type { DraftPick, Portfolio } from "./types";

export const DRAFT_SESSION_STORAGE_KEY = "portfolio";
export const DRAFT_SESSION_VERSION = 2;

// The whole playthrough, not just the picks: the results page needs the season
// and the round years to show what a spent sector was offering afterwards.
export interface DraftSession {
  version: typeof DRAFT_SESSION_VERSION;
  season: Season;
  roundYears: SimulationYear[];
  picks: Portfolio;
}

function isDraftPick(value: unknown): value is DraftPick {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pick = value as Record<string, unknown>;

  return typeof pick.sector === "string" && typeof pick.ticker === "string" && typeof pick.year === "number";
}

function isSeason(value: unknown): value is Season {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const season = value as Record<string, unknown>;

  return (
    Array.isArray(season.years) &&
    season.years.every((year) => typeof year === "number") &&
    typeof season.stockByYearAndSector === "object" &&
    season.stockByYearAndSector !== null
  );
}

// Anything that isn't a current-version session reads as no session at all,
// so a draft stored by an older build shows the empty state instead of
// rendering against a shape that no longer exists.
export function parseDraftSession(rawSession: string | null): DraftSession | null {
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const session = parsed as Record<string, unknown>;

    if (session.version !== DRAFT_SESSION_VERSION || !isSeason(session.season)) {
      return null;
    }

    if (!Array.isArray(session.roundYears) || !session.roundYears.every((year) => typeof year === "number")) {
      return null;
    }

    if (!Array.isArray(session.picks) || !session.picks.every(isDraftPick)) {
      return null;
    }

    return {
      version: DRAFT_SESSION_VERSION,
      season: session.season,
      roundYears: session.roundYears as SimulationYear[],
      picks: session.picks,
    };
  } catch {
    return null;
  }
}
