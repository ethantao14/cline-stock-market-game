import { describe, expect, it } from "vitest";

import { computeHistogramBins } from "./histogram";

describe("computeHistogramBins", () => {
  it("evenly buckets a known small array", () => {
    // Range 0..10 split into 5 bins of width 2: [0,2) [2,4) [4,6) [6,8) [8,10].
    const values = [0, 1, 2, 3, 5, 7, 9, 10];
    const bins = computeHistogramBins(values, 5);

    expect(bins).toHaveLength(5);
    expect(bins.map((bin) => bin.count)).toEqual([2, 2, 1, 1, 2]);
    expect(bins[0]).toEqual({ index: 0, rangeStart: 0, rangeEnd: 2, count: 2, label: "+0% to +2%" });
    expect(bins[4]).toEqual({ index: 4, rangeStart: 8, rangeEnd: 10, count: 2, label: "+8% to +10%" });
  });

  it("widens the range for extraDomainValues without counting them", () => {
    // Real values only span 0..10, but an extra domain value of 20 must
    // still fall inside some bin's range without inflating any bin's count.
    const bins = computeHistogramBins([0, 5, 10], 2, [20]);

    expect(bins).toHaveLength(2);
    expect(bins[0]).toEqual({ index: 0, rangeStart: 0, rangeEnd: 10, count: 2, label: "+0% to +10%" });
    expect(bins[1]).toEqual({ index: 1, rangeStart: 10, rangeEnd: 20, count: 1, label: "+10% to +20%" });
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
  });

  it("handles an all-identical input without dividing by zero", () => {
    const bins = computeHistogramBins([5, 5, 5], 4);

    expect(bins).toHaveLength(4);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
    // All values collapse into the single bin that contains 5.
    const nonEmptyBins = bins.filter((bin) => bin.count > 0);
    expect(nonEmptyBins).toHaveLength(1);
    expect(nonEmptyBins[0].count).toBe(3);
  });

  it("returns an empty array for empty input", () => {
    expect(computeHistogramBins([], 10)).toEqual([]);
  });
});
