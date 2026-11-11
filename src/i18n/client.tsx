'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DEFAULT_LOCALE, dictionaries, type Dict, type Locale } from './dictionaries';

type I18n = { locale: Locale; t: Dict };

const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: dictionaries[DEFAULT_LOCALE],
});

/**
 * Serwer przekazuje tylko kod języka (string da się zserializować, funkcje
 * ze słownika — nie). Słownik klient importuje sam.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: dictionaries[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
