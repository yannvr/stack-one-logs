import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Sidebar } from '~/components/Sidebar';
import { Toaster, useToasterState } from '~/components/Toaster';
import { TopBar } from '~/components/TopBar';
import { batchReplay, getChartSummary, listLogs, replayLog } from '~/data/service';
import { useQuery } from '~/data/useQuery';
import type { ChartBucket, Log } from '~/data/types';
import { CHART_BUCKET_MS } from '~/data/mock';
import { useSidebarStore } from '~/state/sidebarStore';
import { LogsChart } from './LogsChart';
import { LogsDetail } from './LogsDetail';
import { LogsEmpty } from './LogsEmpty';
import { LogsFilters, type FiltersValue } from './LogsFilters';
import { ChartSkeleton, TableSkeleton } from './LogsLoading';
import { LogsTable } from './LogsTable';

const INITIAL_FILTERS: FiltersValue = {
  query: '',
  range: undefined,
  backgroundLogs: false,
};

export function LogsPage() {
  const [searchParams] = useSearchParams();
  const isEmptyDemo = searchParams.get('state') === 'empty';

  const [filters, setFilters] = useState<FiltersValue>(INITIAL_FILTERS);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const collapseForDrawer = useSidebarStore((s) => s.collapseForDrawer);

  // First time a log opens, collapse the sidebar one-way. Subsequent opens are
  // no-ops; closing the drawer never re-expands. The user can re-expand via
  // the toggle button whenever they want.
  useEffect(() => {
    if (selectedLog !== null) collapseForDrawer();
  }, [selectedLog, collapseForDrawer]);

  const { items: toasts, ctx: toaster, dismiss } = useToasterState();

  const fetchLogs = useCallback(
    () =>
      isEmptyDemo
        ? Promise.resolve({ logs: [], totalUnfiltered: 0 })
        : listLogs({
            search: filters.query || undefined,
            from: filters.range?.from?.toISOString(),
            to: filters.range?.to?.toISOString(),
          }),
    [filters.query, filters.range, isEmptyDemo],
  );

  const { data: logsResult, loading: logsLoading, refetch: refetchLogs } = useQuery(fetchLogs, [
    filters.query,
    filters.range?.from?.toISOString(),
    filters.range?.to?.toISOString(),
    isEmptyDemo,
  ]);
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useQuery(
    () => getChartSummary(),
    [],
  );

  // A single Refresh action refreshes both the chart and the table. Both go
  // back into their loading states (skeletons) so the refresh is visible.
  const refetch = useCallback(() => {
    refetchLogs();
    refetchSummary();
  }, [refetchLogs, refetchSummary]);

  const logs = logsResult?.logs ?? [];
  const hasLogs = logs.length > 0;

  const onNavigate = useCallback(
    (direction: 1 | -1) => {
      if (!selectedLog) return;
      const idx = logs.findIndex((l) => l.id === selectedLog.id);
      if (idx === -1) return;
      const next = logs[idx + direction];
      if (next) setSelectedLog(next);
    },
    [logs, selectedLog],
  );

  const onReplay = useCallback(
    async (log: Log) => {
      toaster.show('Replaying Request', 'progress');
      const result = await replayLog(log.id);
      toaster.show('Success', 'success', {
        label: 'Logs',
        onClick: () => {
          // In a real app this would jump to the new log entry; for the
          // mock it just scrolls back to the top of the table.
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

  // Click a bar → filter table to that bucket's time range. Pagination resets
  // (handled inside LogsTable via useEffect on `logs`). No page-jumping happens
  // on hover — only on explicit click.
  const onBucketClick = useCallback(
    (bucket: ChartBucket) => {
      const end = new Date(bucket.timestamp);
      const start = new Date(end.getTime() - CHART_BUCKET_MS);
      setFilters((cur) => ({ ...cur, range: { from: start, to: end } }));
      toaster.show(`Filtered to ${start.toLocaleTimeString()}–${end.toLocaleTimeString()}`);
    },
    [toaster],
  );

  const detailContent = useMemo(() => {
    if (!hasLogs) {
      if (isEmptyDemo || (!filters.query && !filters.range)) {
        return <LogsEmpty />;
      }
      return <LogsEmpty variant="no-results" />;
    }
    return (
      <LogsTable
        logs={logs}
        selectedLogId={selectedLog?.id ?? null}
        onRowClick={setSelectedLog}
        onReplay={onReplay}
        onBatchReplay={onBatchReplay}
      />
    );
  }, [hasLogs, isEmptyDemo, filters.query, filters.range, logs, selectedLog?.id, onReplay, onBatchReplay]);

  return (
    <div className="logs-page">
      <Sidebar />
      <div className="main">
        <TopBar title="Request Logs" />
        <div className="main-content">
          {!isEmptyDemo && (
            <LogsFilters value={filters} onChange={setFilters} onRefresh={refetch} />
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
        open={selectedLog !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedLog(null);
        }}
        onNavigate={onNavigate}
        onToast={(msg) => toaster.show(msg)}
      />

      <Toaster items={toasts} onDismiss={dismiss} />
    </div>
  );
}
