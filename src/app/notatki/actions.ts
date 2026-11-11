'use server';

import { revalidatePath } from 'next/cache';
import { eq, not, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { notes } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  ok,
  optionalText,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';

const PATH = '/notatki';

const noteSchema = z.object({
  title: optionalText(200),
  content: requiredText(20_000),
});

export async function createNote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(noteSchema, formData, t);
  if (!parsed.success) return parsed.state;

  try {
    await db.insert(notes).values(parsed.data);
  } catch (error) {
    console.error('createNote', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath(PATH);
  return ok(t.notes.addedMsg);
}

export async function updateNote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(noteSchema.extend({ id: idField }), formData, t);
  if (!parsed.success) return parsed.state;

  const { id, ...values } = parsed.data;

  try {
    await db.update(notes).set(values).where(eq(notes.id, id));
  } catch (error) {
    console.error('updateNote', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath(PATH);
  return ok(t.saved);
}

export async function togglePin(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  // Przypięcie nie jest edycją treści — jawnie zostawiamy updated_at bez zmian,
  // inaczej $onUpdateFn ze schematu podbiłby znacznik.
  await db.update(notes)
    .set({ pinned: not(notes.pinned), updatedAt: sql`${notes.updatedAt}` })
    .where(eq(notes.id, id.data));
  revalidatePath(PATH);
}

export async function deleteNote(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  await db.delete(notes).where(eq(notes.id, id.data));
  revalidatePath(PATH);
}
