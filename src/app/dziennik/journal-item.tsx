'use client';

import { useActionState, useEffect, useState } from 'react';

import { CancelButton, DeleteButton, Field, FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';
import { formatDate } from '@/lib/date';
import type { JournalEntry } from '@/db/schema';

import { deleteJournalEntry, updateJournalEntry } from './actions';
import { MoodPicker } from './mood-picker';
import { DEFAULT_MOOD, MOOD_COLORS, moodLabel } from './moods';

export function JournalItem({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <JournalEditForm entry={entry} onDone={() => setIsEditing(false)} />;
  }

  return (
    <li className="card card-sm">
      <div className="entry-meta">
        <span
          className="mood-dot"
          style={{ background: entry.mood ? MOOD_COLORS[entry.mood] : 'var(--accent)' }}
        />
        {entry.mood ? <span style={{ fontWeight: 600 }}>{moodLabel(entry.mood, t.diary.moods)}</span> : null}
        <span className="cap-first" style={{ color: 'var(--muted)' }}>
          {entry.mood ? '· ' : ''}
          {formatDate(entry.date, locale)}
        </span>

        <span className="entry-actions">
          <button type="button" className="ghost-btn" onClick={() => setIsEditing(true)}>
            {t.common.edit}
          </button>
          <DeleteButton
            action={deleteJournalEntry}
            id={entry.id}
            confirmText={t.diary.deleteConfirm(entry.date)}
          />
        </span>
      </div>

      <p className="entry-text">{entry.content}</p>
    </li>
  );
}

function JournalEditForm({ entry, onDone }: { entry: JournalEntry; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateJournalEntry, idleState);
  const v = state.values;
  const e = state.errors;

  useEffect(() => {
    if (state.status === 'success') onDone();
  }, [state, onDone]);

  return (
    <li className="card card-sm">
      <form action={formAction} className="form-grid">
        <input type="hidden" name="id" value={entry.id} />

        <MoodPicker
          idPrefix={`e${entry.id}`}
          selected={Number(v?.['mood'] ?? entry.mood ?? DEFAULT_MOOD)}
        />

        <Field
          label={t.diary.date}
          htmlFor={`date-${entry.id}`}
          error={e?.['date']}
          style={{ maxWidth: 220 }}
        >
          <input
            id={`date-${entry.id}`}
            name="date"
            type="date"
            className="txt"
            defaultValue={v?.['date'] ?? entry.date}
          />
        </Field>

        <Field label={t.diary.entry} htmlFor={`content-${entry.id}`} error={e?.['content']}>
          <textarea
            id={`content-${entry.id}`}
            name="content"
            className="txt"
            defaultValue={v?.['content'] ?? entry.content}
            aria-invalid={e?.['content'] ? true : undefined}
          />
        </Field>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <CancelButton onClick={onDone} />
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </form>
    </li>
  );
}
