import { describe, expect, it } from "vitest";

import { selectStockOptions } from "./stock-selector";
import type { Stock } from "./types";

function stock(ticker: string): Stock {
  return { ticker, name: ticker, sector: "Technology" };
}

const FIVE_STOCKS: Stock[] = ["AAA", "BBB", "CCC", "DDD", "EEE"].map(stock);

function sequenceRandomFn(values: number[]): () => number {
  let callIndex = 0;

  return () => {
    const value = values[callIndex % values.length];
    callIndex++;
    return value;
  };
}

describe("selectStockOptions", () => {
  it("picks 3 options from a larger candidate pool", () => {
    const result = selectStockOptions(FIVE_STOCKS, sequenceRandomFn([0]));

    expect(result.map((s) => s.ticker)).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("samples without replacement, honoring each draw's shrinking pool", () => {
    const result = selectStockOptions(FIVE_STOCKS, sequenceRandomFn([0.999999]));

    expect(result.map((s) => s.ticker)).toEqual(["EEE", "DDD", "CCC"]);
  });

  it("returns every candidate when there are fewer than 3", () => {
    const twoStocks = FIVE_STOCKS.slice(0, 2);
    const result = selectStockOptions(twoStocks, sequenceRandomFn([0]));

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.ticker).sort()).toEqual(["AAA", "BBB"]);
  });

  it("returns an empty array for an empty candidate pool", () => {
    expect(selectStockOptions([], sequenceRandomFn([0]))).toEqual([]);
  });

  it("never returns duplicate tickers", () => {
    const result = selectStockOptions(FIVE_STOCKS, sequenceRandomFn([0.5]));
    const tickers = result.map((s) => s.ticker);

    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("defaults to Math.random when no randomFn is provided", () => {
    const result = selectStockOptions(FIVE_STOCKS);

    expect(result).toHaveLength(3);
  });
});
