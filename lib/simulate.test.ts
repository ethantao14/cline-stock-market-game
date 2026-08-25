import { beforeEach, describe, expect, it, vi } from "vitest";

import { STARTING_BUDGET } from "./draft-reducer";
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

  it("calculates portfolio performance for multiple stocks", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2022, dollarsAllocated: 500 },
      { sector: "Energy", ticker: "XOM", year: 2022, dollarsAllocated: 1500 },
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

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 10300,
      totalReturnPercent: 3,
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
    setHistoricalData(2022, "MSFT", [
      { date: "2022-01-03", close: 250 },
      { date: "2022-06-01", close: 275 },
      { date: "2022-12-30", close: 200 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "MSFT", year: 2022, dollarsAllocated: 1000 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 9800,
      totalReturnPercent: -2,
    });
  });

  it("skips positions whose historical data file is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 120 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Financials", ticker: "MISSING", year: 2022, dollarsAllocated: 500 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 9700,
      totalReturnPercent: -3,
    });
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("counts unspent budget at face value in the ending total", () => {
    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 150 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 500 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 10250,
      totalReturnPercent: 2.5,
    });
  });
});