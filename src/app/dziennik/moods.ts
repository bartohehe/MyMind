import type { Mood } from '@/db/schema';

/** Kolory nastrojów 1:1 z designu — od „źle" do „świetnie". */
export const MOOD_COLORS: Record<Mood, string> = {
  1: '#c2685a',
  2: '#cf9a5b',
  3: '#b3ab8e',
  4: '#8ea86f',
  5: '#6a9f8c',
};

export const DEFAULT_MOOD: Mood = 3;

/** Nazwa nastroju ze słownika (`moods` to tablica 0-indeksowana). */
export function moodLabel(mood: Mood, labels: readonly string[]): string {
  return labels[mood - 1] ?? '';
}
