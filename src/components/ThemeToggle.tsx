import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { cycleTheme, useTheme } from '~/lib/theme';

const ICON_BY_MODE = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} as const;

const LABEL_BY_MODE = {
  auto: 'Follow system theme',
  light: 'Light theme',
  dark: 'Dark theme',
} as const;

export function ThemeToggle() {
  const { mode } = useTheme();
  const Icon = ICON_BY_MODE[mode];
  return (
    <button
      type="button"
      className="icon"
      onClick={cycleTheme}
      aria-label={`${LABEL_BY_MODE[mode]} — click to switch`}
      title={LABEL_BY_MODE[mode]}
    >
      <Icon size={16} weight="regular" />
    </button>
  );
}
