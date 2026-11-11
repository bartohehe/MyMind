'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { profile } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import {
  fail,
  formValues,
  linesToArray,
  ok,
  optionalIsoDate,
  optionalNumber,
  optionalText,
  parseForm,
  type ActionState,
} from '@/lib/actions';

import { PROFILE_ID } from './queries';

const profileSchema = z.object({
  fullName: optionalText(120),
  birthDate: optionalIsoDate,
  weightKg: optionalNumber({ min: 1, max: 500 }),
  heightCm: optionalNumber({ min: 30, max: 260, integer: true }),
  bloodType: optionalText(16),
  allergies: z.string(),
  chronicConditions: z.string(),
  insurance: optionalText(120),
  pesel: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{11}$/.test(value), 'invalidPesel'),
});

export async function saveProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = parseForm(profileSchema, formData, t);
  if (!parsed.success) return parsed.state;

  const values = {
    ...parsed.data,
    allergies: linesToArray(parsed.data.allergies),
    chronicConditions: linesToArray(parsed.data.chronicConditions),
    updatedAt: new Date(),
  };

  try {
    await db.insert(profile)
      .values({ id: PROFILE_ID, ...values })
      .onConflictDoUpdate({ target: profile.id, set: values });
  } catch (error) {
    console.error('saveProfile', error);
    return fail(t.errors.saveFailed, undefined, formValues(formData));
  }

  revalidatePath('/profil');
  revalidatePath('/');
  return ok(t.profile.savedMsg);
}
