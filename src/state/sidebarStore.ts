/**
 * Sidebar collapse state.
 *
 * Behaviour: when the detail drawer opens, the sidebar collapses. Once
 * collapsed (whether manually or by drawer-open), it stays collapsed on
 * subsequent drawer close — re-expanding only happens when the user
 * explicitly clicks the toggle button. This avoids jarring expand/collapse
 * cycles when the user is clicking through several rows.
 *
 * Persisted across reloads via localStorage.
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

function persist(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    /* private mode / ignore */
  }
}

interface SidebarStore {
  collapsed: boolean;
  isCollapsed: () => boolean;
  toggle: () => void;
  /** Called when the detail drawer opens — collapses sidebar one-way. */
  collapseForDrawer: () => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: readStored(),
  isCollapsed: () => get().collapsed,
  toggle: () =>
    set((s) => {
      const next = !s.collapsed;
      persist(next);
      return { collapsed: next };
    }),
  collapseForDrawer: () => {
    if (get().collapsed) return;
    persist(true);
    set({ collapsed: true });
  },
}));
