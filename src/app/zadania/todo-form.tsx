'use client';

import { useActionState, useEffect, useRef } from 'react';

import { FormAlert, SubmitButton } from '@/components/ui';
import { TODO_PRIORITIES } from '@/db/schema';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';

import { createTodo } from './actions';

export function TodoForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createTodo, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>('input[name="text"]')?.focus();
    }
  }, [state]);

  const v = state.values;
  const e = state.errors;

  return (
    <form ref={formRef} action={formAction} className="todo-form">
      <div className="form-row">
        <label className="sr-only" htmlFor="new-todo">
          {t.todo.placeholder}
        </label>
        <input
          id="new-todo"
          name="text"
          className="txt"
          style={{ flex: 3, minWidth: 200 }}
          defaultValue={v?.['text'] ?? ''}
          placeholder={t.todo.placeholder}
          autoComplete="off"
          aria-invalid={e?.['text'] ? true : undefined}
        />
        <label className="sr-only" htmlFor="new-priority">
          {t.todo.priority}
        </label>
        <select
          id="new-priority"
          name="priority"
          className="txt"
          style={{ flex: 'none', width: 'auto' }}
          key={v?.['priority'] ?? 'med'}
          defaultValue={v?.['priority'] ?? 'med'}
          title={t.todo.priority}
        >
          {TODO_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {t.todo.priorities[priority]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="new-due">
          {t.todo.due}
        </label>
        <input
          id="new-due"
          name="dueDate"
          type="date"
          className="txt"
          style={{ flex: 'none', width: 'auto' }}
          defaultValue={v?.['dueDate'] ?? ''}
          title={t.todo.due}
        />
        <SubmitButton pendingLabel={t.common.adding}>{t.todo.addBtn}</SubmitButton>
      </div>
      {e?.['text'] ? <span className="field-error">{e['text']}</span> : null}
      {state.status === 'error' && !e ? <FormAlert state={state} /> : null}
    </form>
  );
}
