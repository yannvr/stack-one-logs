/**
 * URL-synced page state. Every meaningful filter, the selected log, and the
 * active drawer tab live in the URL so links are shareable, the back button
 * works, and a hard refresh restores the user's context.
 *
 * URL contract:
 *   /logs?q=:string
 *        &status=:csv     // success | redirect | client-error | server-error
 *        &method=:csv     // GET,POST,PUT,PATCH,DELETE
 *        &account=:csv    // account names (deduplicated)
 *        &source=:csv     // source types
 *        &from=:isoDate
 *        &to=:isoDate
 *        &log=:logId
 *        &tab=details|underlying
 *        &state=empty     // demo-only: forces the empty list state
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UrlState {
  query: string;
  range: { from?: Date; to?: Date };
  columnFilters: {
    status: string[];
    method: string[];
    account: string[];
    source: string[];
  };
  selectedLogId: string | null;
  drawerTab: 'details' | 'underlying';
  isEmptyDemo: boolean;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state: UrlState = useMemo(
    () => ({
      query: searchParams.get('q') ?? '',
      range: {
        from: parseDate(searchParams.get('from')),
        to: parseDate(searchParams.get('to')),
      },
      columnFilters: {
        status: parseCsv(searchParams.get('status')),
        method: parseCsv(searchParams.get('method')),
        account: parseCsv(searchParams.get('account')),
        source: parseCsv(searchParams.get('source')),
      },
      selectedLogId: searchParams.get('log'),
      drawerTab: (searchParams.get('tab') === 'underlying' ? 'underlying' : 'details') as
        | 'details'
        | 'underlying',
      isEmptyDemo: searchParams.get('state') === 'empty',
    }),
    [searchParams],
  );

  /** Set a single param (or remove with null/undefined/empty). */
  const setParam = useCallback(
    (key: string, value: string | null | undefined, opts?: { replace?: boolean }) => {
      setSearchParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          if (value === null || value === undefined || value === '') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          return next;
        },
        { replace: opts?.replace },
      );
    },
    [setSearchParams],
  );

  /** Set/clear a CSV-encoded param. */
  const setCsv = useCallback(
    (key: string, values: string[]) => {
      setParam(key, values.length === 0 ? null : values.join(','));
    },
    [setParam],
  );

  /** Set the range. Both endpoints in one call so we don't double-render. */
  const setRange = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      setSearchParams((cur) => {
        const next = new URLSearchParams(cur);
        if (from) next.set('from', from.toISOString());
        else next.delete('from');
        if (to) next.set('to', to.toISOString());
        else next.delete('to');
        return next;
      });
    },
    [setSearchParams],
  );

  const setQuery = useCallback((q: string) => setParam('q', q), [setParam]);
  const setSelectedLogId = useCallback((id: string | null) => setParam('log', id), [setParam]);
  const setDrawerTab = useCallback(
    (tab: 'details' | 'underlying') => setParam('tab', tab === 'underlying' ? 'underlying' : null),
    [setParam],
  );
  const setColumnFilter = useCallback(
    (key: 'status' | 'method' | 'account' | 'source', values: string[]) => setCsv(key, values),
    [setCsv],
  );

  return {
    state,
    setQuery,
    setRange,
    setSelectedLogId,
    setDrawerTab,
    setColumnFilter,
  };
}
