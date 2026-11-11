import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { profile, type Profile } from '@/db/schema';

/** Profil to zawsze wiersz id = 1. Gdy go jeszcze nie ma — zwracamy pustkę bez zapisu. */
export const PROFILE_ID = 1;

export async function getProfile(): Promise<Profile> {
  const row = db.select().from(profile).where(eq(profile.id, PROFILE_ID)).get();

  return (
    row ?? {
      id: PROFILE_ID,
      fullName: '',
      birthDate: '',
      weightKg: null,
      heightCm: null,
      bloodType: '',
      allergies: [],
      chronicConditions: [],
      insurance: '',
      pesel: '',
      updatedAt: new Date(),
    }
  );
}
