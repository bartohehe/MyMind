'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Field, FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createMedication } from './actions';
import { SlotPicker } from './slot-picker';
import { DOSE_UNITS } from './units';

export function MedicationForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createMedication, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  // Po udanym dodaniu czyścimy pola, żeby dało się dopisać kolejny lek.
  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  const v = state.values;
  const e = state.errors;
  const m = t.meds;

  return (
    <form ref={formRef} action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 16 }}>
        {m.addTitle}
      </h2>

      <div className="form-grid">
        <div className="form-row">
          <Field label={m.name} htmlFor="new-name" error={e?.['name']} style={{ flex: 2, minWidth: 160 }}>
            <input
              id="new-name"
              name="name"
              className="txt"
              defaultValue={v?.['name'] ?? ''}
              placeholder={m.namePh}
              autoComplete="off"
              aria-invalid={e?.['name'] ? true : undefined}
            />
          </Field>
          <Field label={m.dose} htmlFor="new-dose" error={e?.['doseAmount']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="new-dose"
              name="doseAmount"
              className="txt"
              defaultValue={v?.['doseAmount'] ?? ''}
              placeholder={m.dosePh}
              autoComplete="off"
            />
          </Field>
          <Field label={m.unit} htmlFor="new-unit" style={{ flex: 'none', minWidth: 100 }}>
            <select id="new-unit" name="doseUnit" className="txt" key={v?.['doseUnit'] ?? 'mg'} defaultValue={v?.['doseUnit'] ?? 'mg'}>
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={m.note} htmlFor="new-schedule" error={e?.['schedule']}>
          <input
            id="new-schedule"
            name="schedule"
            className="txt"
            defaultValue={v?.['schedule'] ?? ''}
            placeholder={m.notePh}
            autoComplete="off"
          />
        </Field>

        <div className="form-row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <SlotPicker
            idPrefix="new"
            selected={v ? (v['times']?.split('\n') ?? []) : ['morning']}
            error={e?.['times']}
          />
          <div className="form-actions">
            <FormAlert state={state} />
            <SubmitButton pendingLabel={t.common.adding}>{m.addBtn}</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
