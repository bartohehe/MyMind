'use client';

import { useFormStatus } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';

import { CheckIcon, TrashIcon } from '@/components/icons';
import { useI18n } from '@/i18n/client';
import type { ActionState } from '@/lib/actions';

/** Przycisk submit, który sam blokuje się na czas trwania Server Action. */
export function SubmitButton({
  children,
  pendingLabel,
  className = 'btn-primary',
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingLabel ?? t.common.saving) : children}
    </button>
  );
}

/** Wyjście z trybu edycji — blokuje się, gdy formularz właśnie się zapisuje. */
export function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button type="button" className="ghost-btn" onClick={onClick} disabled={pending}>
      {t.common.cancel}
    </button>
  );
}

/** Komunikat sukcesu/błędu zwrócony przez Server Action. */
export function FormAlert({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null;

  return (
    <p
      className={`alert ${state.status === 'success' ? 'alert-success' : 'alert-error'}`}
      role="status"
      style={{ margin: 0 }}
    >
      {state.message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  style,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="field" style={style}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

/** Kasowanie z potwierdzeniem. Akcja dostaje ukryte pole `id`. */
export function DeleteButton({
  action,
  id,
  confirmText,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  confirmText: string;
  /** Gdy podane — przycisk tekstowy zamiast ikony kosza. */
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
      style={{ display: 'flex' }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteSubmit label={label} />
    </form>
  );
}

function DeleteSubmit({ label }: { label: string | undefined }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  if (label) {
    return (
      <button type="submit" className="ghost-btn ghost-btn-danger" disabled={pending}>
        {pending ? t.common.deleting : label}
      </button>
    );
  }

  return (
    <button
      type="submit"
      className="icon-only-btn"
      disabled={pending}
      aria-label={t.common.delete}
      title={t.common.delete}
    >
      <TrashIcon />
    </button>
  );
}

/**
 * Formularz jednego przycisku dla akcji typu „przełącz" (checkbox leku, zadania,
 * przypięcie notatki). Ukryte pola idą jako `fields`.
 */
export function ActionButton({
  action,
  fields,
  className,
  label,
  title,
  children,
  pressed,
  dataTaken,
  style,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  className: string;
  label: string;
  title?: string;
  children: ReactNode;
  pressed?: boolean;
  /** Dla `.check` — steruje stylem zaznaczenia. */
  dataTaken?: boolean;
  style?: CSSProperties;
}) {
  return (
    <form action={action} style={{ display: 'flex' }}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <ActionSubmit
        className={className}
        label={label}
        title={title}
        pressed={pressed}
        dataTaken={dataTaken}
        style={style}
      >
        {children}
      </ActionSubmit>
    </form>
  );
}

function ActionSubmit({
  className,
  label,
  title,
  pressed,
  dataTaken,
  style,
  children,
}: {
  className: string;
  label: string;
  title: string | undefined;
  pressed: boolean | undefined;
  dataTaken: boolean | undefined;
  style: CSSProperties | undefined;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={label}
      aria-pressed={pressed}
      title={title}
      data-taken={dataTaken}
      style={style}
    >
      {children}
    </button>
  );
}

/** Kwadratowy checkbox z designu, jako przycisk akcji serwerowej. */
export function CheckButton({
  action,
  fields,
  checked,
  label,
  size,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  checked: boolean;
  label: string;
  size?: number;
}) {
  return (
    <ActionButton
      action={action}
      fields={fields}
      className="check"
      label={label}
      title={label}
      pressed={checked}
      dataTaken={checked}
      style={size ? { width: size, height: size } : undefined}
    >
      <CheckIcon size={size ? Math.round(size / 2) : 14} />
    </ActionButton>
  );
}
