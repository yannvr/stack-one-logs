/**
 * Mock service layer. Same async shape a real fetch-based client would have,
 * so swapping this for a real backend later is a one-file change. Adds a
 * small randomized latency so the loading skeletons actually appear.
 */

import { generateChartSummary, generateLogs } from './mock';
import type { ChartSummary, Log } from './types';

const LATENCY_MS = { min: 220, max: 480 };

const RAW_LOGS: Log[] = generateLogs(200);
const RAW_SUMMARY: ChartSummary = generateChartSummary(90);

function delay() {
  const ms = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface ListFilters {
  search?: string;
  /** Status class filter — 'all' shows everything. */
  statusFilter?: 'all' | 'success' | 'error';
  /** ISO date string (inclusive, start of day). */
  from?: string;
  /** ISO date string (inclusive, end of day). */
  to?: string;
}

export interface ListResult {
  logs: Log[];
  totalUnfiltered: number;
}

export async function listLogs(filters: ListFilters = {}): Promise<ListResult> {
  await delay();
  let logs = RAW_LOGS;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.endpoint.toLowerCase().includes(q) ||
        l.path.toLowerCase().includes(q) ||
        l.account.name.toLowerCase().includes(q) ||
        l.provider.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    logs = logs.filter((l) =>
      filters.statusFilter === 'success' ? l.status < 400 : l.status >= 400,
    );
  }
  if (filters.from) {
    const fromMs = Date.parse(filters.from);
    logs = logs.filter((l) => Date.parse(l.requestedAt) >= fromMs);
  }
  if (filters.to) {
    const toMs = Date.parse(filters.to);
    logs = logs.filter((l) => Date.parse(l.requestedAt) <= toMs);
  }
  return { logs, totalUnfiltered: RAW_LOGS.length };
}

export async function getLog(id: string): Promise<Log | null> {
  await delay();
  return RAW_LOGS.find((l) => l.id === id) ?? null;
}

export async function getChartSummary(): Promise<ChartSummary> {
  await delay();
  return RAW_SUMMARY;
}

export interface ReplayResult {
  ok: boolean;
  newLogId: string;
}

export async function replayLog(id: string): Promise<ReplayResult> {
  await delay();
  return { ok: true, newLogId: `log_replay_${id.slice(0, 6)}_${Date.now()}` };
}

export async function batchReplay(ids: string[]): Promise<{ ok: boolean; count: number }> {
  await delay();
  return { ok: true, count: ids.length };
}
