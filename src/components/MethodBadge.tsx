import type { HttpMethod } from '~/data/types';

type Props = { method: HttpMethod };

export function MethodBadge({ method }: Props) {
  return (
    <span className="method-badge" data-method={method.toLowerCase()}>
      {method}
    </span>
  );
}
