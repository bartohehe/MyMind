import { EmptyState, PageHeader } from '@/components/page-header';
import { getI18n } from '@/i18n/server';

import { NoteForm } from './note-form';
import { NoteItem } from './note-item';
import { getNotes } from './queries';

export const dynamic = 'force-dynamic';

export default async function NotatkiPage() {
  const [{ t }, notes] = await Promise.all([getI18n(), getNotes()]);

  return (
    <>
      <PageHeader title={t.nav.notes} description={t.sub.notes} />

      <div className="stack">
        <NoteForm />

        {notes.length === 0 ? (
          <EmptyState>{t.notes.empty}</EmptyState>
        ) : (
          <ul className="grid-cards plain-list">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
