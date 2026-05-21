import { useCallback, useEffect, useMemo } from 'react';

import { Sidebar } from '~/components/Sidebar';
import { Toaster, useToasterState } from '~/components/Toaster';
import { TopBar } from '~/components/TopBar';
import { batchReplay, getChartSummary, listLogs, replayLog } from '~/data/service';
import { useQuery } from '~/data/useQuery';
import type { ChartBucket, Log } from '~/data/types';
import { CHART_BUCKET_MS } from '~/data/mock';
import { useSidebarStore } from '~/state/sidebarStore';
import { useUrlState } from '~/state/urlState';
import { LogsChart } from './LogsChart';
import { LogsDetail } from './LogsDetail';
import { LogsEmpty } from './LogsEmpty';
import { LogsFilters, type FiltersValue } from './LogsFilters';
import { ChartSkeleton, TableSkeleton } from './LogsLoading';
import { LogsTable } from './LogsTable';

const STATUS_CLASS_MATCH: Record<string, (status: number) => boolean> = {
  success: (s) => s < 300,
  redirect: (s) => s >= 300 && s < 400,
  'client-error': (s) => s >= 400 && s < 500,
  'server-error': (s) => s >= 500,
};

export function LogsPage() {
  const { state, setQuery, setRange, setSelectedLogId, setColumnFilter } = useUrlState();
  const { query, range, columnFilters, selectedLogId, isEmptyDemo } = state;

  const collapseForDrawer = useSidebarStore((s) => s.collapseForDrawer);

  // Collapse the sidebar one-way when the drawer opens (per earlier user
  // preference: don't auto-re-expand on close).
  useEffect(() => {
    if (selectedLogId) collapseForDrawer();
  }, [selectedLogId, collapseForDrawer]);

  const { items: toasts, ctx: toaster, dismiss } = useToasterState();

  // Logs query: only the search + date range params reach the service. Column
  // filters (status/method/account/source) are applied client-side inside the
  // table, so they don't drive a refetch.
  const fetchLogs = useCallback(
    () =>
      isEmptyDemo
        ? Promise.resolve({ logs: [], totalUnfiltered: 0 })
        : listLogs({
            search: query || undefined,
            from: range.from?.toISOString(),
            to: range.to?.toISOString(),
          }),
    [query, range.from, range.to, isEmptyDemo],
  );

  const { data: logsResult, loading: logsLoading, refetch: refetchLogs } = useQuery(fetchLogs, [
    query,
    range.from?.toISOString(),
    range.to?.toISOString(),
    isEmptyDemo,
  ]);
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useQuery(
    () => getChartSummary(),
    [],
  );

  const refetch = useCallback(() => {
    refetchLogs();
    refetchSummary();
  }, [refetchLogs, refetchSummary]);

  // Apply the status-class column filter on top of what the server returned.
  // (Method/account/source filters live in TanStack Table's filterFns.)
  const logs = useMemo(() => {
    const base = logsResult?.logs ?? [];
    if (columnFilters.status.length === 0) return base;
    const matchers = columnFilters.status
      .map((s) => STATUS_CLASS_MATCH[s])
      .filter(Boolean) as Array<(s: number) => boolean>;
    return base.filter((log) => matchers.some((fn) => fn(log.status)));
  }, [logsResult?.logs, columnFilters.status]);

  const hasLogs = logs.length > 0;

  // Resolve the selected Log by id (from URL) into the actual object.
  const selectedLog = useMemo(
    () => (selectedLogId ? logs.find((l) => l.id === selectedLogId) ?? null : null),
    [logs, selectedLogId],
  );

  const onNavigate = useCallback(
    (direction: 1 | -1) => {
      if (!selectedLog) return;
      const idx = logs.findIndex((l) => l.id === selectedLog.id);
      if (idx === -1) return;
      const next = logs[idx + direction];
      if (next) setSelectedLogId(next.id);
    },
    [logs, selectedLog, setSelectedLogId],
  );

  const onReplay = useCallback(
    async (log: Log) => {
      toaster.show('Replaying Request', 'progress');
      const result = await replayLog(log.id);
      toaster.show('Success', 'success', {
        label: 'Logs',
        onClick: () => {
          const card = document.querySelector('.logs-table-card');
          card?.scrollIntoView({ behavior: 'smooth' });
          // eslint-disable-next-line no-console
          console.log('[stack-one] would navigate to log', result.newLogId);
        },
      });
    },
    [toaster],
  );

  const onBatchReplay = useCallback(
    async (log: Log) => {
      toaster.show('Replaying Batch', 'progress');
      const { count } = await batchReplay(log.underlyingRequests.map((r) => r.id));
      toaster.show(`Replayed ${count} underlying request${count === 1 ? '' : 's'}`);
    },
    [toaster],
  );

  const onBucketClick = useCallback(
    (bucket: ChartBucket) => {
      const end = new Date(bucket.timestamp);
      const start = new Date(end.getTime() - CHART_BUCKET_MS);
      setRange(start, end);
      toaster.show(`Filtered to ${start.toLocaleTimeString()}–${end.toLocaleTimeString()}`);
    },
    [setRange, toaster],
  );

  const filtersValue: FiltersValue = useMemo(
    () => ({
      query,
      range: range.from ? { from: range.from, to: range.to } : undefined,
      backgroundLogs: false,
    }),
    [query, range.from, range.to],
  );

  const onFiltersChange = useCallback(
    (next: FiltersValue) => {
      if (next.query !== query) setQuery(next.query);
      const nextFrom = next.range?.from;
      const nextTo = next.range?.to;
      if (
        nextFrom?.toISOString() !== range.from?.toISOString() ||
        nextTo?.toISOString() !== range.to?.toISOString()
      ) {
        setRange(nextFrom, nextTo);
      }
    },
    [query, range.from, range.to, setQuery, setRange],
  );

  const detailContent = useMemo(() => {
    if (!hasLogs) {
      if (isEmptyDemo || (!query && !range.from && !range.to)) {
        return <LogsEmpty />;
      }
      return <LogsEmpty variant="no-results" />;
    }
    return (
      <LogsTable
        logs={logs}
        selectedLogId={selectedLog?.id ?? null}
        onRowClick={(log) => setSelectedLogId(log.id)}
        onReplay={onReplay}
        onBatchReplay={onBatchReplay}
        columnFilterValues={columnFilters}
        onColumnFilterChange={setColumnFilter}
      />
    );
  }, [
    hasLogs,
    isEmptyDemo,
    query,
    range.from,
    range.to,
    logs,
    selectedLog?.id,
    onReplay,
    onBatchReplay,
    columnFilters,
    setColumnFilter,
    setSelectedLogId,
  ]);

  return (
    <div className="logs-page">
      <Sidebar />
      <div className="main">
        <TopBar title="Request Logs" />
        <div className="main-content">
          {!isEmptyDemo && (
            <LogsFilters value={filtersValue} onChange={onFiltersChange} onRefresh={refetch} />
          )}
          {!isEmptyDemo && (summaryLoading || !summary ? (
            <ChartSkeleton />
          ) : (
            <LogsChart summary={summary} onBucketClick={onBucketClick} />
          ))}
          {logsLoading ? <TableSkeleton /> : detailContent}
        </div>
      </div>

      <LogsDetail
        log={selectedLog}
        // Drawer open state comes from URL — not from whether `selectedLog`
        // has resolved yet. Otherwise the drawer briefly closes during data
        // refetches, fires Radix's onOpenChange(false), and the URL log id
        // is wiped before the user could ever see the panel.
        open={!!selectedLogId}
        onOpenChange={(next) => {
          if (!next) setSelectedLogId(null);
        }}
        onNavigate={onNavigate}
        onToast={(msg) => toaster.show(msg)}
      />

      <Toaster items={toasts} onDismiss={dismiss} />
    </div>
  );
}
