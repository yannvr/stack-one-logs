/**
 * Cross-component hover state for the chart↔table sync.
 *
 *   - hoveredBucket: index of the bucket being hovered.
 *   - hoverSource:  'bar' when the chart originated the hover (we then
 *                   highlight every row that falls in that bucket);
 *                   'row' when a table row originated it (we highlight ONLY
 *                   that one row plus the bar above it).
 *
 * The rule: hover only highlights; it never changes data scope or scrolls.
 */

import { create } from 'zustand';

export type HoverSource = 'bar' | 'row' | null;

interface HoverStore {
  hoveredBucket: number | null;
  hoverSource: HoverSource;
  hoverFromBar: (bucket: number | null) => void;
  hoverFromRow: (bucket: number | null) => void;
}

export const useHoverStore = create<HoverStore>((set) => ({
  hoveredBucket: null,
  hoverSource: null,
  hoverFromBar: (bucket) =>
    set({ hoveredBucket: bucket, hoverSource: bucket === null ? null : 'bar' }),
  hoverFromRow: (bucket) =>
    set({ hoveredBucket: bucket, hoverSource: bucket === null ? null : 'row' }),
}));
