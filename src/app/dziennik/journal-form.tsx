'use client';

import { useActionState, useEffect, useRef } from 'react';

import { FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createJournalEntry } from './actions';
import { MoodPicker } from './mood-picker';
import { DEFAULT_MOOD } from './moods';

export function JournalForm({ defaultDate }: { defaultDate: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createJournalEntry, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  const v = state.values;
  const e = state.errors;

  return (
    <form ref={formRef} action={formAction} className="card">
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{t.diary.how}</div>

      <MoodPicker idPrefix="new" selected={Number(v?.['mood'] ?? DEFAULT_MOOD)} />

      <label className="sr-only" htmlFor="new-content">
        {t.diary.entry}
      </label>
      <textarea
        id="new-content"
        name="content"
        className="txt"
        rows={3}
        defaultValue={v?.['content'] ?? ''}
        placeholder={t.diary.placeholder}
        aria-invalid={e?.['content'] ? true : undefined}
      />
      {e?.['content'] ? <span className="field-error">{e['content']}</span> : null}

      <div className="form-row" style={{ marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="label">{t.diary.date}</span>
          <input
            name="date"
            type="date"
            className="txt"
            style={{ width: 'auto', padding: '8px 12px' }}
            defaultValue={v?.['date'] ?? defaultDate}
            aria-invalid={e?.['date'] ? true : undefined}
          />
        </label>
        <div className="form-actions">
          <FormAlert state={state} />
          <SubmitButton>{t.diary.saveBtn}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
