import { describe, expect, it } from "vitest";

import { DRAFT_SESSION_VERSION, parseDraftSession, type DraftSession } from "./draft-session";

const VALID_SESSION: DraftSession = {
  version: DRAFT_SESSION_VERSION,
  season: {
    years: [1996, 2005],
    stockByYearAndSector: {
      1996: { Technology: { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" } },
      2005: { Technology: { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology" } },
    },
  } as DraftSession["season"],
  roundYears: [1996, 2005],
  picks: [{ sector: "Technology", ticker: "AAPL", year: 1996 }],
};

describe("parseDraftSession", () => {
  it("round-trips a session written by the draft page", () => {
    expect(parseDraftSession(JSON.stringify(VALID_SESSION))).toEqual(VALID_SESSION);
  });

  it("returns null for nothing stored", () => {
    expect(parseDraftSession(null)).toBeNull();
    expect(parseDraftSession("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseDraftSession("{not json")).toBeNull();
  });

  it("rejects a bare picks array, the shape older builds stored", () => {
    expect(parseDraftSession(JSON.stringify([{ sector: "Technology", ticker: "AAPL", year: 1996 }]))).toBeNull();
  });

  it("rejects a session from a different version", () => {
    expect(parseDraftSession(JSON.stringify({ ...VALID_SESSION, version: 1 }))).toBeNull();
  });

  it("rejects a session missing its season", () => {
    expect(parseDraftSession(JSON.stringify({ ...VALID_SESSION, season: undefined }))).toBeNull();
  });

  it("rejects a session whose picks aren't all well formed", () => {
    const corrupted = { ...VALID_SESSION, picks: [...VALID_SESSION.picks, { sector: "Technology" }] };

    expect(parseDraftSession(JSON.stringify(corrupted))).toBeNull();
  });
});
