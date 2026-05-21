/**
 * Sidebar collapse state.
 *
 * Two concepts:
 *   - userCollapsed: what the user toggled (persisted to localStorage).
 *   - drawerOpen:    transient force-collapse when the detail drawer is open.
 *
 * The visible state = userCollapsed || drawerOpen. When the drawer closes,
 * the sidebar restores to whatever userCollapsed was.
 */

import { create } from 'zustand';

const STORAGE_KEY = 'sidebar-collapsed';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface SidebarStore {
  userCollapsed: boolean;
  drawerOpen: boolean;
  /** Derived visible state. */
  isCollapsed: () => boolean;
  toggleUser: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  userCollapsed: readStored(),
  drawerOpen: false,
  isCollapsed: () => get().userCollapsed || get().drawerOpen,
  toggleUser: () =>
    set((s) => {
      const next = !s.userCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return { userCollapsed: next };
    }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));
