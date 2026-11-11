'use client';

import { useEffect, useState } from 'react';

import { MoonIcon, SunIcon } from '@/components/icons';
import { useI18n } from '@/i18n/client';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'mymind-theme';

/**
 * Skrypt wstrzykiwany przed hydratacją — ustawia motyw zanim przeglądarka
 * cokolwiek narysuje, więc nie ma mignięcia jasnym tłem przy ciemnym motywie.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export function ThemeToggle() {
  const { t } = useI18n();
  // Do hydratacji nie znamy motywu ustawionego przez skrypt — startujemy od
  // 'light' (tak jak HTML z serwera) i czytamy prawdziwy stan w efekcie.
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light');
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Prywatny tryb przeglądarki — motyw po prostu nie przetrwa odświeżenia.
    }
    setTheme(next);
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={isDark ? t.theme.toLight : t.theme.toDark}
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span>{isDark ? t.theme.dark : t.theme.light}</span>
    </button>
  );
}
