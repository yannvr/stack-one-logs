import {
  BookOpen,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretUpDown,
  Gear,
  House,
  Key,
  Lightning,
  ListChecks,
  Plug,
  ShieldCheck,
  Sliders,
  UsersThree,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';

import { Tooltip } from '~/components/primitives/Tooltip';
import { useSidebarStore } from '~/state/sidebarStore';

type NavItem = {
  to: string;
  label: string;
  icon: PhosphorIcon;
  /** Routes other than /logs are stubs in this demo. */
  stub?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/overview', label: 'Overview', icon: House, stub: true },
      { to: '/accounts', label: 'Accounts', icon: UsersThree, stub: true },
      { to: '/logs', label: 'Logs', icon: ListChecks },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/field-mapping', label: 'Field Mapping', icon: Sliders, stub: true },
      { to: '/integrations', label: 'Integrations', icon: Plug, stub: true },
      { to: '/api-keys', label: 'API Keys', icon: Key, stub: true },
      { to: '/webhooks', label: 'Webhooks', icon: Lightning, stub: true },
      { to: '/settings', label: 'Project Settings', icon: Gear, stub: true },
    ],
  },
];

const SUPPORT: NavSection = {
  title: 'Support',
  items: [
    { to: '/field-coverage', label: 'Field Coverage', icon: ShieldCheck, stub: true },
    { to: '/docs', label: 'Documentation', icon: BookOpen, stub: true },
  ],
};

export function Sidebar() {
  const isCollapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className="sidebar"
      aria-label="Primary navigation"
      data-collapsed={isCollapsed || undefined}
    >
      <header className="sidebar-header">
        <Tooltip content="Production [EU1]" side="right" enabled={isCollapsed}>
          <button type="button" className="env-switcher" aria-label="Switch environment">
            <span className="env-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M3 7l9-5 9 5-9 5-9-5z" fill="var(--color-accent)" />
                <path d="M3 12l9 5 9-5" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.55" />
                <path d="M3 17l9 5 9-5" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.3" />
              </svg>
            </span>
            <span className="env-name">Production [EU1]</span>
            <CaretUpDown size={14} weight="regular" className="env-caret" />
          </button>
        </Tooltip>
      </header>

        <nav className="sidebar-nav">
          {[...SECTIONS, SUPPORT].map((section) => (
            <section key={section.title}>
              <h3 className="sidebar-section-title">{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <SidebarItem key={item.to} item={item} collapsed={isCollapsed} />
                ))}
              </ul>
            </section>
          ))}
        </nav>

      <footer className="sidebar-footer">
        <Tooltip content="Morgan Williams" side="right" enabled={isCollapsed}>
          <button type="button" className="account-button" aria-label="Account menu">
            <span className="account-avatar" aria-hidden="true">M</span>
            <span className="account-name">Morgan Williams</span>
            <Gear size={14} weight="regular" className="account-gear" />
          </button>
        </Tooltip>
        <Tooltip content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <CaretDoubleRight size={14} weight="regular" />
            ) : (
              <CaretDoubleLeft size={14} weight="regular" />
            )}
          </button>
        </Tooltip>
      </footer>
    </aside>
  );
}

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { to, label, icon: Icon, stub } = item;
  const inner = stub ? (
    <button
      type="button"
      className="sidebar-link"
      data-stub="true"
      aria-disabled="true"
      onClick={(e) => {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.warn(
          `[stack-one] Navigation to "${to}" is a stub. Only /logs is implemented in this demo.`,
        );
      }}
    >
      <Icon size={16} weight="regular" />
      <span>{label}</span>
    </button>
  ) : (
    <NavLink to={to} end={to === '/'} className="sidebar-link">
      {({ isActive }) => (
        <>
          <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );

  const tooltipContent = (
    <>
      {label}
      {stub ? <span className="tooltip-meta"> · stub</span> : null}
    </>
  );

  return (
    <li>
      <Tooltip content={tooltipContent} side="right" enabled={collapsed || stub}>
        {inner}
      </Tooltip>
    </li>
  );
}
