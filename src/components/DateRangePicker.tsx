import * as Popover from '@radix-ui/react-popover';
import { Calendar } from '@phosphor-icons/react';
import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type Props = {
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
};

const fmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) return 'All time';
  if (!range.to) return fmt.format(range.from);
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
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
  );
}
