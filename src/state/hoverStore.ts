/**
 * Cross-component hover state for the chart↔table sync.
 *
 *   - hoveredBucket: index of the bucket currently being hovered (via bar OR
 *     via a row whose timestamp falls in that bucket). null when nothing.
 *   - hoveredRowId:  optional, so the chart can lift the bar that contains
 *     the hovered row even when multiple bars share the same bucket.
 *
 * The rule: hover only highlights; it never changes data scope or scrolls.
 * Click on the chart issues a filter via onBarClick (handled in LogsPage).
 */

import { create } from 'zustand';

interface HoverStore {
  hoveredBucket: number | null;
  hoveredRowId: string | null;
  setHoveredBucket: (index: number | null) => void;
  setHoveredRowId: (id: string | null) => void;
}

export const useHoverStore = create<HoverStore>((set) => ({
  hoveredBucket: null,
  hoveredRowId: null,
  setHoveredBucket: (hoveredBucket) => set({ hoveredBucket }),
  setHoveredRowId: (hoveredRowId) => set({ hoveredRowId }),
}));
