import 'server-only';

import { desc } from 'drizzle-orm';

import { db } from '@/db';
import { journalEntries, type JournalEntry } from '@/db/schema';

/** Wpisy od najnowszej daty; w obrębie dnia najpierw ostatnio dodane. */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  return db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.date), desc(journalEntries.id));
}

export async function getLatestJournalEntry(): Promise<JournalEntry | undefined> {
  const [row] = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.date), desc(journalEntries.id))
    .limit(1);
  return row;
}
