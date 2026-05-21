import { ArrowsLeftRight, Check, Warning, XCircle } from '@phosphor-icons/react';
import { Tooltip } from '~/components/primitives/Tooltip';
import type { StatusCode } from '~/data/types';

type Props = { status: StatusCode };

type Severity = 'success' | 'redirect' | 'client-error' | 'server-error';

function severity(status: StatusCode): Severity {
  if (status < 300) return 'success';
  if (status < 400) return 'redirect';
  if (status < 500) return 'client-error';
  return 'server-error';
}

const ICON_BY_SEVERITY = {
  success: Check,
  redirect: ArrowsLeftRight,
  'client-error': Warning,
  'server-error': XCircle,
} as const;

const EXPLAIN_BY_SEVERITY = {
  success: 'Success — request completed',
  redirect: 'Redirect',
  'client-error': 'Client error — invalid request, auth, or rate limit',
  'server-error': 'Server error — provider unavailable',
} as const;

export function StatusPill({ status }: Props) {
  const sev = severity(status);
  const Icon = ICON_BY_SEVERITY[sev];
  return (
    <Tooltip content={`${status} · ${EXPLAIN_BY_SEVERITY[sev]}`}>
      <span className="status-pill" data-severity={sev}>
        <Icon size={10} weight="bold" aria-hidden="true" />
        {status}
      </span>
    </Tooltip>
  );
}
