export const MIN_ALLOCATION = 1000;
const MAX_ALLOCATION = 3000;

// Caps a single pick so enough budget remains to hit the $1,000 minimum on
// every pick still to come, including this one (e.g. spending the max on
// pick 1 of 8 leaves exactly $1,000 per pick for the remaining 7).
export function getMaxAllocation(remainingBudget: number, remainingPicks: number): number {
  return Math.min(MAX_ALLOCATION, remainingBudget - (remainingPicks - 1) * MIN_ALLOCATION);
}
