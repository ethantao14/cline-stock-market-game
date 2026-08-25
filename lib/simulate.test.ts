import { beforeEach, describe, expect, it, vi } from "vitest";

import { STARTING_BUDGET } from "./draft-reducer";
import type { Portfolio } from "./types";

const mockFiles = new Map<string, string>();
const readFileSyncMock = vi.fn((filePath: string | Buffer | URL) => {
  const normalizedPath = filePath.toString();
  const parts = normalizedPath.split("/");
  const fileName = parts.at(-1);
  const year = parts.at(-2);
  const fileKey = year && fileName ? `${year}/${fileName}` : fileName;

  if (fileKey && mockFiles.has(fileKey)) {
    return mockFiles.get(fileKey) as string;
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

  it("calculates portfolio performance for multiple stocks across multiple years", () => {
    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2020, dollarsAllocated: 1000 },
      { sector: "Healthcare", ticker: "JNJ", year: 2021, dollarsAllocated: 500 },
      { sector: "Energy", ticker: "XOM", year: 2022, dollarsAllocated: 1500 },
    ];

    setHistoricalData(2020, "AAPL", [
      { date: "2020-01-02", close: 100 },
      { date: "2020-12-31", close: 110 },
    ]);
    setHistoricalData(2021, "JNJ", [
      { date: "2021-01-04", close: 50 },
      { date: "2021-12-31", close: 40 },
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
      positions: [
        {
          sector: "Technology",
          ticker: "AAPL",
          year: 2020,
          dollarsAllocated: 1000,
          endingValue: 1100,
          positionReturnPercent: 10,
          hasData: true,
        },
        {
          sector: "Healthcare",
          ticker: "JNJ",
          year: 2021,
          dollarsAllocated: 500,
          endingValue: 400,
          positionReturnPercent: -20,
          hasData: true,
        },
        {
          sector: "Energy",
          ticker: "XOM",
          year: 2022,
          dollarsAllocated: 1500,
          endingValue: 1800,
          positionReturnPercent: 20,
          hasData: true,
        },
      ],
      missingDataPicks: [],
    });
  });

  it("returns zeroes for an empty portfolio", () => {
    const result = simulate([]);

    expect(result).toEqual({
      startingValue: 0,
      endingValue: 0,
      totalReturnPercent: 0,
      positions: [],
      missingDataPicks: [],
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
      positions: [
        {
          sector: "Technology",
          ticker: "MSFT",
          year: 2022,
          dollarsAllocated: 1000,
          endingValue: 800,
          positionReturnPercent: -20,
          hasData: true,
        },
      ],
      missingDataPicks: [],
    });
  });

  it("marks positions with missing historical data and continues the simulation", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setHistoricalData(2022, "AAPL", [
      { date: "2022-01-03", close: 100 },
      { date: "2022-12-30", close: 120 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2022, dollarsAllocated: 1000 },
      { sector: "Financials", ticker: "MISSING", year: 2019, dollarsAllocated: 500 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 9700,
      totalReturnPercent: -3,
      positions: [
        {
          sector: "Technology",
          ticker: "AAPL",
          year: 2022,
          dollarsAllocated: 1000,
          endingValue: 1200,
          positionReturnPercent: 20,
          hasData: true,
        },
        {
          sector: "Financials",
          ticker: "MISSING",
          year: 2019,
          dollarsAllocated: 500,
          endingValue: 0,
          positionReturnPercent: 0,
          hasData: false,
        },
      ],
      missingDataPicks: [{ sector: "Financials", ticker: "MISSING", year: 2019 }],
    });
    expect(warnSpy).toHaveBeenCalledWith("No historical data for MISSING in 2019");
  });

  it("counts unspent budget at face value in the ending total", () => {
    setHistoricalData(2021, "AAPL", [
      { date: "2021-01-04", close: 100 },
      { date: "2021-12-31", close: 150 },
    ]);

    const portfolio: Portfolio = [
      { sector: "Technology", ticker: "AAPL", year: 2021, dollarsAllocated: 500 },
    ];

    const result = simulate(portfolio);

    expect(result).toEqual({
      startingValue: STARTING_BUDGET,
      endingValue: 10250,
      totalReturnPercent: 2.5,
      positions: [
        {
          sector: "Technology",
          ticker: "AAPL",
          year: 2021,
          dollarsAllocated: 500,
          endingValue: 750,
          positionReturnPercent: 50,
          hasData: true,
        },
      ],
      missingDataPicks: [],
    });
  });
});