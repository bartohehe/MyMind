import 'server-only';

import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { events, type CalendarEvent, type EventCategory } from '@/db/schema';
import { parseDate, toDateString } from '@/lib/date';

/** Kolory kategorii z designu. */
export const CATEGORY_COLOR: Record<EventCategory, string> = {
  health: 'var(--green)',
  work: 'var(--violet)',
  personal: 'var(--amber)',
  project: 'var(--accent)',
};

export type MonthView = {
  year: number;
  /** 0–11, jak w Date. */
  month: number;
  /** Klucz miesiąca do URL-a, np. '2026-11'. */
  key: string;
  prevKey: string;
  nextKey: string;
  /** Komórki siatki Pn–Nd; null = pusta komórka spoza miesiąca. */
  cells: (string | null)[];
};

const monthKey = (year: number, month: number) => {
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Czyta `?m=YYYY-MM&d=YYYY-MM-DD`; śmieci w URL-u = dzisiaj. */
export function resolveView(
  rawMonth: unknown,
  rawDay: unknown,
  todayStr: string,
): { view: MonthView; selected: string } {
  const day = typeof rawDay === 'string' && parseDate(rawDay) ? rawDay : null;
  const monthMatch = typeof rawMonth === 'string' ? /^(\d{4})-(\d{2})$/.exec(rawMonth) : null;

  let year: number;
  let month: number;
  if (monthMatch && Number(monthMatch[2]) >= 1 && Number(monthMatch[2]) <= 12) {
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]) - 1;
  } else {
    const base = parseDate(day ?? todayStr) ?? new Date();
    year = base.getFullYear();
    month = base.getMonth();
  }

  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startDow }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateString(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const key = monthKey(year, month);
  // Zaznaczony dzień: z URL-a, a gdy go nie ma — dziś (jeśli w tym miesiącu) albo 1. dzień.
  const selected = day ?? (todayStr.startsWith(key) ? todayStr : `${key}-01`);

  return {
    view: { year, month, key, prevKey: monthKey(year, month - 1), nextKey: monthKey(year, month + 1), cells },
    selected,
  };
}

export async function getEventsBetween(from: string, to: string): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(events)
    .where(and(gte(events.date, from), lte(events.date, to)))
    .orderBy(asc(events.date), asc(events.time), asc(events.id));
}

export async function getEventsOn(date: string): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.date, date))
    .orderBy(asc(events.time), asc(events.id));
}

export async function getUpcomingEvents(from: string, limit = 6): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(events)
    .where(gte(events.date, from))
    .orderBy(asc(events.date), asc(events.time), asc(events.id))
    .limit(limit);
}
