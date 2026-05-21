import {
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretUpDown,
  Plus,
} from '@phosphor-icons/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { CaretDoubleLeft as PageFirst, CaretDoubleRight as PageLast } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import { Avatar } from '~/components/Avatar';
import { ColumnFilterMenu, type FilterOption } from '~/components/ColumnFilterMenu';
import { MethodBadge } from '~/components/MethodBadge';
import { RowActionsMenu } from '~/components/RowActionsMenu';
import { SourceIcon } from '~/components/SourceIcon';
import { StatusPill } from '~/components/StatusPill';
import { Tooltip } from '~/components/primitives/Tooltip';
import type { HttpMethod, Log, SourceType } from '~/data/types';
import { timestampToBucketIndex } from '~/lib/buckets';
import { formatDate, formatDuration, formatTimeWithMs } from '~/lib/time';
import { useHoverStore } from '~/state/hoverStore';

const columnHelper = createColumnHelper<Log>();

type Props = {
  logs: Log[];
  onRowClick?: (log: Log) => void;
  selectedLogId?: string | null;
  onReplay?: (log: Log) => void;
  onBatchReplay?: (log: Log) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const METHOD_OPTIONS: FilterOption[] = (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => ({
  value: m,
  label: m,
  prefix: <MethodBadge method={m} />,
}));

const STATUS_CLASS_OPTIONS: FilterOption[] = [
  { value: 'success', label: '2xx Success' },
  { value: 'redirect', label: '3xx Redirect' },
  { value: 'client-error', label: '4xx Client Error' },
  { value: 'server-error', label: '5xx Server Error' },
];

const SOURCE_OPTIONS: FilterOption[] = (
  ['Test Connection', 'Test Mapping', 'Identifier', 'Refresh Token', 'Key'] as SourceType[]
).map((s) => ({ value: s, label: s }));

function statusClass(status: number): string {
  if (status < 300) return 'success';
  if (status < 400) return 'redirect';
  if (status < 500) return 'client-error';
  return 'server-error';
}

export function LogsTable({ logs, onRowClick, selectedLogId, onReplay, onBatchReplay }: Props) {
  const hoveredBucket = useHoverStore((s) => s.hoveredBucket);
  const hoverSource = useHoverStore((s) => s.hoverSource);
  const hoverFromRow = useHoverStore((s) => s.hoverFromRow);

  // A stable "now" anchor per render of the table — keeps bucket assignment
  // deterministic across row mappings and chart bars.
  const [bucketNow] = useState(() => Date.now());
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'requestedAt', desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });

  // Reset to page 1 whenever the underlying logs array or filters change.
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [logs, columnFilters]);

  // Derive Account filter options from the current dataset. Dedup by *name*,
  // not id — Faker generates many ids per account name, and a filter labelled
  // "Sample Organization" appearing 6 times is useless noise.
  const accountOptions: FilterOption[] = useMemo(() => {
    const names = new Set<string>();
    for (const log of logs) names.add(log.account.name);
    return Array.from(names)
      .map((name) => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [logs]);

  const getFilterValues = (id: string): string[] =>
    (columnFilters.find((f) => f.id === id)?.value as string[] | undefined) ?? [];

  const setFilterValues = (id: string, next: string[]) => {
    setColumnFilters((cur) => {
      const without = cur.filter((f) => f.id !== id);
      return next.length === 0 ? without : [...without, { id, value: next }];
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('requestedAt', {
        header: 'Requested',
        cell: (ctx) => (
          <span className="requested-cell">
            <span className="date">{formatDate(ctx.getValue())}</span>
            <span className="divider">|</span>
            <span className="time">{formatTimeWithMs(ctx.getValue())}</span>
          </span>
        ),
        sortingFn: (a, b) =>
          Date.parse(a.original.requestedAt) - Date.parse(b.original.requestedAt),
      }),
      columnHelper.accessor((row) => row.account.name, {
        id: 'account',
        header: 'Account',
        cell: (ctx) => {
          const acc = ctx.row.original.account;
          return (
            <span className="account-cell">
              <Avatar id={acc.id} name={acc.name} />
              <span>{acc.name}</span>
            </span>
          );
        },
        filterFn: (row, _id, value: string[]) => value.includes(row.original.account.name),
      }),
      columnHelper.accessor((row) => row.source.type, {
        id: 'source',
        header: 'Source',
        cell: (ctx) => {
          const src = ctx.row.original.source;
          return (
            <span className="source-cell">
              <SourceIcon type={src.type} />
              <span>{src.label}</span>
            </span>
          );
        },
        filterFn: (row, _id, value: string[]) => value.includes(row.original.source.type),
      }),
      columnHelper.accessor((row) => row.method, {
        id: 'request',
        header: 'Request',
        cell: (ctx) => {
          const log = ctx.row.original;
          return (
            <span className="request-cell">
              <MethodBadge method={log.method} />
              <span className="endpoint">{log.endpoint}</span>
              <Tooltip content={<code>{log.path}</code>}>
                <span className="path">{log.path}</span>
              </Tooltip>
            </span>
          );
        },
        filterFn: (row, _id, value: string[]) => value.includes(row.original.method),
      }),
      columnHelper.accessor('durationMs', {
        header: 'Duration',
        cell: (ctx) => <span className="duration-cell">{formatDuration(ctx.getValue())}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (ctx) => <StatusPill status={ctx.getValue()} />,
        filterFn: (row, _id, value: string[]) =>
          value.includes(statusClass(row.original.status)),
      }),
      columnHelper.display({
        id: 'underlyingCount',
        header: '',
        cell: (ctx) => {
          const n = ctx.row.original.underlyingRequests.length;
          return n > 0 ? <span className="underlying-count">{n}</span> : null;
        },
      }),
      columnHelper.display({
        id: 'menu',
        header: '',
        cell: (ctx) => (
          <RowActionsMenu
            log={ctx.row.original}
            onReplay={onReplay}
            onBatchReplay={onBatchReplay}
          />
        ),
      }),
      columnHelper.display({
        id: 'chevron',
        header: '',
        cell: () => (
          <span className="row-chevron" aria-hidden="true">
            <CaretRight size={14} weight="regular" />
          </span>
        ),
      }),
    ],
    [onReplay, onBatchReplay],
  );

  const table = useReactTable({
    data: logs,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const totalRows = table.getFilteredRowModel().rows.length;
  const firstRow = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min(totalRows, (pagination.pageIndex + 1) * pagination.pageSize);

  const hiddenCount = Object.values(columnVisibility).filter((v) => v === false).length;

  return (
    <div className="logs-table-card">
      <div className="logs-table-scroll">
        <table className="logs-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const id = header.id;
                  const sortable = header.column.getCanSort() && id !== 'menu' && id !== 'chevron' && id !== 'underlyingCount';
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th key={id} data-column={id}>
                      <span className="th-inner">
                        {sortable ? (
                          <button
                            type="button"
                            className="th-sort"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDir === 'asc' ? (
                              <CaretUp size={11} weight="bold" />
                            ) : sortDir === 'desc' ? (
                              <CaretDown size={11} weight="bold" />
                            ) : (
                              <CaretUpDown size={11} weight="regular" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}

                        {id === 'account' && (
                          <ColumnFilterMenu
                            label="Account"
                            options={accountOptions}
                            selected={getFilterValues('account')}
                            onChange={(next) => setFilterValues('account', next)}
                            searchable
                          />
                        )}
                        {id === 'source' && (
                          <ColumnFilterMenu
                            label="Source"
                            options={SOURCE_OPTIONS}
                            selected={getFilterValues('source')}
                            onChange={(next) => setFilterValues('source', next)}
                          />
                        )}
                        {id === 'request' && (
                          <ColumnFilterMenu
                            label="Method"
                            options={METHOD_OPTIONS}
                            selected={getFilterValues('request')}
                            onChange={(next) => setFilterValues('request', next)}
                          />
                        )}
                        {id === 'status' && (
                          <ColumnFilterMenu
                            label="Status"
                            options={STATUS_CLASS_OPTIONS}
                            selected={getFilterValues('status')}
                            onChange={(next) => setFilterValues('status', next)}
                          />
                        )}

                        {id === 'request' && hiddenCount > 0 ? (
                          <span className="hidden-cols-chip" title={`${hiddenCount} columns hidden`}>
                            {hiddenCount} Columns Hidden
                          </span>
                        ) : null}
                        {id === 'request' ? (
                          <button type="button" className="icon th-add" aria-label="Add column">
                            <Plus size={11} weight="bold" />
                          </button>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const log = row.original;
              const isSelected = selectedLogId === log.id;
              const rowBucket = timestampToBucketIndex(log.requestedAt, bucketNow);
              // Bucket-mate highlight only when the hover came FROM a bar in the
              // chart. Row-originated hover should highlight only that single
              // row (handled by the native :hover pseudoclass), never every
              // other row that happens to share the same time bucket.
              const isBucketHover =
                hoverSource === 'bar' && rowBucket !== null && hoveredBucket === rowBucket;
              return (
                <tr
                  key={row.id}
                  data-selected={isSelected || undefined}
                  data-status={log.status >= 400 ? 'error' : 'success'}
                  data-bucket-hover={isBucketHover || undefined}
                  onClick={() => onRowClick?.(log)}
                  onMouseEnter={() => hoverFromRow(rowBucket)}
                  onMouseLeave={() => hoverFromRow(null)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick?.(log);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} data-column={cell.column.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="logs-table-footer">
        <span className="page-readout">
          <span className="page-readout-strong">
            {firstRow.toLocaleString()}–{lastRow.toLocaleString()}
          </span>{' '}
          of <span className="page-readout-strong">{totalRows.toLocaleString()}</span>
        </span>
        <span className="page-size">
          <label htmlFor="page-size">Rows</label>
          <select
            id="page-size"
            value={pagination.pageSize}
            onChange={(e) =>
              setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })
            }
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </span>
        <nav className="page-nav" aria-label="Pagination">
          <button
            type="button"
            className="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <PageFirst size={14} weight="regular" />
          </button>
          <button
            type="button"
            className="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <CaretLeft size={14} weight="regular" />
          </button>
          <span className="page-of">
            <span className="page-readout-strong">{currentPage.toLocaleString()}</span> /{' '}
            {pageCount.toLocaleString()}
          </span>
          <button
            type="button"
            className="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <CaretRight size={14} weight="regular" />
          </button>
          <button
            type="button"
            className="icon"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <PageLast size={14} weight="regular" />
          </button>
        </nav>
      </footer>
    </div>
  );
}
