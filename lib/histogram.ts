export type HistogramBin = {
  index: number;
  rangeStart: number;
  rangeEnd: number;
  count: number;
  label: string;
};

function formatBoundary(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

// Divides [min, max] into binCount equal-width buckets and counts how many
// of `values` fall in each. `extraDomainValues` widens the min/max range
// (e.g. to guarantee a specific reference point always falls inside some
// bin) without being counted themselves. The last bucket is inclusive of
// the overall max so the highest value isn't dropped.
export function computeHistogramBins(
  values: number[],
  binCount: number,
  extraDomainValues: number[] = [],
): HistogramBin[] {
  if (values.length === 0 || binCount <= 0) {
    return [];
  }

  const domainValues = [...values, ...extraDomainValues];
  const min = Math.min(...domainValues);
  const max = Math.max(...domainValues);
  const isDegenerate = min === max;
  const binWidth = isDegenerate ? 1 : (max - min) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, binIndex) => {
    const rangeStart = isDegenerate ? min - 0.5 : min + binIndex * binWidth;
    const rangeEnd = isDegenerate ? min + 0.5 : min + (binIndex + 1) * binWidth;

    return {
      index: binIndex,
      rangeStart,
      rangeEnd,
      count: 0,
      label: `${formatBoundary(rangeStart)} to ${formatBoundary(rangeEnd)}`,
    };
  });

  for (const value of values) {
    const rawIndex = isDegenerate ? 0 : Math.floor((value - min) / binWidth);
    const binIndex = Math.min(Math.max(rawIndex, 0), binCount - 1);
    bins[binIndex].count++;
  }

  return bins;
}
