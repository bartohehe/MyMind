import type { Locale } from '@/i18n/dictionaries';

/**
 * Daty dzienne trzymamy jako tekst 'YYYY-MM-DD' liczony w LOKALNEJ strefie
 * serwera (na Pi ustaw TZ w docker-compose.yml). Dzięki temu „dzisiaj" zmienia
 * się o lokalnej północy — na tym opiera się automatyczny reset checkboxów w Lekach.
 */

const INTL: Record<Locale, string> = { pl: 'pl-PL', en: 'en-US' };

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Dzisiejsza data lokalna jako 'YYYY-MM-DD'. */
export function today(): string {
  return toDateString(new Date());
}

/** 'YYYY-MM-DD' -> Date o lokalnej północy (bez przesunięć strefowych). */
export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value) ?? new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/** Poniedziałek tygodnia, w którym leży data. */
export function startOfWeek(value: string): string {
  const date = parseDate(value) ?? new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateString(date);
}

/** Pełne lata od daty urodzenia; null, gdy daty brak albo jest z przyszłości. */
export function ageFrom(birthDate: string): number | null {
  const birth = parseDate(birthDate);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

/* -------------------------------- Formatowanie ------------------------------ */

/** 'YYYY-MM-DD' -> „poniedziałek, 7 lipca 2025". */
export function formatDate(value: string, locale: Locale, withYear = true): string {
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(INTL[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
}

/** 'YYYY-MM-DD' -> „7 lip". */
export function formatShortDate(value: string, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(INTL[locale], { day: 'numeric', month: 'short' }).format(date);
}

/** Etykieta miesiąca, np. „listopad 2026". */
export function formatMonth(year: number, month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL[locale], { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
}

/** Skrót miesiąca do listy „Nadchodzące", np. „LIS". */
export function formatMonthShort(value: string, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(INTL[locale], { month: 'short' }).format(date).replace('.', '');
}

export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL[locale], { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
}

export function formatNumber(value: number, locale: Locale, fractionDigits = 0): string {
  return new Intl.NumberFormat(INTL[locale], {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Liczba do pola formularza: bez separatora tysięcy (parser by go nie przełknął),
 * z przecinkiem dziesiętnym po polsku. null -> ''.
 */
export function toInputNumber(value: number | null | undefined, locale: Locale): string {
  if (value === null || value === undefined) return '';
  const text = String(Math.round(value * 100) / 100);
  return locale === 'pl' ? text.replace('.', ',') : text;
}