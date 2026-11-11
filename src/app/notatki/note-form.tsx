'use client';

import { useActionState, useEffect, useRef } from 'react';

import { FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createNote } from './actions';

/** Szybkie dodawanie z designu: jedno pole + „Dodaj", tytuł opcjonalnie nad treścią. */
export function NoteForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createNote, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  const v = state.values;
  const e = state.errors;

  return (
    <form ref={formRef} action={formAction} className="card card-sm">
      <div className="form-grid" style={{ gap: 10 }}>
        <label className="sr-only" htmlFor="new-title">
          {t.notes.titleLabel}
        </label>
        <input
          id="new-title"
          name="title"
          className="txt"
          defaultValue={v?.['title'] ?? ''}
          placeholder={t.notes.titlePh}
          autoComplete="off"
        />

        <label className="sr-only" htmlFor="new-content">
          {t.notes.content}
        </label>
        <textarea
          id="new-content"
          name="content"
          className="txt"
          rows={2}
          style={{ minHeight: 64 }}
          defaultValue={v?.['content'] ?? ''}
          placeholder={t.notes.contentPh}
          aria-invalid={e?.['content'] ? true : undefined}
        />
        {e?.['content'] ? <span className="field-error">{e['content']}</span> : null}

        <div className="form-actions-end">
          <FormAlert state={state} />
          <SubmitButton pendingLabel={t.common.adding}>{t.common.add}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
