export const DEFAULT_BUCKETS = [
  { max: 1, label: '0‑1' },
  { max: 4, label: '1‑4' },
  { max: 8, label: '4‑8' },
  { max: Infinity, label: '8+' },
] as const;

type Bucket = typeof DEFAULT_BUCKETS[number];

/** Return the bucket label for a given spread value. */
export function bucketLabel(spread: number, buckets = DEFAULT_BUCKETS): string {
  for (const b of buckets) {
    if (spread <= b.max) return b.label;
  }
  return '8+';
}
