/**
 * Tiny query hook — same surface as TanStack Query for the parts we actually
 * use: { data, loading, error, refetch }. ~50 LOC, no caching, no dedup.
 *
 * Replace with TanStack Query if the app grows beyond "list + detail + replay".
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useQuery<T>(queryFn: () => Promise<T>, deps: ReadonlyArray<unknown>): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  // Capture latest queryFn without re-running on every render
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  // Effect runs when deps change or refetch is called via `tick`
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    queryFnRef
      .current()
      .then((value) => {
        if (cancelled) return;
        setData(value);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  return { data, loading, error, refetch };
}
