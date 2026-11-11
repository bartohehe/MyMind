'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Field, FormAlert, SubmitButton } from '@/components/ui';
import { EVENT_CATEGORIES } from '@/db/schema';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createEvent } from './actions';

export function EventForm({ defaultDate }: { defaultDate: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createEvent, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const c = t.calendar;

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  const v = state.values;
  const e = state.errors;

  return (
    // key = data: po kliknięciu innego dnia formularz podstawia nową datę domyślną.
    <form key={defaultDate} ref={formRef} action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 16 }}>
        {c.addTitle}
      </h2>

      <div className="form-grid">
        <Field label={c.eventTitle} htmlFor="ev-title" error={e?.['title']}>
          <input
            id="ev-title"
            name="title"
            className="txt"
            defaultValue={v?.['title'] ?? ''}
            placeholder={c.titlePh}
            autoComplete="off"
            aria-invalid={e?.['title'] ? true : undefined}
          />
        </Field>

        <div className="form-row">
          <Field label={c.date} htmlFor="ev-date" error={e?.['date']} style={{ flex: 1, minWidth: 150 }}>
            <input
              id="ev-date"
              name="date"
              type="date"
              className="txt"
              defaultValue={v?.['date'] ?? defaultDate}
            />
          </Field>
          <Field label={c.time} htmlFor="ev-time" hint={t.common.optional} error={e?.['time']} style={{ flex: 1, minWidth: 120 }}>
            <input id="ev-time" name="time" type="time" className="txt" defaultValue={v?.['time'] ?? ''} />
          </Field>
          <Field label={c.category} htmlFor="ev-cat" style={{ flex: 1, minWidth: 140 }}>
            <select id="ev-cat" name="category" className="txt" key={v?.['category'] ?? 'personal'} defaultValue={v?.['category'] ?? 'personal'}>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {c.categories[category]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <SubmitButton pendingLabel={t.common.adding}>{t.common.add}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
