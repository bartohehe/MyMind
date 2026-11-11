import 'server-only';

import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { activityDays, workouts, type ActivityDay, type Workout, type WorkoutType } from '@/db/schema';
import { addDays, startOfWeek, today } from '@/lib/date';

/** Cele dzienne. Stałe na v1 — wystarczy podmienić liczby. */
export const GOALS = { steps: 10_000, sleepMinutes: 8 * 60, calories: 2_500 } as const;

/** Ikony i kolory rodzajów aktywności z designu. */
export const WORKOUT_LOOK: Record<WorkoutType, { emoji: string; color: string; tint: string }> = {
  walk: { emoji: '🚶', color: 'var(--green)', tint: 'var(--green-soft)' },
  run: { emoji: '🏃', color: 'var(--accent)', tint: 'var(--accent-soft)' },
  gym: { emoji: '🏋️', color: 'var(--violet)', tint: 'var(--violet-soft)' },
  bike: { emoji: '🚴', color: 'var(--amber)', tint: 'var(--amber-soft)' },
  swim: { emoji: '🏊', color: 'var(--green)', tint: 'var(--green-soft)' },
  other: { emoji: '✨', color: 'var(--muted)', tint: 'var(--surface-2)' },
};

export async function getActivityDay(date: string): Promise<ActivityDay | undefined> {
  return db.select().from(activityDays).where(eq(activityDays.date, date)).get();
}

export type WeekStepsDay = { date: string; steps: number | null; isToday: boolean };

/** Kroki Pn–Nd bieżącego tygodnia; null = brak wpisu. */
export async function getWeekSteps(): Promise<WeekStepsDay[]> {
  const todayStr = today();
  const monday = startOfWeek(todayStr);
  const rows = db
    .select()
    .from(activityDays)
    .where(and(gte(activityDays.date, monday), lte(activityDays.date, addDays(monday, 6))))
    .all();
  const byDate = new Map(rows.map((row) => [row.date, row.steps]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return { date, steps: byDate.get(date) ?? null, isToday: date === todayStr };
  });
}

export async function getRecentWorkouts(limit = 8): Promise<Workout[]> {
  return db
    .select()
    .from(workouts)
    .orderBy(desc(workouts.date), desc(workouts.time), desc(workouts.id))
    .limit(limit)
    .all();
}
