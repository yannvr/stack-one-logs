import { CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';

type Props = {
  value: unknown;
  /** Top-level label, e.g. 'json'. */
  rootLabel?: string;
};

export function JsonViewer({ value, rootLabel = 'json' }: Props) {
  return (
    <div className="json-viewer">
      {rootLabel ? <div className="json-root-label">{rootLabel}</div> : null}
      <Node value={value} keyName="" depth={0} initiallyOpen />
    </div>
  );
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

type NodeProps = {
  value: unknown;
  keyName: string;
  depth: number;
  initiallyOpen?: boolean;
};

function Node({ value, keyName, depth, initiallyOpen = false }: NodeProps) {
  const [open, setOpen] = useState(initiallyOpen || depth < 2);

  if (Array.isArray(value)) {
    return (
      <Toggleable
        keyName={keyName}
        summary={<span className="json-meta">[…] {value.length} items</span>}
        open={open}
        onOpenChange={setOpen}
        depth={depth}
      >
        {value.map((item, i) => (
          <Node key={i} value={item} keyName={String(i)} depth={depth + 1} />
        ))}
      </Toggleable>
    );
  }

  if (isObject(value)) {
    const entries = Object.entries(value);
    return (
      <Toggleable
        keyName={keyName}
        summary={<span className="json-meta">{`{${entries.length} items}`}</span>}
        open={open}
        onOpenChange={setOpen}
        depth={depth}
      >
        {entries.map(([k, v]) => (
          <Node key={k} value={v} keyName={k} depth={depth + 1} />
        ))}
      </Toggleable>
    );
  }

  return (
    <div className="json-leaf" style={{ paddingLeft: depth * 12 }}>
      {keyName ? <span className="json-key">"{keyName}":</span> : null}
      <Primitive value={value} />
    </div>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="json-null">null</span>;
  if (typeof value === 'string') {
    return <span className="json-string">string"{value}"</span>;
  }
  if (typeof value === 'number') return <span className="json-number">{String(value)}</span>;
  if (typeof value === 'boolean') return <span className="json-bool">{String(value)}</span>;
  return <span>{String(value)}</span>;
}

type ToggleableProps = {
  keyName: string;
  summary: React.ReactNode;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  depth: number;
  children: React.ReactNode;
};

function Toggleable({ keyName, summary, open, onOpenChange, depth, children }: ToggleableProps) {
  return (
    <div className="json-toggle">
      <button
        type="button"
        className="json-toggle-header"
        style={{ paddingLeft: depth * 12 }}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
      >
        <CaretRight size={10} weight="bold" className={open ? 'json-caret open' : 'json-caret'} />
        {keyName ? <span className="json-key">{keyName}:</span> : null}
        {summary}
      </button>
      {open ? <div className="json-children">{children}</div> : null}
    </div>
  );
}
