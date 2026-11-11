'use client';

import { useActionState, useEffect, useRef } from 'react';

import { FormAlert, SubmitButton } from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createProject } from './actions';
import { ProjectFields } from './project-fields';

export function ProjectForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createProject, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="card">
      <h2 className="card-title" style={{ marginBottom: 16 }}>
        {t.projects.newTitle}
      </h2>

      <div className="form-grid">
        <ProjectFields idPrefix="new" errors={state.errors} values={state.values} />

        <div className="form-actions-end">
          <FormAlert state={state} />
          <SubmitButton pendingLabel={t.common.adding}>{t.projects.addBtn}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
