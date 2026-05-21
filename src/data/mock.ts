/**
 * Mock data generators backed by Faker. Seeded so refreshes produce the same
 * dataset (otherwise hover-syncing chart and table is non-deterministic across
 * renders, which is a worse demo experience than a fresh-but-shifting dataset).
 *
 * Realism choices vs the Figma:
 *  - Timestamps are *recent and varied*, not all `21:05:19.123` (one of the
 *    critique items addressed up front because shipping frozen timestamps is
 *    worse than shipping no timestamps).
 *  - Statuses are distributed: ~92% 2xx, ~6% 4xx, ~2% 5xx. Roughly matches
 *    the "Success 580k / Error 20k" split shown in the chart.
 *  - Providers / verticals / sources are drawn from a small fixed list so
 *    the table reads like a real platform.
 */

import { faker } from '@faker-js/faker';

import type {
  Account,
  ChartBucket,
  ChartSummary,
  ExpiryState,
  HttpMethod,
  Log,
  Provider,
  Source,
  SourceType,
  StatusCode,
  UnderlyingRequest,
  Vertical,
} from './types';

faker.seed(42);

const VERTICAL_PROVIDERS: Record<Vertical, string[]> = {
  CRM: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho'],
  HRIS: ['BambooHR', 'Workday', 'Personio', 'Rippling'],
  ATS: ['Greenhouse', 'Lever', 'Ashby', 'Workable'],
  Accounting: ['QuickBooks', 'Xero', 'NetSuite', 'Sage'],
  Marketing: ['Mailchimp', 'Klaviyo', 'ActiveCampaign'],
};

const ENDPOINTS: Array<{ method: HttpMethod; endpoint: string; path: string }> = [
  { method: 'GET', endpoint: 'List Employees', path: '/unified/ats/applications' },
  { method: 'GET', endpoint: 'List Employees', path: '/unified/hris/employees' },
  { method: 'GET', endpoint: 'List Candidates', path: '/unified/ats/candidates' },
  { method: 'GET', endpoint: 'Get Employee', path: '/unified/hris/employees/:id' },
  { method: 'POST', endpoint: 'Create Application', path: '/unified/ats/applications' },
  { method: 'POST', endpoint: 'Create Candidate', path: '/unified/ats/candidates' },
  { method: 'PATCH', endpoint: 'Update Employee', path: '/unified/hris/employees/:id' },
  { method: 'PUT', endpoint: 'Replace Mapping', path: '/projects/mappings/:id' },
  { method: 'DELETE', endpoint: 'Delete Webhook', path: '/projects/webhooks/:id' },
  { method: 'GET', endpoint: 'List Time-Off', path: '/unified/hris/time_off' },
  { method: 'GET', endpoint: 'List Payments', path: '/unified/accounting/payments' },
  { method: 'POST', endpoint: 'Sync Contacts', path: '/unified/crm/contacts/sync' },
];

const SOURCE_TYPES: SourceType[] = [
  'Test Connection',
  'Test Mapping',
  'Identifier',
  'Refresh Token',
  'Key',
];

const ACCOUNT_NAMES = [
  'Sample Organization',
  'Acme Holdings',
  'Northwind Traders',
  'Globex Corp.',
  'Initech',
  'Soylent Industries',
];

function pickWeighted<T>(items: Array<[T, number]>): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let pick = faker.number.float({ min: 0, max: total });
  for (const [item, w] of items) {
    pick -= w;
    if (pick <= 0) return item;
  }
  return items[items.length - 1][0];
}

function generateStatus(): StatusCode {
  return pickWeighted<StatusCode>([
    [200, 80],
    [201, 8],
    [204, 4],
    [400, 2],
    [401, 2],
    [403, 1],
    [404, 1],
    [429, 0.5],
    [500, 1],
    [502, 0.3],
    [503, 0.2],
  ]);
}

function generateProvider(): Provider {
  const verticals = Object.keys(VERTICAL_PROVIDERS) as Vertical[];
  const vertical = faker.helpers.arrayElement(verticals);
  const name = faker.helpers.arrayElement(VERTICAL_PROVIDERS[vertical]);
  return { id: `prv_${name.toLowerCase()}`, name, vertical };
}

function generateAccount(): Account {
  const name = faker.helpers.arrayElement(ACCOUNT_NAMES);
  return { id: `acc_${faker.string.alphanumeric(8)}`, name };
}

function generateSource(): Source {
  const type = faker.helpers.arrayElement(SOURCE_TYPES);
  const label = type === 'Identifier' ? `Identifier ${faker.number.int({ min: 1, max: 4 })}` : type;
  return { id: `src_${faker.string.alphanumeric(6)}`, type, label };
}

function generateUnderlyingRequest(parentStatus: StatusCode): UnderlyingRequest {
  // Underlying status often mirrors the parent — 401 on top usually means 401 underneath
  const status: StatusCode = faker.helpers.maybe(() => parentStatus, { probability: 0.7 }) ?? generateStatus();

  return {
    id: `und_${faker.string.alphanumeric(10)}`,
    method: faker.helpers.arrayElement(['GET', 'POST'] satisfies HttpMethod[]),
    url: `https://api.${faker.internet.domainWord()}.com/v1/${faker.helpers.arrayElement(['employees', 'candidates', 'workflows', 'contacts'])}/${faker.string.uuid()}/startTrigger`,
    status,
    durationMs: faker.number.int({ min: 80, max: 920 }),
    requestedAt: faker.date.recent({ days: 1 }).toISOString(),
    request: {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Connection: 'keep-alive',
        'User-Agent': 'test-request/2.35.1',
        Authorization: '<redacted>',
        'Cache-Control': '<redacted>',
      },
      queryParams: {
        page: '1',
        per_page: '50',
        'really-long-example': faker.string.alphanumeric({ length: { min: 80, max: 140 } }),
      },
      body: status === 401 ? null : { sync: true, since: faker.date.recent({ days: 7 }).toISOString() },
    },
    response: {
      available: status !== 401,
      headers:
        status === 401
          ? {}
          : { 'Content-Type': 'application/json', 'X-Request-Id': faker.string.uuid() },
      body:
        status === 401
          ? null
          : {
              next: `eyJ${faker.string.alphanumeric({ length: { min: 40, max: 80 } })}`,
              data: Array.from({ length: 25 }, () => ({
                id: faker.string.alphanumeric({ length: { min: 14, max: 22 } }),
                remoteId: faker.string.numeric({ length: 16 }),
                name: faker.helpers.arrayElement([
                  'Health Insurance',
                  'Dental Coverage',
                  'Vision Plan',
                  '401(k) Match',
                ]),
                benefitType: 'Insurance',
                provider: faker.helpers.arrayElement([
                  'Blue Cross Blue Shield',
                  'Aetna',
                  'Cigna',
                  'United Healthcare',
                ]),
                description: 'Comprehensive health insurance covering medical, dental, and vision.',
                dateCreated: faker.date.recent({ days: 60 }).toISOString(),
              })),
            },
    },
  };
}

function generateExpiry(): { state: ExpiryState; days: number | null } {
  const state = pickWeighted<ExpiryState>([
    ['active', 60],
    ['expiring-soon', 18],
    ['expired', 14],
    ['not-available', 8],
  ]);
  if (state === 'active') return { state, days: faker.number.int({ min: 4, max: 30 }) };
  if (state === 'expiring-soon') return { state, days: faker.number.int({ min: 1, max: 3 }) };
  return { state, days: null };
}

function generateLog(referenceDate: Date, bucketWindowMs = 12 * 60 * 1000): Log {
  // Concentrate logs within the chart's visible time window so chart↔table hover
  // sync is meaningfully populated. ~85% land inside the window, ~15% are older
  // to provide some history for filtering/pagination.
  const insideWindow = faker.datatype.boolean({ probability: 0.85 });
  const offsetMs = insideWindow
    ? faker.number.int({ min: 0, max: bucketWindowMs })
    : faker.number.int({ min: bucketWindowMs, max: 12 * 60 * 60 * 1000 });
  const requestedAt = new Date(referenceDate.getTime() - offsetMs);
  const endpoint = faker.helpers.arrayElement(ENDPOINTS);
  const status = generateStatus();
  const expiry = generateExpiry();

  return {
    id: `log_${faker.string.alphanumeric(12)}`,
    requestedAt: requestedAt.toISOString(),
    account: generateAccount(),
    provider: generateProvider(),
    source: generateSource(),
    method: endpoint.method,
    endpoint: endpoint.endpoint,
    path: endpoint.path,
    durationMs: faker.number.int({ min: 80, max: 920 }),
    status,
    expiryState: expiry.state,
    expiresInDays: expiry.days,
    underlyingRequests: Array.from(
      { length: faker.number.int({ min: 0, max: 4 }) },
      () => generateUnderlyingRequest(status),
    ),
    hasAiExplainer: status >= 400 && faker.datatype.boolean({ probability: 0.6 }),
  };
}

export function generateLogs(count = 200, referenceDate = new Date()): Log[] {
  return Array.from({ length: count }, () => generateLog(referenceDate)).sort(
    (a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt),
  );
}

/**
 * Chart buckets — independent of the table dataset so we can show realistic
 * fleet-scale volume (hundreds of thousands of requests) without generating
 * that many Log objects. Distribution mirrors the Figma's 97/3 success-error
 * ratio with smoothed bar-to-bar variance.
 */
export const CHART_BUCKET_MS = 8 * 1000;
export const CHART_BUCKET_COUNT = 90;
export const CHART_WINDOW_MS = CHART_BUCKET_MS * CHART_BUCKET_COUNT;

export function generateChartSummary(bucketCount = CHART_BUCKET_COUNT, now = Date.now()): ChartSummary {
  const bucketMs = CHART_BUCKET_MS;
  const buckets: ChartBucket[] = [];

  let totalSuccess = 0;
  let totalError = 0;

  for (let i = bucketCount - 1; i >= 0; i--) {
    // Slight wave + noise so the chart reads as live traffic, not a flat ribbon.
    const wave = Math.sin(i / 6) * 200;
    const base = 1500 + wave;
    const success = Math.max(400, Math.floor(base + faker.number.int({ min: -200, max: 200 })));
    const error = Math.max(0, Math.floor(success * 0.035 + faker.number.int({ min: -10, max: 60 })));
    const timestamp = new Date(now - i * bucketMs).toISOString();
    buckets.push({ timestamp, success, error });
    totalSuccess += success;
    totalError += error;
  }

  const total = totalSuccess + totalError;
  return {
    buckets,
    totals: {
      total,
      success: totalSuccess,
      error: totalError,
      totalDelta: 0,
      successDelta: 0.02,
      errorDelta: -0.02,
    },
  };
}
