import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

type Props = {
  content: ReactNode;
  /** Only render the tooltip when this is true (e.g. only-if-truncated). */
  enabled?: boolean;
  side?: RadixTooltip.TooltipContentProps['side'];
  align?: RadixTooltip.TooltipContentProps['align'];
  children: ReactNode;
  /** Override the default 120ms delay (set to 0 for instant). */
  delayDuration?: number;
};

/**
 * Lightweight wrapper around Radix Tooltip. Matches the Figma dark-pill style
 * via the `.tooltip-content` class. Defaults to 120ms delay — fast enough to
 * feel responsive on intentional hovers, slow enough to not flicker on
 * cursor pass-throughs.
 */
export function Tooltip({ content, enabled = true, side = 'top', align = 'center', children, delayDuration }: Props) {
  if (!enabled) return <>{children}</>;
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="tooltip-content" side={side} align={align} sideOffset={6}>
          {content}
          <RadixTooltip.Arrow className="tooltip-arrow" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/** Centralized provider — set once at the app root. */
export const TooltipProvider = RadixTooltip.Provider;
