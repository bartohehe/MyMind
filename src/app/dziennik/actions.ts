'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { journalEntries, type Mood } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  isoDate,
  ok,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';

function revalidate() {
  revalidatePath('/dziennik');
  revalidatePath('/');
}

const entrySchema = z.object({
  date: isoDate,
  content: requiredText(20_000),
  mood: z.enum(['1', '2', '3', '4', '5']).transform((value) => Number(value) as Mood),
});

export async function createJournalEntry(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(entrySchema, formData, t);
  if (!parsed.success) return parsed.state;

  try {
    db.insert(journalEntries).values(parsed.data).run();
  } catch (error) {
    console.error('createJournalEntry', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.diary.addedMsg);
}

export async function updateJournalEntry(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(entrySchema.extend({ id: idField }), formData, t);
  if (!parsed.success) return parsed.state;

  const { id, ...values } = parsed.data;

  try {
    db.update(journalEntries).set(values).where(eq(journalEntries.id, id)).run();
  } catch (error) {
    console.error('updateJournalEntry', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.saved);
}

export async function deleteJournalEntry(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.delete(journalEntries).where(eq(journalEntries.id, id.data)).run();
  revalidate();
}
