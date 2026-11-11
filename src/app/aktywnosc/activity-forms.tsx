'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Field, FormAlert, SubmitButton } from '@/components/ui';
import { WORKOUT_TYPES, type ActivityDay } from '@/db/schema';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';
import { toInputNumber } from '@/lib/date';

import { createWorkout, saveActivityDay } from './actions';

/** Formularz statystyk dnia — prefill z dzisiejszego wpisu. */
export function DayStatsForm({ date, day }: { date: string; day: ActivityDay | undefined }) {
  const { t, locale } = useI18n();
  const [state, formAction] = useActionState(saveActivityDay, idleState);
  const a = t.activity;
  const v = state.values;
  const e = state.errors;

  const sleepHours = toInputNumber(
    day?.sleepMinutes === null || day?.sleepMinutes === undefined ? null : day.sleepMinutes / 60,
    locale,
  );

  return (
    <form action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 4 }}>
        {a.statsTitle}
      </h2>
      <p className="hint" style={{ margin: '0 0 16px' }}>
        {a.statsHint}
      </p>

      <div className="form-grid">
        <Field label={a.day} htmlFor="st-date" error={e?.['date']}>
          <input id="st-date" name="date" type="date" className="txt" defaultValue={v?.['date'] ?? date} />
        </Field>
        <div className="form-row">
          <Field label={a.stepsLabel} htmlFor="st-steps" error={e?.['steps']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="st-steps"
              name="steps"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['steps'] ?? (day?.steps ?? '').toString()}
              placeholder="7420"
              aria-invalid={e?.['steps'] ? true : undefined}
            />
          </Field>
          <Field label={a.sleepLabel} htmlFor="st-sleep" error={e?.['sleepHours']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="st-sleep"
              name="sleepHours"
              inputMode="decimal"
              className="txt"
              defaultValue={v?.['sleepHours'] ?? sleepHours}
              placeholder={a.sleepPh}
              aria-invalid={e?.['sleepHours'] ? true : undefined}
            />
          </Field>
          <Field label={a.caloriesLabel} htmlFor="st-kcal" error={e?.['calories']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="st-kcal"
              name="calories"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['calories'] ?? (day?.calories ?? '').toString()}
              placeholder="2140"
              aria-invalid={e?.['calories'] ? true : undefined}
            />
          </Field>
        </div>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <SubmitButton>{a.saveStats}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function WorkoutForm({ date }: { date: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createWorkout, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const a = t.activity;
  const v = state.values;
  const e = state.errors;

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 16 }}>
        {a.addWorkout}
      </h2>

      <div className="form-grid">
        <div className="form-row">
          <Field label={a.type} htmlFor="wo-type" style={{ flex: 1, minWidth: 130 }}>
            <select id="wo-type" name="type" className="txt" key={v?.['type'] ?? 'walk'} defaultValue={v?.['type'] ?? 'walk'}>
              {WORKOUT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {a.types[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={a.date} htmlFor="wo-date" error={e?.['date']} style={{ flex: 1, minWidth: 140 }}>
            <input id="wo-date" name="date" type="date" className="txt" defaultValue={v?.['date'] ?? date} />
          </Field>
          <Field label={a.time} htmlFor="wo-time" error={e?.['time']} style={{ flex: 1, minWidth: 110 }}>
            <input id="wo-time" name="time" type="time" className="txt" defaultValue={v?.['time'] ?? ''} />
          </Field>
        </div>
        <div className="form-row">
          <Field label={a.distance} htmlFor="wo-dist" error={e?.['distanceKm']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="wo-dist"
              name="distanceKm"
              inputMode="decimal"
              className="txt"
              defaultValue={v?.['distanceKm'] ?? ''}
              placeholder="5,4"
              aria-invalid={e?.['distanceKm'] ? true : undefined}
            />
          </Field>
          <Field label={a.duration} htmlFor="wo-dur" error={e?.['durationMin']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="wo-dur"
              name="durationMin"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['durationMin'] ?? ''}
              placeholder="32"
              aria-invalid={e?.['durationMin'] ? true : undefined}
            />
          </Field>
          <Field label={a.workoutCalories} htmlFor="wo-kcal" error={e?.['calories']} style={{ flex: 1, minWidth: 100 }}>
            <input
              id="wo-kcal"
              name="calories"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['calories'] ?? ''}
              placeholder="320"
              aria-invalid={e?.['calories'] ? true : undefined}
            />
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
