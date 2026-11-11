'use server';

import { revalidatePath } from 'next/cache';
import { eq, not } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { PROJECT_STATUSES, projectTasks, projects } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  idField,
  linesToArray,
  ok,
  optionalIsoDate,
  optionalText,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';

const PATH = '/projekty';

const projectSchema = z.object({
  name: requiredText(200),
  description: optionalText(5_000),
  status: z.enum(PROJECT_STATUSES),
  dueDate: optionalIsoDate,
  /** Textarea „jeden URL w linii". */
  links: z.string(),
});

/** Odsiewa wpisy, które nie są poprawnym URL-em — do bazy trafiają tylko sensowne linki. */
function parseLinks(raw: string): { links: string[]; invalid: string[] } {
  const links: string[] = [];
  const invalid: string[] = [];
  for (const candidate of linesToArray(raw)) {
    if (URL.canParse(candidate)) links.push(candidate);
    else invalid.push(candidate);
  }
  return { links, invalid };
}

async function saveProject(formData: FormData, id: number | null): Promise<ActionState> {
  const { t } = await getI18n();
  const schema = id === null ? projectSchema : projectSchema.extend({ id: idField });
  const parsed = parseForm(schema, formData, t);
  if (!parsed.success) return parsed.state;

  const { links, invalid } = parseLinks(parsed.data.links);
  if (invalid.length > 0) {
    return fail(
      t.errors.fixFields,
      { links: t.projects.invalidUrl(invalid.join(', ')) },
      formValues(formData),
    );
  }

  const values = {
    name: parsed.data.name,
    description: parsed.data.description,
    status: parsed.data.status,
    dueDate: parsed.data.dueDate,
    links,
  };

  try {
    if (id === null) {
      db.insert(projects).values(values).run();
    } else {
      db.update(projects).set(values).where(eq(projects.id, id)).run();
    }
  } catch (error) {
    console.error('saveProject', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath(PATH);
  return ok(id === null ? t.projects.addedMsg : t.saved);
}

export async function createProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return saveProject(formData, null);
}

export async function updateProject(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) {
    const { t } = await getI18n();
    return fail(t.errors.invalid);
  }
  return saveProject(formData, id.data);
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  // Zadania lecą kaskadą (FK ON DELETE CASCADE).
  db.delete(projects).where(eq(projects.id, id.data)).run();
  revalidatePath(PATH);
}

/* ---------------------------------- Zadania --------------------------------- */

const taskSchema = z.object({ projectId: idField, text: requiredText(300) });

/** Pusty tekst ignorujemy po cichu — formularz i tak resetuje się po akcji. */
export async function addProjectTask(formData: FormData): Promise<void> {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  db.insert(projectTasks).values(parsed.data).run();
  revalidatePath(PATH);
}

export async function toggleProjectTask(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.update(projectTasks)
    .set({ done: not(projectTasks.done) })
    .where(eq(projectTasks.id, id.data))
    .run();
  revalidatePath(PATH);
}

export async function deleteProjectTask(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.delete(projectTasks).where(eq(projectTasks.id, id.data)).run();
  revalidatePath(PATH);
}
