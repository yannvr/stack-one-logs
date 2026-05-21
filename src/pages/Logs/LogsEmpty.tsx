import { Stack } from '@phosphor-icons/react';

type Props = {
  variant?: 'no-integrations' | 'no-results';
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export function LogsEmpty({ variant = 'no-integrations', onPrimary, onSecondary }: Props) {
  if (variant === 'no-results') {
    return (
      <div className="empty-state" role="status">
        <Stack size={48} weight="duotone" color="var(--color-text-muted)" />
        <h3>No logs in this range</h3>
        <p>Try widening your time range or clearing filters.</p>
      </div>
    );
  }

  return (
    <div className="empty-state" role="status">
      <Stack size={48} weight="duotone" color="var(--color-accent)" />
      <h3>No log data just yet.</h3>
      <p>Ensure you have enabled your first integration, and setup a linked account.</p>
      <div className="empty-actions">
        <button type="button" className="outline" onClick={onSecondary}>
          Go to Integrations
        </button>
        <button type="button" className="primary" onClick={onPrimary}>
          Go to Linked Accounts
        </button>
      </div>
    </div>
  );
}
