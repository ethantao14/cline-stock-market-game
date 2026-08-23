import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Portfolio } from "./types";

const mockFiles = new Map<string, string>();
const readFileSyncMock = vi.fn((filePath: string | Buffer | URL) => {
  const normalizedPath = filePath.toString();
  const fileName = normalizedPath.split("/").pop();

  if (fileName && mockFiles.has(fileName)) {
    return mockFiles.get(fileName) as string;
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
  ticker: string,
  prices: Array<{ date: string; close: number }>,
): void {
  mockFiles.set(`${ticker}.json`, JSON.stringify(prices));
}

describe("simulate", () => {
  beforeEach(() => {
    mockFiles.clear();
    readFileSyncMock.mockClear();
    vi.restoreAllMocks();
  });

  it("calculates portfolio performance for multiple stocks", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", dollarsAllocated: 500 },
      { sector: "Energy", ticker: "XOM", dollarsAllocated: 1500 },
    ];

    setHistoricalData("AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 110 },
    ]);
    setHistoricalData("JNJ", [
      { date: "2022-01-03", close: 50 },
      { date: "2022-12-30", close: 40 },
    ]);
    setHistoricalData("XOM", [
      { date: "2022-01-03", close: 75 },
      { date: "2022-12-30", close: 90 },
    ]);

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: 3000,
      endingValue: 3300,
      totalReturnPercent: 10,
    });
  });

  it("returns zeroes for an empty portfolio", () => {
    const result = simulate([]);

    expect(result).toEqual({
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
    });
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("calculates a single stock position correctly", () => {
    setHistoricalData("MSFT", [
      { date: "2022-01-03", close: 250 },
      { date: "2022-06-01", close: 275 },
      { date: "2022-12-30", close: 200 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "MSFT", dollarsAllocated: 1000 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: 1000,
      endingValue: 800,
      totalReturnPercent: -20,
    });
  });

  it("skips positions whose historical data file is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setHistoricalData("AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 120 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", dollarsAllocated: 1000 },
      { sector: "Financials", ticker: "MISSING", dollarsAllocated: 500 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: 1000,
      endingValue: 1200,
      totalReturnPercent: 20,
    });
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});