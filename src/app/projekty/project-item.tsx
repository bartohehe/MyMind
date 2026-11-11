'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { CalendarIcon, CheckIcon, XIcon } from '@/components/icons';
import {
  ActionButton,
  CancelButton,
  DeleteButton,
  FormAlert,
  SubmitButton,
} from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';
import { formatShortDate } from '@/lib/date';

import {
  addProjectTask,
  deleteProject,
  deleteProjectTask,
  toggleProjectTask,
  updateProject,
} from './actions';
import { ProjectFields, STATUS_STYLE, StatusBadge } from './project-fields';
import type { ProjectWithTasks } from './queries';

export function ProjectItem({ project, today }: { project: ProjectWithTasks; today: string }) {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <ProjectEditForm project={project} onDone={() => setIsEditing(false)} />;
  }

  const p = t.projects;
  const done = project.tasks.filter((task) => task.done).length;
  const total = project.tasks.length;
  const pct = total === 0 ? (project.status === 'zrobione' ? 100 : 0) : Math.round((done / total) * 100);
  const color = STATUS_STYLE[project.status].color;
  const overdue = project.dueDate !== null && project.dueDate < today && project.status !== 'zrobione';

  return (
    <li className="card project-card">
      <div style={{ height: 5, background: color }} />

      <div className="project-body">
        <div className="project-title-row">
          <h2 className="card-title">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>

        {project.description ? (
          <p className="entry-text" style={{ fontSize: 14, color: 'var(--muted)' }}>
            {project.description}
          </p>
        ) : null}

        <div>
          <div className="progress-label">
            <span>{p.progress(done, total)}</span>
            <span>{pct}%</span>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>

        {total > 0 ? (
          <ul className="plain-list task-list">
            {project.tasks.map((task) => (
              <li key={task.id} className="task-row">
                <ActionButton
                  action={toggleProjectTask}
                  fields={{ id: task.id }}
                  className="task-toggle"
                  label={t.todo.toggle(task.text, task.done)}
                  pressed={task.done}
                >
                  <span className="check check-sm" data-taken={task.done}>
                    <CheckIcon size={12} />
                  </span>
                  <span className={task.done ? 'task-text task-done' : 'task-text'}>{task.text}</span>
                </ActionButton>
                <ActionButton
                  action={deleteProjectTask}
                  fields={{ id: task.id }}
                  className="icon-only-btn task-delete"
                  label={p.deleteTask}
                  title={p.deleteTask}
                >
                  <XIcon />
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : null}

        <form action={addProjectTask} className="task-add">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="sr-only" htmlFor={`task-${project.id}`}>
            {p.addTask}
          </label>
          <input
            id={`task-${project.id}`}
            name="text"
            className="txt"
            placeholder={p.taskPh}
            autoComplete="off"
            maxLength={300}
          />
          <AddTaskButton label={p.addTask} />
        </form>

        {project.links.length > 0 ? (
          <ul className="link-list">
            {project.links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer noopener">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="project-foot">
          <span className="project-due" style={overdue ? { color: 'var(--red)' } : undefined}>
            <CalendarIcon size={14} />
            {p.due}: {project.dueDate ? formatShortDate(project.dueDate, locale) : p.noDue}
          </span>
          <button type="button" className="ghost-btn" onClick={() => setIsEditing(true)}>
            {t.common.edit}
          </button>
          <DeleteButton action={deleteProject} id={project.id} confirmText={p.deleteConfirm(project.name)} />
        </div>
      </div>
    </li>
  );
}

function AddTaskButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="task-add-btn" disabled={pending} aria-label={label} title={label}>
      +
    </button>
  );
}

function ProjectEditForm({ project, onDone }: { project: ProjectWithTasks; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateProject, idleState);

  useEffect(() => {
    if (state.status === 'success') onDone();
  }, [state, onDone]);

  return (
    <li className="card" style={{ gridColumn: '1 / -1' }}>
      <form action={formAction} className="form-grid">
        <input type="hidden" name="id" value={project.id} />

        <ProjectFields
          idPrefix={`p-${project.id}`}
          project={project}
          errors={state.errors}
          values={state.values}
        />

        <div className="form-actions-end">
          <FormAlert state={state} />
          <CancelButton onClick={onDone} />
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </form>
    </li>
  );
}
