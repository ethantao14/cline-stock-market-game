export type HistogramBin = {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  label: string;
};

function formatBoundary(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

// Divides [min(values), max(values)] into binCount equal-width buckets and
// counts how many values fall in each. The last bucket is inclusive of the
// overall max so the highest value isn't dropped.
export function computeHistogramBins(values: number[], binCount: number): HistogramBin[] {
  if (values.length === 0 || binCount <= 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const isDegenerate = min === max;
  const binWidth = isDegenerate ? 1 : (max - min) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, binIndex) => {
    const rangeStart = isDegenerate ? min - 0.5 : min + binIndex * binWidth;
    const rangeEnd = isDegenerate ? min + 0.5 : min + (binIndex + 1) * binWidth;

    return {
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
