'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { APP_NAME, TABS, findTab } from '@/config/tabs';
import { useI18n } from '@/i18n/client';

function useActiveHref(): string | undefined {
  const pathname = usePathname();
  return findTab(pathname)?.href;
}

/** Nawigacja boczna — desktop (≥820px). */
export function Sidebar() {
  const activeHref = useActiveHref();
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">M</span>
        <span className="brand-text">
          <span className="brand-name">{APP_NAME}</span>
          <span className="brand-sub">{t.app.tagline}</span>
        </span>
      </div>

      <nav className="side-nav" aria-label={APP_NAME}>
        {TABS.map(({ key, href, Icon, implemented }) => (
          <Link
            key={href}
            href={href}
            className="nav-item"
            aria-current={href === activeHref ? 'page' : undefined}
          >
            <Icon />
            {t.nav[key]}
            {implemented ? null : <span className="nav-wip">WIP</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">
        {t.app.tagline} · v1.0
      </div>
    </aside>
  );
}

/** Nawigacja dolna — mobile (<820px). */
export function MobileNav() {
  const activeHref = useActiveHref();
  const { t } = useI18n();

  return (
    <nav className="mobile-nav" aria-label={APP_NAME}>
      {TABS.map(({ key, href, Icon }) => (
        <Link
          key={href}
          href={href}
          className="mnav"
          aria-current={href === activeHref ? 'page' : undefined}
        >
          <Icon size={21} />
          {t.nav[key]}
        </Link>
      ))}
    </nav>
  );
}

/** Tytuł bieżącej zakładki w topbarze. */
export function TopbarTitle() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tab = findTab(pathname);
  return <span>{tab ? t.nav[tab.key] : APP_NAME}</span>;
}
