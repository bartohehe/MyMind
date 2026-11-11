import type { ComponentType } from 'react';

import {
  ActivityIcon,
  CalendarIcon,
  DashboardIcon,
  DiaryIcon,
  MedsIcon,
  NotesIcon,
  ProfileIcon,
  ProjectsIcon,
  TodoIcon,
} from '@/components/icons';
import type { Dict } from '@/i18n/dictionaries';

/**
 * Jedyne źródło prawdy o zakładkach — sidebar, dolny pasek i tytuł w topbarze
 * biorą się stąd. Nazwy i podtytuły siedzą w słownikach pod `nav[key]` i `sub[key]`.
 *
 * Nowa zakładka = wpis tutaj + klucz w słownikach + katalog src/app/<href>.
 * `implemented: false` daje znacznik WIP w nawigacji (route może wtedy
 * renderować <WorkInProgress />).
 */
export type TabKey = keyof Dict['nav'];

export type Tab = {
  key: TabKey;
  href: string;
  Icon: ComponentType<{ size?: number }>;
  implemented: boolean;
};

export const TABS: readonly Tab[] = [
  { key: 'dashboard', href: '/', Icon: DashboardIcon, implemented: true },
  { key: 'profile', href: '/profil', Icon: ProfileIcon, implemented: true },
  { key: 'diary', href: '/dziennik', Icon: DiaryIcon, implemented: true },
  { key: 'activity', href: '/aktywnosc', Icon: ActivityIcon, implemented: true },
  { key: 'meds', href: '/leki', Icon: MedsIcon, implemented: true },
  { key: 'notes', href: '/notatki', Icon: NotesIcon, implemented: true },
  { key: 'projects', href: '/projekty', Icon: ProjectsIcon, implemented: true },
  { key: 'calendar', href: '/kalendarz', Icon: CalendarIcon, implemented: true },
  { key: 'todo', href: '/zadania', Icon: TodoIcon, implemented: true },
] as const;

export const APP_NAME = 'MyMind';

export function findTab(pathname: string): Tab | undefined {
  if (pathname === '/') return TABS.find((tab) => tab.href === '/');
  return TABS.find((tab) => tab.href !== '/' && pathname.startsWith(tab.href));
}
