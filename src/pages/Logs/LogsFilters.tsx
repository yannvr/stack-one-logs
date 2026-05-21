import { ArrowsClockwise, MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '~/components/DateRangePicker';
import { Switch } from '~/components/primitives/Switch';

export type FiltersValue = {
  query: string;
  range: DateRange | undefined;
  backgroundLogs: boolean;
};

type Props = {
  value: FiltersValue;
  onChange: (next: FiltersValue) => void;
  onRefresh: () => void;
};

export function LogsFilters({ value, onChange, onRefresh }: Props) {
  // Local debounced state for the search input — keeps typing snappy without
  // re-running the query on every keystroke.
  const [searchDraft, setSearchDraft] = useState(value.query);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== value.query) onChange({ ...value, query: searchDraft });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <section className="logs-filters" aria-label="Filter logs">
      <div className="search">
        <MagnifyingGlass size={14} weight="regular" />
        <input
          type="search"
          placeholder="Search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          aria-label="Search logs"
        />
      </div>

      <DateRangePicker
        value={value.range}
        onChange={(range) => onChange({ ...value, range })}
      />

      <Switch
        checked={value.backgroundLogs}
        onCheckedChange={(next) => onChange({ ...value, backgroundLogs: next })}
        label="Background Logs"
      />

      <button type="button" className="outline" onClick={onRefresh}>
        <ArrowsClockwise size={14} weight="regular" />
        <span>Refresh</span>
      </button>
    </section>
  );
}
