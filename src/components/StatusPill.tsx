import type { StatusCode } from '~/data/types';

type Props = { status: StatusCode };

function severity(status: StatusCode): 'success' | 'redirect' | 'client-error' | 'server-error' {
  if (status < 300) return 'success';
  if (status < 400) return 'redirect';
  if (status < 500) return 'client-error';
  return 'server-error';
}

export function StatusPill({ status }: Props) {
  return (
    <span className="status-pill" data-severity={severity(status)}>
      {status}
    </span>
  );
}
