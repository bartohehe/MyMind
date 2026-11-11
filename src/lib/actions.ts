import { z } from 'zod';

import type { Dict, ErrorKey } from '@/i18n/dictionaries';

/**
 * Wspólny kontrakt Server Actions. Każda akcja mutująca formularz zwraca
 * ActionState, a formularze po stronie klienta czytają go przez `useActionState`.
 */
export type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  /** Błędy walidacji per pole formularza (już przetłumaczone). */
  errors?: Record<string, string>;
  /**
   * To, co użytkownik wpisał. React 19 czyści formularz po zakończeniu akcji,
   * więc przy błędzie oddajemy wartości z powrotem — formularze wstawiają je
   * w defaultValue i nic nie ginie.
   */
  values?: Record<string, string>;
};

export const idleState: ActionState = { status: 'idle' };

export const ok = (message: string): ActionState => ({ status: 'success', message });
export const fail = (
  message: string,
  errors?: Record<string, string>,
  values?: Record<string, string>,
): ActionState => ({ status: 'error', message, errors, values });

/**
 * Tekstowe pola formularza jako zwykły obiekt. Pola wielokrotne (np. grupa
 * checkboxów o tej samej nazwie) łączymy znakiem nowej linii.
 */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of new Set(formData.keys())) {
    values[key] = formData
      .getAll(key)
      .filter((value): value is string => typeof value === 'string')
      .join('\n');
  }
  return values;
}

type ParseResult<T> = { success: true; data: T } | { success: false; state: ActionState };

function isErrorKey(value: string, t: Dict): value is ErrorKey {
  return Object.hasOwn(t.errors, value);
}

/**
 * Waliduje FormData schematem zod. Komunikaty w schematach to klucze
 * z `t.errors` (np. 'required'); nieznane komunikaty zod-a mapujemy na 'invalid'.
 */
export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
  t: Dict,
): ParseResult<z.infer<S>> {
  const result = schema.safeParse(Object.fromEntries(formData));

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field] = t.errors[isErrorKey(issue.message, t) ? issue.message : 'invalid'];
    }
  }

  return { success: false, state: fail(t.errors.fixFields, errors, formValues(formData)) };
}

/* ------------------------------ Klocki schematów ----------------------------- */
// Komunikaty to klucze ErrorKey — tłumaczy je parseForm.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const requiredText = (max: number) =>
  z.string().trim().min(1, 'required' satisfies ErrorKey).max(max, 'tooLong' satisfies ErrorKey);

export const optionalText = (max: number) =>
  z.string().trim().max(max, 'tooLong' satisfies ErrorKey);

export const isoDate = z.string().trim().regex(ISO_DATE, 'invalidDate' satisfies ErrorKey);

/** '' -> null, inaczej musi być poprawną datą 'YYYY-MM-DD'. */
export const optionalIsoDate = z
  .string()
  .trim()
  .refine((value) => value === '' || ISO_DATE.test(value), 'invalidDate' satisfies ErrorKey)
  .transform((value) => (value === '' ? null : value));

/** '' albo 'HH:MM'. */
export const optionalTime = z
  .string()
  .trim()
  .refine((value) => value === '' || TIME.test(value), 'invalidTime' satisfies ErrorKey);

/** Pole liczbowe z formularza: '' -> null, akceptuje przecinek dziesiętny. */
export const optionalNumber = ({
  min,
  max,
  integer = false,
}: {
  min: number;
  max: number;
  integer?: boolean;
}) =>
  z
    .string()
    .trim()
    .transform((value) => value.replace(',', '.').replace(/\s/g, ''))
    .refine((value) => {
      if (value === '') return true;
      const n = Number(value);
      return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n));
    }, 'invalidNumber' satisfies ErrorKey)
    .transform((value) => (value === '' ? null : Number(value)));

/** Checkbox: zaznaczony wysyła 'on', niezaznaczony nie trafia do FormData. */
export const checkbox = z
  .literal('on')
  .optional()
  .transform((value) => value === 'on');

/** Numeryczne id z ukrytego pola formularza. */
export const idField = z.coerce.number().int().positive();

/** Pole tekstowe „jedna pozycja na linię" -> tablica stringów (do kolumn JSON). */
export const linesToArray = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

/** Tablica stringów -> tekst do textarea. */
export const arrayToLines = (value: readonly string[]): string => value.join('\n');
