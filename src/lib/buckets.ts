/**
 * Maps a log timestamp to a bucket index in the chart's time domain.
 *
 * Buckets are anchored at `now` and count *backwards*: bucket index 0 is the
 * oldest visible bucket, index N-1 is the newest. Same convention used by
 * generateChartSummary, so indices line up between chart bars and table rows.
 *
 * Returns null if the timestamp falls outside the chart's window (older than
 * `now - bucketCount * bucketMs`).
 */

import { CHART_BUCKET_COUNT, CHART_BUCKET_MS } from '~/data/mock';

export function timestampToBucketIndex(
  iso: string,
  now = Date.now(),
  bucketMs = CHART_BUCKET_MS,
  bucketCount = CHART_BUCKET_COUNT,
): number | null {
  const ts = Date.parse(iso);
  const ageMs = now - ts;
  if (ageMs < 0 || ageMs > bucketMs * bucketCount) return null;
  // Newest bucket is index bucketCount - 1; oldest is 0.
  return Math.max(0, Math.min(bucketCount - 1, bucketCount - 1 - Math.floor(ageMs / bucketMs)));
}

/** Inverse: bucket index → (start, end) timestamps in ms. */
export function bucketRange(
  index: number,
  now = Date.now(),
  bucketMs = CHART_BUCKET_MS,
  bucketCount = CHART_BUCKET_COUNT,
): { start: number; end: number } {
  const indexFromEnd = bucketCount - 1 - index;
  const end = now - indexFromEnd * bucketMs;
  return { start: end - bucketMs, end };
}
