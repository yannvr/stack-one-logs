import {
  ArrowsClockwise,
  IdentificationCard,
  Key,
  Plugs,
  Sliders,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { SourceType } from '~/data/types';

const ICONS: Record<SourceType, PhosphorIcon> = {
  'Test Connection': Plugs,
  'Test Mapping': Sliders,
  Identifier: IdentificationCard,
  'Refresh Token': ArrowsClockwise,
  Key: Key,
};

export function SourceIcon({ type, size = 14 }: { type: SourceType; size?: number }) {
  const Icon = ICONS[type];
  return <Icon size={size} weight="regular" />;
}
