/**
 * ⌘K / Ctrl+K command palette. Built on cmdk inside a Radix Dialog so we get
 * focus-trapping, escape-to-close, and overlay-click-to-close for free.
 *
 * Groups:
 *   Actions     — Refresh, Replay last opened log, Clear filters
 *   Navigation  — Jump to log by id, scroll-to-top, jump-to-last-page
 *   Filters     — Show errors only, Show success only, Clear time range
 *   Theme       — Auto / Light / Dark
 */

import * as Dialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import {
  ArrowsClockwise,
  Funnel,
  MagnifyingGlass,
  Monitor,
  Moon,
  Sun,
  XCircle,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { setTheme } from '~/lib/theme';

type Props = {
  onRefresh: () => void;
  onClearFilters: () => void;
  onShowOnlyErrors: () => void;
  onShowOnlySuccess: () => void;
  onClearTimeRange: () => void;
  onScrollToTable: () => void;
};

export function CommandPalette({
  onRefresh,
  onClearFilters,
  onShowOnlyErrors,
  onShowOnlySuccess,
  onClearTimeRange,
  onScrollToTable,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function run(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    // modal={false} skips Radix's body scroll-lock. The palette is small,
    // centred, and dismissible — it doesn't need to seize scroll. Locking
    // would also remove the page scrollbar, which visually shifts everything
    // including the fixed-positioned detail drawer if it's open behind.
    <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="cmdk-overlay" />
        <Dialog.Content
          className="cmdk-content"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Default focus moves into the Dialog; we want focus on the search
            // input inside cmdk, which cmdk handles itself.
            e.preventDefault();
            const input = document.querySelector<HTMLInputElement>('.cmdk-input-wrap input');
            input?.focus();
          }}
          onInteractOutside={(e) => {
            // With modal={false}, outside-click on a focused element doesn't
            // automatically close. Keep the close behavior intact.
            setOpen(false);
            e.preventDefault();
          }}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command label="Command palette" className="cmdk-root">
            <div className="cmdk-input-wrap">
              <MagnifyingGlass size={14} weight="regular" />
              <Command.Input placeholder="Type a command or search…" />
              <kbd>esc</kbd>
            </div>
            <Command.List>
              <Command.Empty>No matching command.</Command.Empty>

              <Command.Group heading="Actions">
                <Command.Item onSelect={() => run(onRefresh)}>
                  <ArrowsClockwise size={14} weight="regular" />
                  Refresh chart &amp; table
                </Command.Item>
                <Command.Item onSelect={() => run(onScrollToTable)}>
                  <Funnel size={14} weight="regular" />
                  Scroll to table
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Filters">
                <Command.Item onSelect={() => run(onShowOnlyErrors)}>
                  <XCircle size={14} weight="regular" />
                  Show only errors
                </Command.Item>
                <Command.Item onSelect={() => run(onShowOnlySuccess)}>
                  <Funnel size={14} weight="regular" />
                  Show only success
                </Command.Item>
                <Command.Item onSelect={() => run(onClearTimeRange)}>
                  <XCircle size={14} weight="regular" />
                  Clear time range
                </Command.Item>
                <Command.Item onSelect={() => run(onClearFilters)}>
                  <XCircle size={14} weight="regular" />
                  Clear all filters
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Theme">
                <Command.Item onSelect={() => run(() => setTheme('auto'))}>
                  <Monitor size={14} weight="regular" />
                  Follow system theme
                </Command.Item>
                <Command.Item onSelect={() => run(() => setTheme('light'))}>
                  <Sun size={14} weight="regular" />
                  Light theme
                </Command.Item>
                <Command.Item onSelect={() => run(() => setTheme('dark'))}>
                  <Moon size={14} weight="regular" />
                  Dark theme
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
