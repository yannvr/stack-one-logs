/**
 * Time formatting helpers. Uses native Intl APIs — no date-fns / dayjs.
 */

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const relativeFmt = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/** Format the date portion: `Aug 13`. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** Format the time-of-day with milliseconds: `21:05:19.123`. */
export function formatTimeWithMs(iso: string): string {
  const d = new Date(iso);
  const time = timeFmt.format(d);
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${time}.${ms}`;
}

/** Combined: `Aug 13 | 21:05:19.123`. Matches the Figma's pipe format. */
export function formatPipeTimestamp(iso: string): string {
  return `${formatDate(iso)} | ${formatTimeWithMs(iso)}`;
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

/** Relative time vs now: `2 minutes ago`, `just now`. */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffSec = (Date.parse(iso) - now) / 1000;
  const abs = Math.abs(diffSec);
  if (abs < 30) return 'just now';
  for (const [unit, perUnitSeconds] of UNITS) {
    if (abs >= perUnitSeconds || unit === 'second') {
      return relativeFmt.format(Math.round(diffSec / perUnitSeconds), unit);
    }
  }
  return 'just now';
}

/** `583 ms` or `1.2 s` for durations. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/** `580,000` with locale grouping. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

/** `↑2%` / `↓2%` / `0%`. */
export function formatDelta(d: number): { text: string; sign: 'up' | 'down' | 'flat' } {
  if (Math.abs(d) < 0.0005) return { text: '0%', sign: 'flat' };
  const pct = Math.round(d * 100);
  if (pct > 0) return { text: `↑ ${pct}%`, sign: 'up' };
  return { text: `↓ ${Math.abs(pct)}%`, sign: 'down' };
}
