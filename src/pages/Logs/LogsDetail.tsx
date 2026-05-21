import * as Accordion from '@radix-ui/react-accordion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowSquareOut,
  CaretRight,
  Check,
  CheckCircle,
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
  | 'gated'        // Feature flag off
  | 'collapsed'    // "Open to Generate"
  | 'generating'   // Spinner while we "compute" the explanation
  | 'generated'    // Body + steps + rating visible
  | 'submitting'   // Submit clicked, spinner on the button
  | 'submitted';   // Inline confirmation replaces rating/textarea

type ResolutionStep = {
  id: string;
  text: string;
  /** Step rendered as the "next action" — green tint + pre-checked. */
  primary?: boolean;
};

// Figma copy for the demo. In production these come from the model output.
const RESOLUTION_STEPS: ResolutionStep[] = [
  {
    id: 'step-1',
    text:
      'Check your client ID and client secret — the 403 error and "Wrong credentials" message indicate invalid authentication credentials.',
    primary: true,
  },
  {
    id: 'step-2',
    text:
      'Verify that your API credentials are correctly entered in capital letters in the COMPANY NAME field.',
  },
  {
    id: 'step-3',
    text:
      'Ensure your API credentials have the required permissions selected during generation (e.g. Employees, Attendances).',
  },
];

function ErrorExplainer({ log, onToast }: { log: Log; onToast?: (msg: string) => void }) {
  const [state, setState] = useState<ExplainerState>(log.hasAiExplainer ? 'collapsed' : 'gated');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  // Step 1 starts checked (the "completed" highlight from the Figma).
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(RESOLUTION_STEPS.filter((s) => s.primary).map((s) => s.id)),
  );

  // Simulate generation latency on click.
  useEffect(() => {
    if (state !== 'generating') return;
    const t = setTimeout(() => setState('generated'), 1500);
    return () => clearTimeout(t);
  }, [state]);

  // Simulate submit latency.
  useEffect(() => {
    if (state !== 'submitting') return;
    const t = setTimeout(() => {
      setState('submitted');
      onToast?.('Feedback Submitted');
    }, 700);
    return () => clearTimeout(t);
  }, [state, onToast]);

  function toggleStep(id: string) {
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      <div className="explainer-expanded" data-state="generating">
        <div className="explainer-row open">
          <span className="explainer-label">
            <Sparkle size={12} weight="regular" />
            Error Explainer
          </span>
          <span className="explainer-meta">Generating…</span>
          <span className="explainer-link">
            via <a href="#" onClick={(e) => e.preventDefault()}>Advanced Logs</a>
          </span>
        </div>
        <div className="explainer-loading">
          <span className="spinner" aria-hidden="true" />
          <span>Generating Explainer &amp; Resolution Steps</span>
        </div>
      </div>
    );
  }

  // generated / submitting / submitted all share the same body structure.
  const ratingVisible = rating > 0 && state !== 'submitted';
  return (
    <div className="explainer-expanded" data-state="generated">
      <div className="explainer-row open">
        <span className="explainer-label">
          <Sparkle size={12} weight="regular" />
          Error Explainer
        </span>
        <span className="explainer-meta">Generated</span>
        <span className="explainer-link">
          via <a href="#" onClick={(e) => e.preventDefault()}>Advanced Logs</a>
        </span>
      </div>
      <div className="explainer-body">
        <p className="explainer-summary">
          The error is specifically a <code>{log.status}</code>{' '}
          {log.status === 403 ? 'Forbidden' : log.status === 401 ? 'Unauthorized' : 'error'}{' '}
          with “Wrong credentials” message from {log.provider.name}’s authentication endpoint,
          which typically means either invalid or expired credentials. Following the resolution
          steps below should resolve the connection issue.
        </p>

        <h4 className="explainer-h">Resolution Steps:</h4>
        <ol className="resolution-steps">
          {RESOLUTION_STEPS.map((step, i) => {
            const isChecked = checked.has(step.id);
            return (
              <li
                key={step.id}
                className="resolution-step"
                data-primary={step.primary || undefined}
                data-checked={isChecked || undefined}
              >
                <span className="resolution-step-num">{i + 1}</span>
                <span className="resolution-step-text">{step.text}</span>
                <button
                  type="button"
                  className="resolution-step-check"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`Mark step ${i + 1} ${isChecked ? 'incomplete' : 'complete'}`}
                  onClick={() => toggleStep(step.id)}
                >
                  {isChecked ? <Check size={11} weight="bold" /> : null}
                </button>
              </li>
            );
          })}
        </ol>

        {state === 'submitted' ? (
          <p className="feedback-submitted">
            <CheckCircle size={14} weight="fill" />
            Feedback Submitted
          </p>
        ) : (
          <div className="feedback">
            <div className="feedback-prompt">
              <span>How would you rate this error explanation?</span>
              <StarRating
                value={rating}
                onChange={(n) => {
                  const wasZero = rating === 0;
                  setRating(n);
                  if (wasZero) onToast?.('Rating Provided');
                }}
              />
            </div>
            {ratingVisible ? (
              <>
                <textarea
                  placeholder="Please provide any additional context or feedback to help us improve the Error Explainer feature…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  disabled={state === 'submitting'}
                />
                <div className="feedback-actions">
                  <button
                    type="button"
                    className="primary"
                    data-loading={state === 'submitting' || undefined}
                    disabled={state === 'submitting'}
                    onClick={() => setState('submitting')}
                  >
                    {state === 'submitting' ? (
                      <>
                        Submit <span className="button-spinner" aria-hidden="true" />
                      </>
                    ) : (
                      'Submit'
                    )}
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
