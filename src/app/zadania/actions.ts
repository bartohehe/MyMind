'use server';

import { revalidatePath } from 'next/cache';
import { eq, not } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { TODO_PRIORITIES, todos, type TodoPriority } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  ok,
  optionalIsoDate,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';

function revalidate() {
  revalidatePath('/zadania');
  revalidatePath('/');
}

const todoSchema = z.object({
  text: requiredText(300),
  priority: z.enum(TODO_PRIORITIES),
  dueDate: optionalIsoDate,
});

export async function createTodo(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(todoSchema, formData, t);
  if (!parsed.success) return parsed.state;

  try {
    await db.insert(todos).values(parsed.data);
  } catch (error) {
    console.error('createTodo', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.todo.addedMsg);
}

export async function toggleTodo(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  await db.update(todos).set({ done: not(todos.done) }).where(eq(todos.id, id.data));
  revalidate();
}

const NEXT_PRIORITY: Record<TodoPriority, TodoPriority> = { low: 'med', med: 'high', high: 'low' };

/** Klik w pigułkę priorytetu przechodzi niski → średni → wysoki → niski. */
export async function cycleTodoPriority(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  const [todo] = await db.select().from(todos).where(eq(todos.id, id.data)).limit(1);
  if (!todo) return;

  await db.update(todos)
    .set({ priority: NEXT_PRIORITY[todo.priority] })
    .where(eq(todos.id, id.data));
  revalidate();
}

export async function deleteTodo(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  await db.delete(todos).where(eq(todos.id, id.data));
  revalidate();
}
