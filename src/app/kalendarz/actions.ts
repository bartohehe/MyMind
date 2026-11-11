'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { EVENT_CATEGORIES, events } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  isoDate,
  ok,
  optionalTime,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';

function revalidate() {
  revalidatePath('/kalendarz');
  revalidatePath('/');
}

const eventSchema = z.object({
  title: requiredText(200),
  date: isoDate,
  time: optionalTime,
  category: z.enum(EVENT_CATEGORIES),
});

export async function createEvent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(eventSchema, formData, t);
  if (!parsed.success) return parsed.state;

  try {
    await db.insert(events).values(parsed.data);
  } catch (error) {
    console.error('createEvent', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.calendar.addedMsg);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  await db.delete(events).where(eq(events.id, id.data));
  revalidate();
}
