'use client';

import { MOODS } from '@/db/schema';
import { useI18n } from '@/i18n/client';

import { MOOD_COLORS, moodLabel } from './moods';

/**
 * Pięć kolorowych kółek z designu. Pod spodem radio `name="mood"` —
 * zaznaczenie rysuje CSS (:has(:checked)), więc nie trzeba stanu w JS.
 */
export function MoodPicker({ idPrefix, selected }: { idPrefix: string; selected: number }) {
  const { t } = useI18n();

  return (
    <fieldset className="mood-picker">
      <legend className="sr-only">{t.diary.mood}</legend>
      {MOODS.map((mood) => (
        <label key={mood} className="mood-btn" htmlFor={`${idPrefix}-mood-${mood}`}>
          <input
            id={`${idPrefix}-mood-${mood}`}
            type="radio"
            name="mood"
            value={mood}
            defaultChecked={selected === mood}
            className="sr-only"
          />
          <span className="mood-swatch" style={{ background: MOOD_COLORS[mood] }} />
          <span>{moodLabel(mood, t.diary.moods)}</span>
        </label>
      ))}
    </fieldset>
  );
}
