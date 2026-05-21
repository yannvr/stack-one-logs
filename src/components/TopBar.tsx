import { Command as CommandIcon, FileDoc } from '@phosphor-icons/react';
import { Tooltip } from '~/components/primitives/Tooltip';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  title: string;
};

export function TopBar({ title }: Props) {
  return (
    <header className="top-bar">
      <h1>{title}</h1>
      <div className="top-bar-actions">
        <Tooltip content="Press ⌘K (Ctrl+K) for the command palette">
          <span className="cmdk-hint" aria-hidden="true">
            <CommandIcon size={11} weight="regular" />K
          </span>
        </Tooltip>
        <ThemeToggle />
        <a className="outline docs-button" href="https://docs.stackone.com" target="_blank" rel="noreferrer">
          <FileDoc size={13} weight="regular" />
          <span>Docs</span>
        </a>
      </div>
    </header>
  );
}
