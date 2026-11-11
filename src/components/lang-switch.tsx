'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { LOCALE_COOKIE, LOCALES, type Locale } from '@/i18n/dictionaries';
import { useI18n } from '@/i18n/client';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** PL/EN z designu. Zapisuje wybór w ciasteczku i odświeża Server Components. */
export function LangSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="seg-group"
      role="group"
      aria-label={t.langLabel}
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className="seg"
          data-active={code === locale}
          aria-pressed={code === locale}
          onClick={() => choose(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
