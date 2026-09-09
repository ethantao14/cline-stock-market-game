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

function makeHoldingWindow(startYear: number, startClose: number, endClose: number): Array<{ date: string; close: number }> {
  const values = Array.from({ length: 132 }, (_, index) => {
    if (index === 0) return startClose;
    if (index === 131) return endClose;
    return endClose;
  });

  return values.map((close, index) => {
    const year = startYear + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return { date: `${year}-${String(month).padStart(2, "0")}-01`, close };
  });
}

function setHistoricalData(ticker: string, prices: Array<{ date: string; close: number }>): void {
  mockFiles.set(`${ticker}.json`, JSON.stringify(prices));
}

describe("simulate", () => {
  beforeEach(() => {
    mockFiles.clear();
    readFileSyncMock.mockClear();
    vi.restoreAllMocks();
  });

  it("calculates the equal-weight mean of per-position percent changes", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Healthcare", ticker: "JNJ", year: 2005 },
      { sector: "Energy", ticker: "XOM", year: 2005 },
    ];

    setHistoricalData("AAPL", makeHoldingWindow(2005, 100, 110));
    setHistoricalData("JNJ", makeHoldingWindow(2005, 50, 40));
    setHistoricalData("XOM", makeHoldingWindow(2005, 75, 90));

    expect(simulate(portfolio)).toEqual({ totalReturnPercent: 3.33 });
  });

  it("returns zero for an empty portfolio", () => {
    expect(simulate([])).toEqual({ totalReturnPercent: 0 });
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("calculates a single stock position correctly", () => {
    setHistoricalData("MSFT", makeHoldingWindow(2005, 250, 200));

    const portfolio: Portfolio = [{ sector: "Technology", ticker: "MSFT", year: 2005 }];
    expect(simulate(portfolio)).toEqual({ totalReturnPercent: -20 });
  });

  it("excludes positions whose historical data file is missing from the average", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setHistoricalData("AAPL", makeHoldingWindow(2005, 100, 120));

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2005 },
      { sector: "Financials", ticker: "MISSING", year: 2005 },
    ];

    expect(simulate(portfolio)).toEqual({ totalReturnPercent: 20 });
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});