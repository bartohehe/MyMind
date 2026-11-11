'use client';

import { MED_SLOTS, type MedSlot } from '@/db/schema';
import { useI18n } from '@/i18n/client';

/**
 * Pigułki „Rano / Południe / Wieczór" z designu. Pod spodem zwykłe checkboxy
 * `name="times"` — stan zaznaczenia rysuje CSS (:has(:checked)), bez JS-owego stanu.
 */
export function SlotPicker({
  idPrefix,
  selected,
  error,
}: {
  idPrefix: string;
  selected: readonly string[];
  error?: string | undefined;
}) {
  const { t } = useI18n();

  return (
    <fieldset className="field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="label" style={{ marginBottom: 6 }}>
        {t.meds.slots}
      </legend>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MED_SLOTS.map((slot: MedSlot) => (
          <label key={slot} className="seg seg-pill" htmlFor={`${idPrefix}-slot-${slot}`}>
            <input
              id={`${idPrefix}-slot-${slot}`}
              type="checkbox"
              name="times"
              value={slot}
              defaultChecked={selected.includes(slot)}
              className="sr-only"
            />
            {t.meds.slot[slot]}
          </label>
        ))}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </fieldset>
  );
}
