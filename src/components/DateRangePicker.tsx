import * as Popover from '@radix-ui/react-popover';
import { Calendar, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { Tooltip } from '~/components/primitives/Tooltip';

type Props = {
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
};

const dateFmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) return 'All time';
  if (!range.to) return dateFmt.format(range.from);
  // Same-day range (e.g. chart bar-click → 8s window): show as date + time-range
  // so the user can read what's actually selected.
  if (sameDay(range.from, range.to)) {
    return `${dateFmt.format(range.from)} · ${timeFmt.format(range.from)}–${timeFmt.format(range.to)}`;
  }
  return `${dateFmt.format(range.from)} – ${dateFmt.format(range.to)}`;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const hasFilter = !!value?.from;

  return (
    <div className="date-range" data-active={hasFilter || undefined}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className="outline date-range-trigger">
            <Calendar size={14} weight="regular" />
            <span>{formatRange(value)}</span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="popover-content"
            sideOffset={6}
            align="start"
            collisionPadding={12}
          >
            <DayPicker
              mode="range"
              numberOfMonths={2}
              selected={value}
              onSelect={onChange}
              classNames={{
                root: 'rdp',
                caption_label: 'rdp-caption-label',
                day_selected: 'rdp-day_selected',
                day_range_middle: 'rdp-day_range_middle',
                day_range_start: 'rdp-day_range_start',
                day_range_end: 'rdp-day_range_end',
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {hasFilter ? (
        <Tooltip content="Clear time range">
          <button
            type="button"
            className="icon date-range-clear"
            onClick={() => onChange(undefined)}
            aria-label="Clear time range"
          >
            <X size={12} weight="bold" />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
