import 'server-only';

import { cookies } from 'next/headers';

import { DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, isLocale, type Dict, type Locale } from './dictionaries';

/** Język z ciasteczka ustawianego przez przełącznik PL/EN w topbarze. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
