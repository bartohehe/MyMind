'use client';

import { useActionState, useEffect, useState } from 'react';

import {
  ActionButton,
  CancelButton,
  CheckButton,
  DeleteButton,
  Field,
  FormAlert,
  SubmitButton,
} from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';
import { formatTime } from '@/lib/date';

import { deleteMedication, setMedicationActive, toggleTaken, updateMedication } from './actions';
import type { MedicationToday } from './queries';
import { SlotPicker } from './slot-picker';

export function MedicationItem({ medication }: { medication: MedicationToday }) {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <MedicationEditForm medication={medication} onDone={() => setIsEditing(false)} />;
  }

  const m = t.meds;

  return (
    <li className="list-row med-row" style={medication.active ? undefined : { opacity: 0.6 }}>
      <div className="row-main">
        <div className="row-title">
          {medication.name}
          {medication.dose ? (
            <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 13 }}>
              {' '}
              · {medication.dose}
            </span>
          ) : null}
        </div>
        {medication.schedule ? <div className="row-sub">{medication.schedule}</div> : null}
      </div>

      {medication.active ? (
        <div className="slot-checks">
          {medication.slots.map((s) => {
            const label = m.slot[s.slot];
            return (
              <div key={s.slot} className="slot-check">
                <CheckButton
                  action={toggleTaken}
                  fields={{ id: medication.id, slot: s.slot }}
                  checked={s.taken}
                  label={m.toggleLabel(medication.name, label, s.taken)}
                />
                <span className="slot-label" title={s.takenAt ? formatTime(s.takenAt, locale) : undefined}>
                  {s.taken && s.takenAt ? formatTime(s.takenAt, locale) : label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="row-actions">
        <ActionButton
          action={setMedicationActive}
          fields={{ id: medication.id, active: medication.active ? '0' : '1' }}
          className="pill-btn"
          label={medication.active ? m.endBtn : m.resumeBtn}
        >
          {medication.active ? m.endBtn : m.resumeBtn}
        </ActionButton>
        <button type="button" className="ghost-btn" onClick={() => setIsEditing(true)}>
          {t.common.edit}
        </button>
        <DeleteButton
          action={deleteMedication}
          id={medication.id}
          confirmText={m.deleteConfirm(medication.name)}
        />
      </div>
    </li>
  );
}

function MedicationEditForm({
  medication,
  onDone,
}: {
  medication: MedicationToday;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateMedication, idleState);
  const v = state.values;
  const e = state.errors;
  const m = t.meds;
  const id = medication.id;

  useEffect(() => {
    if (state.status === 'success') onDone();
  }, [state, onDone]);

  return (
    <li className="list-row" style={{ display: 'block' }}>
      <form action={formAction} className="form-grid" style={{ padding: '4px 0' }}>
        <input type="hidden" name="id" value={id} />

        <div className="form-row">
          <Field label={m.name} htmlFor={`name-${id}`} error={e?.['name']} style={{ flex: 2, minWidth: 160 }}>
            <input
              id={`name-${id}`}
              name="name"
              className="txt"
              defaultValue={v?.['name'] ?? medication.name}
              autoComplete="off"
              aria-invalid={e?.['name'] ? true : undefined}
            />
          </Field>
          <Field label={m.dose} htmlFor={`dose-${id}`} error={e?.['dose']} style={{ flex: 1, minWidth: 120 }}>
            <input
              id={`dose-${id}`}
              name="dose"
              className="txt"
              defaultValue={v?.['dose'] ?? medication.dose}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label={m.note} htmlFor={`schedule-${id}`} error={e?.['schedule']}>
          <input
            id={`schedule-${id}`}
            name="schedule"
            className="txt"
            defaultValue={v?.['schedule'] ?? medication.schedule}
            placeholder={m.notePh}
            autoComplete="off"
          />
        </Field>

        <SlotPicker
          idPrefix={`m${id}`}
          selected={v ? (v['times']?.split('\n') ?? []) : medication.slots.map((s) => s.slot)}
          error={e?.['times']}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="active"
            defaultChecked={v ? v['active'] === 'on' : medication.active}
            style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
          />
          <span style={{ fontSize: 14 }}>{m.activeLabel}</span>
        </label>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <CancelButton onClick={onDone} />
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </form>
    </li>
  );
}
