import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Portfolio } from "./types";

const mockFiles = new Map<string, string>();
const readFileSyncMock = vi.fn((filePath: string | Buffer | URL) => {
  const normalizedPath = filePath.toString();
  const relativePath = normalizedPath.split("data/historical/")[1];

  if (relativePath && mockFiles.has(relativePath)) {
    return mockFiles.get(relativePath) as string;
  }

  throw new Error(`Missing file: ${normalizedPath}`);
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();

  return {
    ...actual,
    default: {
      ...actual,
      readFileSync: readFileSyncMock,
    },
    readFileSync: readFileSyncMock,
  };
});

const { simulate } = await import("./simulate");

function setHistoricalData(
  year: number,
  ticker: string,
  prices: Array<{ date: string; close: number }>,
): void {
  mockFiles.set(`${year}/${ticker}.json`, JSON.stringify(prices));
}

describe("simulate", () => {
  beforeEach(() => {
    mockFiles.clear();
    readFileSyncMock.mockClear();
    vi.restoreAllMocks();
  });

  it("calculates the equal-weight mean of per-position percent changes", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022 },
      { sector: "Energy", ticker: "XOM", year: 2022 },
    ];

    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 110 },
    ]);
    setHistoricalData(2022, "JNJ", [
      { date: "2022-01-03", close: 50 },
      { date: "2022-12-30", close: 40 },
    ]);
    setHistoricalData(2022, "XOM", [
      { date: "2022-01-03", close: 75 },
      { date: "2022-12-30", close: 90 },
    ]);

    const result = simulate(portfolio);

    // AAPL +10%, JNJ -20%, XOM +20% => equal-weight mean = 10/3 = 3.33
    expect(result).toEqual({
      totalReturnPercent: 3.33,
    });
  });

  it("returns zero for an empty portfolio", () => {
    const result = simulate([]);

    expect(result).toEqual({
      totalReturnPercent: 0,
    });
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("calculates a single stock position correctly", () => {
    setHistoricalData(2022, "MSFT", [
      { date: "2022-01-03", close: 250 },
      { date: "2022-06-01", close: 275 },
      { date: "2022-12-30", close: 200 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "MSFT", year: 2022 },
    ];

    const result = simulate(portfolio);

    // MSFT 250 -> 200 = -20%
    expect(result).toEqual({
      totalReturnPercent: -20,
    });
  });

  it("excludes positions whose historical data file is missing from the average", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 120 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
      { sector: "Financials", ticker: "MISSING", year: 2022 },
    ];

    const result = simulate(portfolio);

    // Only AAPL counts: +20% (MISSING excluded, not counted as zero)
    expect(result).toEqual({
      totalReturnPercent: 20,
    });
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("computes a simple average when all positions have the same return", () => {
    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 110 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022 },
    ];

    const result = simulate(portfolio);

    // Single position: +10%
    expect(result).toEqual({
      totalReturnPercent: 10,
    });
  });
});