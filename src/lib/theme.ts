/**
 * Theme manager. The initial mode is resolved in index.html (inline script) to
 * avoid a flash before paint. This module exposes runtime controls and a hook
 * for the toggle button in the top bar.
 *
 * Modes:
 *   auto  — follow prefers-color-scheme (default for new visitors)
 *   light — force light
 *   dark  — force dark
 */

import { useSyncExternalStore } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeSnapshot {
  mode: ThemeMode;
  resolved: ResolvedTheme;
}

const STORAGE_KEY = 'theme';

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function readMode(): ThemeMode {
  return (document.documentElement.dataset.themeMode as ThemeMode | undefined) ?? 'auto';
}

let snapshot: ThemeSnapshot = {
  mode: readMode(),
  resolved:
    (document.documentElement.dataset.theme as ResolvedTheme | undefined) ?? resolve(readMode()),
};

const listeners = new Set<() => void>();
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function refresh() {
  const mode = readMode();
  const resolved = resolve(mode);
  if (mode === snapshot.mode && resolved === snapshot.resolved) return;
  snapshot = { mode, resolved };
  for (const fn of listeners) fn();
}

mediaQuery.addEventListener('change', () => {
  if (readMode() === 'auto') {
    document.documentElement.dataset.theme = resolve('auto');
    refresh();
  }
});

export function setTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolve(mode);
  document.documentElement.dataset.themeMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* localStorage may be unavailable in private modes */
  }
  refresh();
}

export function cycleTheme() {
  const order: ThemeMode[] = ['auto', 'light', 'dark'];
  setTheme(order[(order.indexOf(snapshot.mode) + 1) % order.length]);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): ThemeSnapshot {
  return snapshot;
}

const SERVER_SNAPSHOT: ThemeSnapshot = { mode: 'auto', resolved: 'light' };

export function useTheme(): ThemeSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
