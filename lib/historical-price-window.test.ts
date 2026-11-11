// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  findPriceForMonth,
  getHoldingWindowForPick,
  getJanuaryOpeningPriceForYear,
} from "./historical-price-window";

describe("findPriceForMonth", () => {
  const prices = [
    { date: "2004-03-15", close: 9 },
    { date: "2005-03-17", close: 12 },
    { date: "2005-11-01", close: 18 },
  ];

  it("matches the year and zero-padded month regardless of day", () => {
    expect(findPriceForMonth(prices, 2005, 3)).toBe(prices[1]);
    expect(findPriceForMonth(prices, 2005, 11)).toBe(prices[2]);
  });

  it("returns undefined when the month or year is absent", () => {
    expect(findPriceForMonth(prices, 2005, 4)).toBeUndefined();
    expect(findPriceForMonth(prices, 2006, 3)).toBeUndefined();
    expect(findPriceForMonth([], 2005, 3)).toBeUndefined();
  });

  it("returns the first entry when a month appears twice", () => {
    const duplicates = [
      { date: "2005-03-20", close: 12 },
      { date: "2005-03-01", close: 99 },
    ];

    expect(findPriceForMonth(duplicates, 2005, 3)).toBe(duplicates[0]);
  });
});

describe("getHoldingWindowForPick", () => {
  it("returns exactly 121 months in order with the supplied endpoint closes", () => {
    const prices = [
      { date: "2015-02-01", close: 999 },
      { date: "2015-01-16", close: 75 },
      { date: "2005-01-12", close: 10 },
      { date: "2004-12-01", close: 1 },
    ];

    const holdingWindow = getHoldingWindowForPick(prices, 2005);
    const expectedMonths: string[] = [];
    for (let year = 2005; year < 2015; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        expectedMonths.push(`${year}-${String(month).padStart(2, "0")}`);
      }
    }
    expectedMonths.push("2015-01");

    expect(holdingWindow).toHaveLength(121);
    expect(holdingWindow.map((point) => point.date.slice(0, 7))).toEqual(expectedMonths);
    expect(holdingWindow[0]).toEqual(prices[2]);
    expect(holdingWindow.slice(1, 120).every((point) => point.close === 10)).toBe(true);
    expect(holdingWindow[120]).toEqual(prices[1]);
  });

  it("fills a missing middle month with the previous close and the first day", () => {
    const prices = [
      { date: "2005-01-10", close: 10 },
      { date: "2005-02-18", close: 25 },
      { date: "2005-04-21", close: 40 },
      { date: "2015-01-08", close: 80 },
    ];

    const holdingWindow = getHoldingWindowForPick(prices, 2005);

    expect(holdingWindow[1]).toEqual(prices[1]);
    expect(holdingWindow[2]).toEqual({ date: "2005-03-01", close: 25 });
    expect(holdingWindow[3]).toEqual(prices[2]);
  });

  it.each([
    { name: "starting January", missingDate: "2005-01-01" },
    { name: "ending January", missingDate: "2015-01-01" },
  ])("returns an empty window without $name", ({ missingDate }) => {
    const prices = [
      { date: "2004-12-01", close: 9 },
      { date: "2005-01-01", close: 10 },
      { date: "2005-02-01", close: 11 },
      { date: "2014-12-01", close: 79 },
      { date: "2015-01-01", close: 80 },
      { date: "2015-02-01", close: 81 },
    ].filter((point) => point.date !== missingDate);

    expect(getHoldingWindowForPick(prices, 2005)).toEqual([]);
  });

  it("keeps the first entry for duplicate months, including endpoints", () => {
    const prices = [
      { date: "2005-01-20", close: 10 },
      { date: "2005-01-01", close: 99 },
      { date: "2005-02-20", close: 25 },
      { date: "2005-02-01", close: 99 },
      { date: "2015-01-20", close: 80 },
      { date: "2015-01-01", close: 99 },
    ];

    const holdingWindow = getHoldingWindowForPick(prices, 2005);

    expect(holdingWindow[0]).toEqual(prices[0]);
    expect(holdingWindow[1]).toEqual(prices[2]);
    expect(holdingWindow[2]).toEqual({ date: "2005-03-01", close: 25 });
    expect(holdingWindow[120]).toEqual(prices[4]);
  });
});

describe("getJanuaryOpeningPriceForYear", () => {
  it("returns the January close for the requested year, including zero", () => {
    const prices = [
      { date: "2004-01-01", close: 9 },
      { date: "2005-01-18", close: 12 },
      { date: "2006-01-03", close: 0 },
    ];

    expect(getJanuaryOpeningPriceForYear(prices, 2005)).toBe(12);
    expect(getJanuaryOpeningPriceForYear(prices, 2006)).toBe(0);
  });

  it("returns null when January is absent", () => {
    const prices = [
      { date: "2004-01-01", close: 9 },
      { date: "2005-02-01", close: 12 },
    ];

    expect(getJanuaryOpeningPriceForYear(prices, 2005)).toBeNull();
    expect(getJanuaryOpeningPriceForYear([], 2005)).toBeNull();
  });
});
