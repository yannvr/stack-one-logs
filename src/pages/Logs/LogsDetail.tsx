import * as Accordion from '@radix-ui/react-accordion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowSquareOut,
  CaretRight,
  Copy,
  Sparkle,
  Star,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Avatar } from '~/components/Avatar';
import { JsonViewer } from '~/components/JsonViewer';
import { MethodBadge } from '~/components/MethodBadge';
import { SourceIcon } from '~/components/SourceIcon';
import { StatusPill } from '~/components/StatusPill';
import { Drawer } from '~/components/primitives/Drawer';
import { Tooltip } from '~/components/primitives/Tooltip';
import type { Log, UnderlyingRequest } from '~/data/types';
import { formatDuration, formatPipeTimestamp } from '~/lib/time';

type Props = {
  log: Log | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (direction: 1 | -1) => void;
  onToast?: (msg: string) => void;
};

function ExpiryBadge({ log }: { log: Log }) {
  if (log.expiryState === 'expired') {
    return <span className="expiry expiry-expired"><span className="dot" /> Expired</span>;
  }
  if (log.expiryState === 'not-available') {
    return <span className="expiry expiry-not-available"><span className="dot" /> Not Available</span>;
  }
  if (log.expiryState === 'expiring-soon') {
    return <span className="expiry expiry-soon"><span className="dot" /> {log.expiresInDays} Day{log.expiresInDays === 1 ? '' : 's'}</span>;
  }
  return <span className="expiry expiry-active"><span className="dot" /> {log.expiresInDays} Days</span>;
}

export function LogsDetail({ log, open, onOpenChange, onNavigate, onToast }: Props) {
  const [tab, setTab] = useState<'details' | 'underlying'>('details');

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        onNavigate?.(1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        onNavigate?.(-1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onNavigate]);

  if (!log) return null;

  const headerLeft = (
    <span className="drawer-title">
      <MethodBadge method={log.method} />
      <span className="drawer-title-text">
        {log.provider.vertical} <span className="drawer-title-sep">|</span> {log.endpoint}
      </span>
    </span>
  );

  const headerRight = (
    <span className="drawer-title-meta">
      <span className="ts">{formatPipeTimestamp(log.requestedAt)}</span>
      <span className="dur">{formatDuration(log.durationMs)}</span>
      <StatusPill status={log.status} />
    </span>
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="drawer-title-row">
          {headerLeft}
          {headerRight}
        </div>
      }
      footer={
        <span className="drawer-shortcuts">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>esc</kbd> Close</span>
        </span>
      }
    >
      <MetadataStrip log={log} />
      <UrlStrip url={`https://api.${log.provider.name.toLowerCase().replace(/\s+/g, '-')}.com/v1${log.path.replace(':id', log.account.id)}`} />

      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'details' | 'underlying')}>
        <Tabs.List className="drawer-tabs" aria-label="Log sections">
          <Tabs.Trigger value="details" className="drawer-tab">Details</Tabs.Trigger>
          <Tabs.Trigger value="underlying" className="drawer-tab">
            Underlying Requests
            {log.underlyingRequests.length > 0 ? (
              <span className="underlying-count">{log.underlyingRequests.length}</span>
            ) : null}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="details" className="drawer-tab-panel">
          <DetailsTab log={log} onToast={onToast} />
        </Tabs.Content>

        <Tabs.Content value="underlying" className="drawer-tab-panel">
          <UnderlyingTab requests={log.underlyingRequests} />
        </Tabs.Content>
      </Tabs.Root>
    </Drawer>
  );
}

function MetadataStrip({ log }: { log: Log }) {
  return (
    <dl className="metadata-strip">
      <div>
        <dt>Provider</dt>
        <dd>
          <span className="provider-mark" aria-hidden="true" />
          {log.provider.name}
        </dd>
      </div>
      <div>
        <dt>Organization</dt>
        <dd>
          <Avatar id={log.account.id} name={log.account.name} />
          {log.account.name}
        </dd>
      </div>
      <div>
        <dt>Source</dt>
        <dd>
          <SourceIcon type={log.source.type} />
          {log.source.label}
        </dd>
      </div>
      <div>
        <dt>Expires</dt>
        <dd>
          <ExpiryBadge log={log} />
        </dd>
      </div>
    </dl>
  );
}

function UrlStrip({ url }: { url: string }) {
  return (
    <div className="url-strip">
      <span className="url-label">URL</span>
      <Tooltip content={<code>{url}</code>} align="start">
        <code className="url-value">{url}</code>
      </Tooltip>
      <Tooltip content="Copy URL">
        <button type="button" className="icon" aria-label="Copy URL">
          <Copy size={14} weight="regular" />
        </button>
      </Tooltip>
    </div>
  );
}

function DetailsTab({ log, onToast }: { log: Log; onToast?: (msg: string) => void }) {
  const primary = log.underlyingRequests[0];
  return (
    <div className="details-tab">
      <Accordion.Root type="multiple" defaultValue={['response']} className="accordion">
        <Section title="Request" rightBadge={<MethodBadge method={log.method} />} value="request">
          <SubAccordion items={[
            { id: 'headers', title: 'Headers', content: <KeyValueList rows={primary?.request.headers ?? {}} /> },
            { id: 'queryparams', title: 'Query Parameters', content: <KeyValueList rows={primary?.request.queryParams ?? {}} /> },
            { id: 'body', title: 'Body', content: primary?.request.body ? <JsonViewer value={primary.request.body} /> : <p className="muted">No request body.</p> },
          ]} />
        </Section>

        <Section title="Response" rightBadge={<StatusPill status={log.status} />} value="response">
          <SubAccordion items={[
            {
              id: 'rheaders',
              title: 'Headers',
              disabled: !primary?.response.available,
              trailing: !primary?.response.available ? <NotAvailable log={log} /> : undefined,
              content: <KeyValueList rows={primary?.response.headers ?? {}} />,
            },
            {
              id: 'rbody',
              title: 'Body',
              disabled: !primary?.response.body,
              trailing: !primary?.response.body ? <NotAvailable log={log} /> : undefined,
              content: primary?.response.body
                ? <JsonViewer value={primary.response.body} />
                : null,
            },
          ]} />
        </Section>
      </Accordion.Root>

      {/* AI Explainer is an error-only feature — only render for 4xx / 5xx logs. */}
      {log.status >= 400 ? (
        <ErrorExplainer key={log.id} log={log} onToast={onToast} />
      ) : null}
    </div>
  );
}

function UnderlyingTab({ requests }: { requests: UnderlyingRequest[] }) {
  if (requests.length === 0) {
    return <p className="muted" style={{ padding: 'var(--space-4)' }}>No underlying requests.</p>;
  }
  return (
    <div className="underlying-list">
      <div className="underlying-list-head">
        <span>Requested</span>
        <span>Request</span>
        <span className="num">Duration</span>
        <span>Status</span>
      </div>
      {requests.map((r) => (
        <div className="underlying-row" key={r.id}>
          <span className="ts">{formatPipeTimestamp(r.requestedAt)}</span>
          <span className="req">
            <MethodBadge method={r.method} />
          </span>
          <span className="num">{formatDuration(r.durationMs)}</span>
          <span><StatusPill status={r.status} /></span>
          <code className="url">{r.url}</code>
          <button type="button" className="icon" aria-label="Open in request tester">
            <ArrowSquareOut size={14} weight="regular" />
          </button>
        </div>
      ))}
    </div>
  );
}

type SectionProps = {
  title: string;
  value: string;
  rightBadge: React.ReactNode;
  children: React.ReactNode;
};

function Section({ title, value, rightBadge, children }: SectionProps) {
  return (
    <Accordion.Item value={value} className="accordion-item top-section">
      <Accordion.Header asChild>
        <div className="section-head">
          <Accordion.Trigger className="section-toggle">
            <CaretRight size={12} weight="bold" className="caret" />
            <span>{title}</span>
          </Accordion.Trigger>
          <span className="section-badge">{rightBadge}</span>
        </div>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">{children}</Accordion.Content>
    </Accordion.Item>
  );
}

type SubItem = {
  id: string;
  title: string;
  content: React.ReactNode;
  /** Right-aligned summary shown on the row header (e.g. "Not available"). */
  trailing?: React.ReactNode;
  /** When true, the row is not expandable. */
  disabled?: boolean;
};

function SubAccordion({ items }: { items: SubItem[] }) {
  return (
    <Accordion.Root type="multiple" className="sub-accordion">
      {items.map((it) => (
        <Accordion.Item value={it.id} key={it.id} className="accordion-item">
          <Accordion.Header asChild>
            <div className="sub-row">
              <Accordion.Trigger className="sub-toggle" disabled={it.disabled}>
                {!it.disabled ? (
                  <CaretRight size={10} weight="bold" className="caret" />
                ) : (
                  <span className="caret caret-placeholder" aria-hidden="true" />
                )}
                <span>{it.title}</span>
              </Accordion.Trigger>
              {it.trailing ? <span className="sub-trailing">{it.trailing}</span> : null}
            </div>
          </Accordion.Header>
          {!it.disabled ? (
            <Accordion.Content className="accordion-content">
              <div className="sub-body">{it.content}</div>
            </Accordion.Content>
          ) : null}
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

/**
 * "Not available" — explains via tooltip why the body/headers couldn't be
 * captured. Reasoned from the log's expiry state, matching the Figma frames
 * 11/12/13 which all show a tooltip-anchored explanation on these rows.
 */
function NotAvailable({ log }: { log: Log }) {
  let reason: string;
  if (log.expiryState === 'expired') {
    reason =
      'This log has expired. Log storage duration can be updated via the Advanced Logs tab on Project Settings.';
  } else if (log.expiryState === 'not-available') {
    reason =
      'The provider did not return a response body. Common with 4xx errors before a request body is parsed.';
  } else if (log.status >= 400) {
    reason = `The provider returned ${log.status} before a response body was sent.`;
  } else {
    reason = 'No response body was captured for this log.';
  }
  return (
    <Tooltip content={reason} side="left" align="end">
      <span className="not-available" tabIndex={0}>
        Not available
      </span>
    </Tooltip>
  );
}

function KeyValueList({ rows }: { rows: Record<string, string> }) {
  const entries = Object.entries(rows);
  if (entries.length === 0) return <p className="muted">None.</p>;
  return (
    <ul className="kv-list">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="kv-key">{k}</span>
          <Tooltip content={<code>{v}</code>} align="end" enabled={v.length > 40}>
            <span className="kv-value">{v}</span>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

type ExplainerState =
  | 'gated'
  | 'collapsed'
  | 'generating'
  | 'generated'
  | 'feedback-open'
  | 'submitted';

function ErrorExplainer({ log, onToast }: { log: Log; onToast?: (msg: string) => void }) {
  const [state, setState] = useState<ExplainerState>(log.hasAiExplainer ? 'collapsed' : 'gated');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Simulate generation latency on click.
  useEffect(() => {
    if (state !== 'generating') return;
    const t = setTimeout(() => setState('generated'), 1500);
    return () => clearTimeout(t);
  }, [state]);

  function submitFeedback() {
    onToast?.('Feedback Submitted');
    setState('submitted');
  }

  if (state === 'gated') {
    return (
      <div className="explainer-row gated">
        <span className="explainer-label">
          <Sparkle size={12} weight="regular" />
          Error Explainer
        </span>
        <span className="explainer-meta">Feature Not Enabled</span>
        <span className="explainer-link">
          via <a href="#">Advanced Logs</a> &amp; <a href="#">AI Features</a>
        </span>
      </div>
    );
  }

  if (state === 'collapsed') {
    return (
      <button
        type="button"
        className="explainer-row collapsed"
        onClick={() => setState('generating')}
      >
        <span className="explainer-label">
          <Sparkle size={12} weight="regular" />
          Error Explainer
        </span>
        <span className="explainer-meta">◇ Open to Generate</span>
        <span className="explainer-link">
          via <a href="#">Advanced Logs</a>
        </span>
      </button>
    );
  }

  if (state === 'generating') {
    return (
      <div className="explainer-expanded">
        <div className="explainer-row open">
          <span className="explainer-label">
            <Sparkle size={12} weight="regular" />
            Error Explainer
          </span>
          <span className="explainer-meta">◇ Generating…</span>
          <span className="explainer-link">
            via <a href="#">Advanced Logs</a>
          </span>
        </div>
        <div className="explainer-loading">
          <span className="spinner" aria-hidden="true" />
          Generating Explainer &amp; Resolution Steps
          <a href="#" className="explainer-link">via Advanced Logs</a>
        </div>
      </div>
    );
  }

  return (
    <div className="explainer-expanded">
      <div className="explainer-row open">
        <span className="explainer-label">
          <Sparkle size={12} weight="regular" />
          Error Explainer
        </span>
        <span className="explainer-meta">◇ Generated</span>
        <span className="explainer-link">via <a href="#">Advanced Logs</a></span>
      </div>
      <div className="explainer-body">
        <section className="explainer-section">
          <h4>Explainer</h4>
          <p>
            Based on the error information and documentation search results, I can provide the
            following analysis and resolution steps for the{' '}
            <code>{log.method} {log.path}</code> request that returned{' '}
            <code>{log.status}</code>.
          </p>
          <p>
            The error is likely due to an invalid webhook endpoint configuration for{' '}
            {log.provider.name} account creation events. Since there are no{' '}
            <code>provider_errors</code> in the response, this indicates the issue is with the
            webhook configuration rather than the {log.provider.name} API itself.
          </p>
        </section>

        <section className="explainer-section">
          <h4>Resolution Steps</h4>
          <ol className="resolution-steps">
            <li>
              <p>
                Verify that the webhook URL is correctly configured and accessible:{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  https://typedwebhook.tools/webhook/e41181cd-8173-4f49-8c71-92edccb19889
                </a>
              </p>
            </li>
            <li>
              <p>
                Check that your {log.provider.name} integration has the necessary permissions to
                create and manage webhook subscriptions.
              </p>
            </li>
            <li>
              <p>
                Re-register the webhook endpoint in your StackOne integration settings for the{' '}
                {log.provider.name} <code>account_created</code> event.
              </p>
            </li>
            <li>
              <p>
                If the issue persists, contact StackOne support via your dedicated Slack channel
                or at{' '}
                <a href="mailto:support@stackone.com" onClick={(e) => e.preventDefault()}>
                  support@stackone.com
                </a>
                .
              </p>
            </li>
          </ol>
        </section>

        <section className="explainer-section">
          <h4>Sources</h4>
          <ol className="sources">
            <li>[1] Example Source Title — example.com</li>
            <li>[2] Example Source Title — example.com</li>
            <li>[3] Example Source Title — example.com</li>
            <li>[4] Example Source Title — example.com</li>
            <li>[5] Example Source Title — example.com</li>
          </ol>
        </section>
        {state === 'submitted' ? (
          <p className="muted" style={{ marginTop: 'var(--space-3)' }}>Thanks for the feedback.</p>
        ) : (
          <div className="feedback">
            <div className="feedback-prompt">
              <span>How would you rate this error explanation?</span>
              <StarRating
                value={rating}
                onChange={(n) => {
                  setRating(n);
                  if (state === 'generated') {
                    setState('feedback-open');
                    onToast?.('Rating Provided');
                  }
                }}
              />
            </div>
            {state === 'feedback-open' ? (
              <>
                <textarea
                  placeholder="What worked, what didn't? (Optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="feedback-actions">
                  <button type="button" className="ghost" onClick={() => setState('generated')}>
                    Cancel
                  </button>
                  <button type="button" className="primary" onClick={submitFeedback}>
                    Submit
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="star-rating" role="radiogroup" aria-label="Rate this explanation">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            className="icon"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <Star
              size={16}
              weight={filled ? 'fill' : 'regular'}
              color={filled ? 'var(--color-status-warning)' : undefined}
            />
          </button>
        );
      })}
    </span>
  );
}
