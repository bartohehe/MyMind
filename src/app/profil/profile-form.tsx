'use client';

import { useActionState } from 'react';

import { Field, FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { arrayToLines, idleState } from '@/lib/actions';
import { toInputNumber } from '@/lib/date';
import type { Profile } from '@/db/schema';

import { saveProfile } from './actions';

export function ProfileForm({ profile }: { profile: Profile }) {
  const { t, locale } = useI18n();
  const [state, formAction] = useActionState(saveProfile, idleState);
  // Po nieudanym zapisie wracamy do tego, co było w polach, a nie do bazy.
  const v = state.values;
  const e = state.errors;
  const p = t.profile;


  return (
    <form action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 16 }}>
        {p.editTitle}
      </h2>

      <div className="form-grid">
        <div className="form-row">
          <Field label={p.fullName} htmlFor="fullName" error={e?.['fullName']} style={{ flex: 2, minWidth: 200 }}>
            <input
              id="fullName"
              name="fullName"
              className="txt"
              defaultValue={v?.['fullName'] ?? profile.fullName}
              placeholder={p.fullNamePh}
              autoComplete="name"
            />
          </Field>
          <Field label={p.birthDate} htmlFor="birthDate" error={e?.['birthDate']} style={{ flex: 1, minWidth: 160 }}>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              className="txt"
              defaultValue={v?.['birthDate'] ?? profile.birthDate}
              aria-invalid={e?.['birthDate'] ? true : undefined}
            />
          </Field>
        </div>

        <div className="form-row">
          <Field label={`${p.weight} (${p.weightUnit})`} htmlFor="weightKg" error={e?.['weightKg']} style={{ flex: 1, minWidth: 120 }}>
            <input
              id="weightKg"
              name="weightKg"
              inputMode="decimal"
              className="txt"
              defaultValue={v?.['weightKg'] ?? toInputNumber(profile.weightKg, locale)}
              placeholder="78"
              aria-invalid={e?.['weightKg'] ? true : undefined}
            />
          </Field>
          <Field label={`${p.height} (${p.heightUnit})`} htmlFor="heightCm" error={e?.['heightCm']} style={{ flex: 1, minWidth: 120 }}>
            <input
              id="heightCm"
              name="heightCm"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['heightCm'] ?? toInputNumber(profile.heightCm, locale)}
              placeholder="182"
              aria-invalid={e?.['heightCm'] ? true : undefined}
            />
          </Field>
          <Field label={p.blood} htmlFor="bloodType" error={e?.['bloodType']} style={{ flex: 1, minWidth: 120 }}>
            <input
              id="bloodType"
              name="bloodType"
              className="txt"
              defaultValue={v?.['bloodType'] ?? profile.bloodType}
              placeholder={p.bloodPh}
              autoComplete="off"
            />
          </Field>
        </div>

        <div className="form-row">
          <Field label={p.allergies} htmlFor="allergies" hint={t.common.onePerLine} style={{ flex: 1, minWidth: 220 }}>
            <textarea
              id="allergies"
              name="allergies"
              className="txt"
              defaultValue={v?.['allergies'] ?? arrayToLines(profile.allergies)}
              placeholder={p.allergiesPh}
            />
          </Field>
          <Field label={p.chronic} htmlFor="chronicConditions" hint={t.common.onePerLine} style={{ flex: 1, minWidth: 220 }}>
            <textarea
              id="chronicConditions"
              name="chronicConditions"
              className="txt"
              defaultValue={v?.['chronicConditions'] ?? arrayToLines(profile.chronicConditions)}
              placeholder={p.chronicPh}
            />
          </Field>
        </div>

        <div className="form-row">
          <Field label={p.insurance} htmlFor="insurance" error={e?.['insurance']} style={{ flex: 1, minWidth: 200 }}>
            <input
              id="insurance"
              name="insurance"
              className="txt"
              defaultValue={v?.['insurance'] ?? profile.insurance}
              placeholder={p.insurancePh}
              autoComplete="off"
            />
          </Field>
          <Field label={p.pesel} htmlFor="pesel" error={e?.['pesel']} style={{ flex: 1, minWidth: 200 }}>
            <input
              id="pesel"
              name="pesel"
              inputMode="numeric"
              className="txt"
              defaultValue={v?.['pesel'] ?? profile.pesel}
              autoComplete="off"
              aria-invalid={e?.['pesel'] ? true : undefined}
            />
          </Field>
        </div>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <SubmitButton>{p.saveBtn}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
