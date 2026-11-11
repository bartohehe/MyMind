'use client';

import { Field } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { arrayToLines } from '@/lib/actions';
import { PROJECT_STATUSES, type Project, type ProjectStatus } from '@/db/schema';

/** Kolory statusów z palety designu. */
export const STATUS_STYLE: Record<ProjectStatus, { color: string; bg: string }> = {
  pomysł: { color: 'var(--violet)', bg: 'var(--violet-soft)' },
  'w toku': { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  zrobione: { color: 'var(--green)', bg: 'var(--green-soft)' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  const style = STATUS_STYLE[status];
  return (
    <span className="status-pill" style={{ color: style.color, background: style.bg }}>
      {t.projects.statuses[status]}
    </span>
  );
}

/** Pola wspólne dla formularza dodawania i edycji projektu. */
export function ProjectFields({
  idPrefix,
  project,
  errors,
  values,
}: {
  idPrefix: string;
  project?: Project;
  errors: Record<string, string> | undefined;
  /** Wartości odesłane przez akcję po nieudanym zapisie — mają pierwszeństwo. */
  values: Record<string, string> | undefined;
}) {
  const { t } = useI18n();
  const p = t.projects;

  return (
    <>
      <div className="form-row">
        <Field label={p.name} htmlFor={`${idPrefix}-name`} error={errors?.['name']} style={{ flex: 2, minWidth: 180 }}>
          <input
            id={`${idPrefix}-name`}
            name="name"
            className="txt"
            defaultValue={values?.['name'] ?? project?.name ?? ''}
            placeholder={p.namePh}
            autoComplete="off"
            aria-invalid={errors?.['name'] ? true : undefined}
          />
        </Field>
        <Field label={p.status} htmlFor={`${idPrefix}-status`} error={errors?.['status']} style={{ flex: 1, minWidth: 140 }}>
          <select
            id={`${idPrefix}-status`}
            name="status"
            className="txt"
            key={values?.['status'] ?? project?.status ?? 'pomysł'}
            defaultValue={values?.['status'] ?? project?.status ?? 'pomysł'}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {p.statuses[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={p.due} htmlFor={`${idPrefix}-due`} error={errors?.['dueDate']} style={{ flex: 1, minWidth: 150 }}>
          <input
            id={`${idPrefix}-due`}
            name="dueDate"
            type="date"
            className="txt"
            defaultValue={values?.['dueDate'] ?? project?.dueDate ?? ''}
          />
        </Field>
      </div>

      <div className="form-row">
        <Field label={p.description} htmlFor={`${idPrefix}-description`} error={errors?.['description']} style={{ flex: 1, minWidth: 220 }}>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            className="txt"
            rows={2}
            style={{ minHeight: 70 }}
            defaultValue={values?.['description'] ?? project?.description ?? ''}
            placeholder={p.descriptionPh}
          />
        </Field>
        <Field label={p.links} htmlFor={`${idPrefix}-links`} hint={p.linksHint} error={errors?.['links']} style={{ flex: 1, minWidth: 220 }}>
          <textarea
            id={`${idPrefix}-links`}
            name="links"
            className="txt"
            rows={2}
            style={{ minHeight: 70 }}
            defaultValue={values?.['links'] ?? arrayToLines(project?.links ?? [])}
            placeholder="https://github.com/…"
            aria-invalid={errors?.['links'] ? true : undefined}
          />
        </Field>
      </div>
    </>
  );
}
