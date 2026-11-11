import 'server-only';

import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { MED_SLOTS, medicationLogs, medications, type Medication, type MedSlot } from '@/db/schema';
import { addDays, startOfWeek, today } from '@/lib/date';

export type SlotState = { slot: MedSlot; taken: boolean; takenAt: Date | null };

export type MedicationToday = Medication & {
  /** Stan każdej pory na dziś. Brak wiersza w logach = niewzięte. */
  slots: SlotState[];
};

/** Pory zawsze w kolejności dnia, bez duplikatów i śmieci z bazy. */
export function normalizeSlots(times: readonly string[]): MedSlot[] {
  const valid = MED_SLOTS.filter((slot) => times.includes(slot));
  return valid.length > 0 ? valid : ['morning'];
}

/**
 * Leki ze stanem „wzięte dzisiaj" per pora.
 * Stan liczy się z logów z dzisiejszą datą — nowy dzień to brak wierszy,
 * czyli checkboxy same wracają do odznaczonych. Żadnego crona ani resetu.
 */
export async function getMedications(): Promise<MedicationToday[]> {
  const date = today();

  const meds = await db
    .select()
    .from(medications)
    .orderBy(desc(medications.active), asc(medications.name));

  const logs = await db.select().from(medicationLogs).where(eq(medicationLogs.date, date));
  const byKey = new Map(logs.map((log) => [`${log.medicationId}:${log.slot}`, log]));

  return meds.map((medication) => ({
    ...medication,
    slots: normalizeSlots(medication.times).map((slot) => {
      const log = byKey.get(`${medication.id}:${slot}`);
      return { slot, taken: log?.taken ?? false, takenAt: log?.takenAt ?? null };
    }),
  }));
}

/** Podsumowanie dnia: ile pór odhaczonych ze wszystkich pór aktywnych leków. */
export function takenProgress(meds: readonly MedicationToday[]) {
  let done = 0;
  let total = 0;
  for (const medication of meds) {
    if (!medication.active) continue;
    for (const slot of medication.slots) {
      total += 1;
      if (slot.taken) done += 1;
    }
  }
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/* --------------------------- Historia tygodnia ---------------------------- */

export type WeekCellState = 'taken' | 'partial' | 'missed' | 'future';
export type WeekCell = { date: string; state: WeekCellState; isToday: boolean };
export type WeekRow = { id: number; name: string; days: WeekCell[] };
export type WeekHistory = { days: { date: string; isToday: boolean }[]; rows: WeekRow[] };

/** Siatka Pn–Nd bieżącego tygodnia dla aktywnych leków. */
export async function getWeekHistory(): Promise<WeekHistory> {
  const todayStr = today();
  const monday = startOfWeek(todayStr);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return { date, isToday: date === todayStr };
  });

  const active = await db
    .select()
    .from(medications)
    .where(eq(medications.active, true))
    .orderBy(asc(medications.name));

  if (active.length === 0) return { days, rows: [] };

  const logs = await db
    .select()
    .from(medicationLogs)
    .where(
      and(
        gte(medicationLogs.date, monday),
        lte(medicationLogs.date, addDays(monday, 6)),
        eq(medicationLogs.taken, true),
      ),
    );

  const takenCount = new Map<string, number>();
  for (const log of logs) {
    const key = `${log.medicationId}:${log.date}`;
    takenCount.set(key, (takenCount.get(key) ?? 0) + 1);
  }

  const rows: WeekRow[] = active.map((medication) => {
    const slotsPerDay = normalizeSlots(medication.times).length;
    return {
      id: medication.id,
      name: medication.name,
      days: days.map((day) => {
        const count = takenCount.get(`${medication.id}:${day.date}`) ?? 0;
        let state: WeekCellState;
        if (count >= slotsPerDay) state = 'taken';
        else if (count > 0) state = 'partial';
        else if (day.date > todayStr) state = 'future';
        else state = 'missed';
        return { date: day.date, state, isToday: day.isToday };
      }),
    };
  });

  return { days, rows };
}
