'use client';

import { useActionState, useEffect, useState } from 'react';

import { PinIcon } from '@/components/icons';
import {
  ActionButton,
  CancelButton,
  DeleteButton,
  Field,
  FormAlert,
  SubmitButton,
} from '@/components/ui';
import { useI18n } from '@/i18n/client';
import { idleState } from '@/lib/actions';
import { formatDateTime } from '@/lib/date';
import type { Note } from '@/db/schema';

import { deleteNote, togglePin, updateNote } from './actions';

export function NoteItem({ note }: { note: Note }) {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <NoteEditForm note={note} onDone={() => setIsEditing(false)} />;
  }

  return (
    <li className={`card card-sm note-card ${note.pinned ? 'note-pinned' : ''}`}>
      {note.title ? (
        <h2 className="card-title" style={{ fontSize: 17 }}>
          {note.title}
        </h2>
      ) : null}

      <p className="entry-text" style={{ flex: 1 }}>
        {note.content}
      </p>

      <div className="note-foot">
        <ActionButton
          action={togglePin}
          fields={{ id: note.id }}
          className="pin-btn"
          label={note.pinned ? t.notes.pinned : t.notes.pin}
          pressed={note.pinned}
        >
          <PinIcon filled={note.pinned} />
          {note.pinned ? t.notes.pinned : t.notes.pin}
        </ActionButton>
        <button type="button" className="ghost-btn" onClick={() => setIsEditing(true)}>
          {t.common.edit}
        </button>
        <span className="note-date" title={formatDateTime(note.updatedAt, locale)}>
          {formatDateTime(note.updatedAt, locale)}
        </span>
        <DeleteButton action={deleteNote} id={note.id} confirmText={t.notes.deleteConfirm} />
      </div>
    </li>
  );
}

function NoteEditForm({ note, onDone }: { note: Note; onDone: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateNote, idleState);
  const v = state.values;
  const e = state.errors;

  useEffect(() => {
    if (state.status === 'success') onDone();
  }, [state, onDone]);

  return (
    <li className="card card-sm note-card">
      <form action={formAction} className="form-grid">
        <input type="hidden" name="id" value={note.id} />

        <Field label={t.notes.titleLabel} htmlFor={`title-${note.id}`} error={e?.['title']}>
          <input
            id={`title-${note.id}`}
            name="title"
            className="txt"
            defaultValue={v?.['title'] ?? note.title}
            autoComplete="off"
          />
        </Field>

        <Field label={t.notes.content} htmlFor={`content-${note.id}`} error={e?.['content']}>
          <textarea
            id={`content-${note.id}`}
            name="content"
            className="txt"
            defaultValue={v?.['content'] ?? note.content}
            aria-invalid={e?.['content'] ? true : undefined}
          />
        </Field>

        <div className="form-actions-end">
          <FormAlert state={state} />
          <CancelButton onClick={onDone} />
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </form>
    </li>
  );
}
