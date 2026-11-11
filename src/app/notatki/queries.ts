import 'server-only';

import { desc } from 'drizzle-orm';

import { db } from '@/db';
import { notes, type Note } from '@/db/schema';

/** Przypięte na górze, potem od ostatnio edytowanych. */
export async function getNotes(): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt), desc(notes.id));
}
