import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { Tooltip } from '~/components/primitives/Tooltip';
import { cycleTheme, useTheme } from '~/lib/theme';

const ICON_BY_MODE = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} as const;

const LABEL_BY_MODE = {
  auto: 'Theme: Auto · click for Light',
  light: 'Theme: Light · click for Dark',
  dark: 'Theme: Dark · click for Auto',
} as const;

export function ThemeToggle() {
  const { mode } = useTheme();
  const Icon = ICON_BY_MODE[mode];
  return (
    <Tooltip content={LABEL_BY_MODE[mode]}>
      <button
        type="button"
        className="icon"
        onClick={cycleTheme}
        aria-label={LABEL_BY_MODE[mode]}
      >
        <Icon size={16} weight="regular" />
      </button>
    </Tooltip>
  );
}
