/**
 * Global keyboard shortcuts. A single document-level keydown listener
 * dispatches to handlers registered via useKeyboardShortcut(). Handlers can
 * opt into firing inside form fields via { allowInInputs: true }; by default
 * shortcuts are suppressed when the user is typing.
 *
 * Shortcut conventions:
 *   '/'          → focus search input
 *   'j' or '↓'   → next row
 *   'k' or '↑'   → previous row
 *   'r'          → refresh
 *   'enter'      → open selected row's drawer
 *   'esc'        → close drawer / palette / popover
 *   '⌘K' / 'Ctrl+K' → open command palette
 */

import { useEffect } from 'react';

export interface ShortcutSpec {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  /** Allow firing even when focus is in an input/textarea. Default: false. */
  allowInInputs?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function matches(event: KeyboardEvent, spec: ShortcutSpec): boolean {
  if (event.key.toLowerCase() !== spec.key.toLowerCase()) return false;
  if (spec.meta && !event.metaKey) return false;
  if (spec.ctrl && !event.ctrlKey) return false;
  if (spec.shift !== undefined && spec.shift !== event.shiftKey) return false;
  return true;
}

/**
 * Register a shortcut for the lifetime of the calling component. Handler is
 * invoked with the original event so it can preventDefault when needed.
 */
export function useKeyboardShortcut(
  spec: ShortcutSpec,
  handler: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!matches(event, spec)) return;
      if (!spec.allowInInputs && isTypingTarget(event.target)) return;
      handler(event);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, spec.key, spec.meta, spec.ctrl, spec.shift, spec.allowInInputs, handler]);
}
