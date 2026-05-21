import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowSquareOut,
  ArrowsClockwise,
  DotsThree,
  Flask,
  GearSix,
  ListChecks,
} from '@phosphor-icons/react';

import type { Log } from '~/data/types';

type Props = {
  log: Log;
  onReplay?: (log: Log) => void;
  onBatchReplay?: (log: Log) => void;
  onRequestTester?: (log: Log) => void;
  onIntegration?: (log: Log) => void;
  onAccount?: (log: Log) => void;
};

export function RowActionsMenu({
  log,
  onReplay,
  onBatchReplay,
  onRequestTester,
  onIntegration,
  onAccount,
}: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="icon row-action"
          aria-label="Row actions"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThree size={16} weight="bold" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="menu-content"
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
        >
          <Item
            icon={<ArrowsClockwise size={14} weight="regular" />}
            title="Replay"
            subtitle="Replay the unified request"
            onClick={() => onReplay?.(log)}
          />
          <Item
            icon={<ListChecks size={14} weight="regular" />}
            title="Batch-Replay"
            subtitle="Replay all underlying requests"
            onClick={() => onBatchReplay?.(log)}
          />
          <DropdownMenu.Separator className="menu-separator" />
          <Item
            icon={<Flask size={14} weight="regular" />}
            title="Request Tester"
            subtitle="Populate request tester with log data"
            external
            onClick={() => onRequestTester?.(log)}
          />
          <Item
            icon={<GearSix size={14} weight="regular" />}
            title="Integration"
            external
            onClick={() => onIntegration?.(log)}
          />
          <Item
            icon={<GearSix size={14} weight="regular" />}
            title="Account"
            external
            onClick={() => onAccount?.(log)}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type ItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  external?: boolean;
  onClick?: () => void;
};

function Item({ icon, title, subtitle, external, onClick }: ItemProps) {
  return (
    <DropdownMenu.Item className="menu-item" onSelect={onClick}>
      <span className="menu-item-icon" aria-hidden="true">{icon}</span>
      <span className="menu-item-text">
        <span className="menu-item-title">
          {title}
          {external ? <ArrowSquareOut size={11} weight="regular" className="menu-item-ext" /> : null}
        </span>
        {subtitle ? <span className="menu-item-sub">{subtitle}</span> : null}
      </span>
    </DropdownMenu.Item>
  );
}
