'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { MED_SLOTS, medicationLogs, medications, type MedSlot } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  checkbox,
  fail,
  formValues,
  idField,
  ok,
  optionalText,
  parseForm,
  requiredText,
  type ActionState,
} from '@/lib/actions';
import { today } from '@/lib/date';

import { DOSE_UNITS } from './units';

function revalidate() {
  revalidatePath('/leki');
  revalidatePath('/');
}

/** Grupa checkboxów `times` — FormData ma wtedy kilka wartości pod jednym kluczem. */
function readSlots(formData: FormData): MedSlot[] {
  const picked = formData.getAll('times').filter((value) => typeof value === 'string');
  return MED_SLOTS.filter((slot) => picked.includes(slot));
}

const createSchema = z.object({
  name: requiredText(120),
  doseAmount: optionalText(40),
  doseUnit: z.enum(DOSE_UNITS),
  schedule: optionalText(120),
});

const updateSchema = z.object({
  id: idField,
  name: requiredText(120),
  dose: optionalText(60),
  schedule: optionalText(120),
  active: checkbox,
});

export async function createMedication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(createSchema, formData, t);
  if (!parsed.success) return parsed.state;

  const times = readSlots(formData);
  if (times.length === 0) {
    return fail(t.errors.fixFields, { times: t.errors.pickSlot }, formValues(formData));
  }

  const { name, doseAmount, doseUnit, schedule } = parsed.data;

  try {
    // Nowy lek zawsze startuje jako aktywny.
    db.insert(medications)
      .values({ name, dose: doseAmount ? `${doseAmount} ${doseUnit}` : '', schedule, times })
      .run();
  } catch (error) {
    console.error('createMedication', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.meds.addedMsg);
}

export async function updateMedication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(updateSchema, formData, t);
  if (!parsed.success) return parsed.state;

  const times = readSlots(formData);
  if (times.length === 0) {
    return fail(t.errors.fixFields, { times: t.errors.pickSlot }, formValues(formData));
  }

  const { id, ...values } = parsed.data;

  try {
    db.update(medications).set({ ...values, times }).where(eq(medications.id, id)).run();
  } catch (error) {
    console.error('updateMedication', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidate();
  return ok(t.saved);
}

/** „Zakończ branie" / „Wznów" — przełącza flagę active, historia zostaje. */
export async function setMedicationActive(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.update(medications)
    .set({ active: formData.get('active') === '1' })
    .where(eq(medications.id, id.data))
    .run();
  revalidate();
}

export async function deleteMedication(formData: FormData): Promise<void> {
  const id = idField.safeParse(formData.get('id'));
  if (!id.success) return;

  db.delete(medications).where(eq(medications.id, id.data)).run();
  revalidate();
}

const toggleSchema = z.object({ id: idField, slot: z.enum(MED_SLOTS) });

/**
 * Przełącza „wzięte dzisiaj" dla jednej pory. Upsertuje wiersz dla
 * (lek, dzisiejsza data, pora) — unikalny indeks gwarantuje jeden wpis.
 */
export async function toggleTaken(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { id, slot } = parsed.data;
  const date = today();

  const existing = db
    .select()
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.medicationId, id),
        eq(medicationLogs.date, date),
        eq(medicationLogs.slot, slot),
      ),
    )
    .get();

  const taken = !(existing?.taken ?? false);
  const takenAt = taken ? new Date() : null;

  db.insert(medicationLogs)
    .values({ medicationId: id, date, slot, taken, takenAt })
    .onConflictDoUpdate({
      target: [medicationLogs.medicationId, medicationLogs.date, medicationLogs.slot],
      set: { taken, takenAt },
    })
    .run();

  revalidate();
}
