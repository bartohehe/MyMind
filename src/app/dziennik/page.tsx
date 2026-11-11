import { EmptyState, PageHeader } from '@/components/page-header';
import { getI18n } from '@/i18n/server';
import { today } from '@/lib/date';

import { JournalForm } from './journal-form';
import { JournalItem } from './journal-item';
import { getJournalEntries } from './queries';

export const dynamic = 'force-dynamic';

export default async function DziennikPage() {
  const [{ t }, entries] = await Promise.all([getI18n(), getJournalEntries()]);

  return (
    <>
      <PageHeader title={t.nav.diary} description={t.sub.diary} />

      <div className="stack">
        <JournalForm defaultDate={today()} />

        {entries.length === 0 ? (
          <EmptyState>{t.diary.empty}</EmptyState>
        ) : (
          <ul className="stack-sm plain-list">
            {entries.map((entry) => (
              <JournalItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
