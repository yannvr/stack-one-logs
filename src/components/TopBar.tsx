import { BookOpen } from '@phosphor-icons/react';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  title: string;
};

export function TopBar({ title }: Props) {
  return (
    <header className="top-bar">
      <h1>{title}</h1>
      <div className="top-bar-actions">
        <ThemeToggle />
        <a className="outline" href="https://docs.stackone.com" target="_blank" rel="noreferrer">
          <BookOpen size={14} weight="regular" />
          <span>Docs</span>
        </a>
      </div>
    </header>
  );
}
