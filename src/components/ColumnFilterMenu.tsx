import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CaretDown, Check, FunnelSimple, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

export type FilterOption = {
  value: string;
  label: string;
  /** Optional inline glyph rendered before the label. */
  prefix?: React.ReactNode;
};

type Props = {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** When > ~8 options, show a search input. */
  searchable?: boolean;
};

export function ColumnFilterMenu({ label, options, selected, onChange, searchable }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="th-filter"
          data-active={selected.length > 0 || undefined}
          aria-label={`Filter by ${label}`}
        >
          <FunnelSimple size={11} weight={selected.length > 0 ? 'fill' : 'regular'} />
          {selected.length > 0 ? <span className="th-filter-count">{selected.length}</span> : null}
          <CaretDown size={9} weight="bold" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="filter-menu" align="start" sideOffset={6}>
          {searchable ? (
            <div className="filter-search">
              <MagnifyingGlass size={12} weight="regular" />
              <input
                type="search"
                placeholder={`Search ${label.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          ) : null}
          <ul className="filter-options" role="group">
            {filtered.length === 0 ? (
              <li className="filter-empty">No matches.</li>
            ) : (
              filtered.map((o) => {
                const checked = selected.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      className="filter-option"
                      data-checked={checked || undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        toggle(o.value);
                      }}
                    >
                      <span className="filter-checkbox" aria-hidden="true">
                        {checked ? <Check size={10} weight="bold" /> : null}
                      </span>
                      {o.prefix}
                      <span className="filter-option-label">{o.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {selected.length > 0 ? (
            <button
              type="button"
              className="filter-clear"
              onClick={() => {
                onChange([]);
              }}
            >
              <X size={11} weight="bold" />
              Clear {label.toLowerCase()} filter
            </button>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
