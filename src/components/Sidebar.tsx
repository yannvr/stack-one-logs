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
              {/* Official StackOne logo (24×14), extracted from the Figma source. */}
              <svg viewBox="0 0 24 14" width="24" height="14" fill="none">
                <path d="M7.99992 4.66667H16V0H12.1786C9.87074 0 7.99992 0 7.99992 2.44709V4.66667Z" fill="url(#sb-grad-top)"/>
                <path d="M16 9.33328H7.99992V13.9999H11.8213C14.129 13.9999 16 13.9999 16 11.5529V9.33328Z" fill="url(#sb-grad-bottom)"/>
                <path d="M16 0H8.02667H0L3.91802e-07 9.33334H8.02667V4.66751L8.02555 4.46984C8.01146 2.00536 10.0054 0 12.4699 0H16Z" fill="#00AF66"/>
                <path d="M7.99992 13.9999H15.9732H23.9999V4.66664H15.9732V9.33246L15.9744 9.53012C15.9884 11.9946 13.9945 13.9999 11.53 13.9999H7.99992Z" fill="#00AF66"/>
                <defs>
                  <linearGradient id="sb-grad-top" x1="16" y1="2.33333" x2="7.99992" y2="2.33333" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00AF66"/>
                    <stop offset="1" stopColor="#285C4D"/>
                  </linearGradient>
                  <linearGradient id="sb-grad-bottom" x1="7.99992" y1="11.6666" x2="16" y2="11.6666" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00AF66"/>
                    <stop offset="1" stopColor="#285C4D"/>
                  </linearGradient>
                </defs>
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

  // Tooltips are only useful when the sidebar is collapsed (label is hidden).
  // When expanded, the label is right there next to the icon — adding a
  // tooltip duplicates information and shows up redundantly on active items.
  const tooltipContent = (
    <>
      {label}
      {stub ? <span className="tooltip-meta"> · stub</span> : null}
    </>
  );

  return (
    <li>
      <Tooltip content={tooltipContent} side="right" enabled={collapsed}>
        {inner}
      </Tooltip>
    </li>
  );
}
