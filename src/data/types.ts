/**
 * Domain types for the Logs section.
 *
 * Keeping this file deliberately schema-free (no zod, no io-ts) — the shapes
 * are small, the data is mocked, and a real backend would own the contract.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503;

export type StatusClass = 'success' | 'error';

export type Vertical = 'CRM' | 'HRIS' | 'ATS' | 'Accounting' | 'Marketing';

export type SourceType =
  | 'Test Connection'
  | 'Test Mapping'
  | 'Identifier'
  | 'Refresh Token'
  | 'Key';

export type ExpiryState = 'active' | 'expiring-soon' | 'expired' | 'not-available';

export interface Provider {
  id: string;
  name: string;
  vertical: Vertical;
}

export interface Account {
  id: string;
  name: string;
}

export interface Source {
  id: string;
  type: SourceType;
  label: string;
}

export interface UnderlyingRequest {
  id: string;
  method: HttpMethod;
  url: string;
  status: StatusCode;
  durationMs: number;
  requestedAt: string; // ISO
  request: {
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body: unknown | null;
  };
  response: {
    headers: Record<string, string>;
    body: unknown | null;
    available: boolean;
  };
}

export interface Log {
  id: string;
  requestedAt: string; // ISO
  account: Account;
  provider: Provider;
  source: Source;
  method: HttpMethod;
  endpoint: string; // 'List Employees'
  path: string; // '/unified/ats/applications'
  durationMs: number;
  status: StatusCode;
  expiryState: ExpiryState;
  expiresInDays: number | null;
  underlyingRequests: UnderlyingRequest[];
  hasAiExplainer: boolean;
}

export interface ChartBucket {
  /** Bucket start timestamp (ISO). */
  timestamp: string;
  success: number;
  error: number;
}

export interface ChartSummary {
  buckets: ChartBucket[];
  totals: {
    total: number;
    success: number;
    error: number;
    /** Delta vs prior period (% as decimal: 0.02 = +2%). */
    totalDelta: number;
    successDelta: number;
    errorDelta: number;
  };
}
