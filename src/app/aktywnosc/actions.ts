'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { WORKOUT_TYPES, activityDays, workouts } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  isoDate,
  ok,
  optionalNumber,
  optionalTime,
  parseForm,
  type ActionState,
} from '@/lib/actions';

const PATH = '/aktywnosc';

const daySchema = z.object({
  date: isoDate,
  steps: optionalNumber({ min: 0, max: 200_000, integer: true }),
  sleepHours: optionalNumber({ min: 0, max: 24 }),
  calories: optionalNumber({ min: 0, max: 20_000, integer: true }),
});

/** Statystyki dnia — jeden wiersz na datę, upsert. */
export async function saveActivityDay(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(daySchema, formData, t);
  if (!parsed.success) return parsed.state;

  const { date, steps, sleepHours, calories } = parsed.data;
  const values = {
    steps,
    sleepMinutes: sleepHours === null ? null : Math.round(sleepHours * 60),
    calories,
    updatedAt: new Date(),
  };

  try {
    db.insert(activityDays)
      .values({ date, ...values })
      .onConflictDoUpdate({ target: activityDays.date, set: values })
      .run();
  } catch (error) {
    console.error('saveActivityDay', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath(PATH);
  return ok(t.activity.statsSaved);
}

const workoutSchema = z.object({
  type: z.enum(WORKOUT_TYPES),
  date: isoDate,
  time: optionalTime,
  distanceKm: optionalNumber({ min: 0, max: 1_000 }),
  durationMin: optionalNumber({ min: 0, max: 1_440, integer: true }),
  calories: optionalNumber({ min: 0, max: 20_000, integer: true }),
});

export async function createWorkout(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(workoutSchema, formData, t);
  if (!parsed.success) return parsed.state;

  try {
    db.insert(workouts).values(parsed.data).run();
  } catch (error) {
    console.error('createWorkout', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath(PATH);
  return ok(t.activity.addedMsg);
}

export async function deleteWorkout(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.delete(workouts).where(eq(workouts.id, id.data)).run();
  revalidatePath(PATH);
}
