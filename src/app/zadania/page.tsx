import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { ActionButton, CheckButton, DeleteButton } from '@/components/ui';
import { getI18n } from '@/i18n/server';
import { formatShortDate, today } from '@/lib/date';

import { cycleTodoPriority, deleteTodo, toggleTodo } from './actions';
import { PRIORITY_STYLE } from './priority';
import { TODO_FILTERS, getTodos, parseFilter } from './queries';
import { TodoForm } from './todo-form';

export const dynamic = 'force-dynamic';

export default async function ZadaniaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = parseFilter((await searchParams)['f']);
  const [{ t, locale }, { items, total, left }] = await Promise.all([getI18n(), getTodos(filter)]);
  const todayStr = today();

  return (
    <>
      <PageHeader
        title={t.nav.todo}
        description={t.sub.todo}
        aside={
          <span className="pill-stat">
            <span className="pill-dot" />
            {t.todo.left(left)}
          </span>
        }
      />

      <div className="stack-sm">
        <TodoForm />

        <nav className="seg-group" aria-label={t.todo.filters.all} style={{ marginBottom: 4 }}>
          {TODO_FILTERS.map((key) => (
            <Link
              key={key}
              href={key === 'all' ? '/zadania' : `/zadania?f=${key}`}
              className="seg"
              data-active={key === filter}
              aria-current={key === filter ? 'page' : undefined}
              scroll={false}
            >
              {t.todo.filters[key]}
            </Link>
          ))}
        </nav>

        {items.length === 0 ? (
          <div className="card" style={{ padding: 0 }}>
            <p className="empty">{total === 0 ? t.todo.empty : t.todo.emptyFiltered}</p>
          </div>
        ) : (
          <ul className="card plain-list todo-list">
            {items.map((todo) => {
              const prio = PRIORITY_STYLE[todo.priority];
              const overdue = !todo.done && todo.dueDate !== null && todo.dueDate < todayStr;
              return (
                <li key={todo.id} className="todo-row">
                  <CheckButton
                    action={toggleTodo}
                    fields={{ id: todo.id }}
                    checked={todo.done}
                    label={t.todo.toggle(todo.text, todo.done)}
                    size={24}
                  />
                  <span className={todo.done ? 'todo-text task-done' : 'todo-text'}>{todo.text}</span>
                  {todo.dueDate ? (
                    <span
                      className="todo-due"
                      style={overdue ? { color: 'var(--red)' } : undefined}
                      title={overdue ? t.todo.overdue : t.todo.due}
                    >
                      {todo.dueDate === todayStr ? t.common.today : formatShortDate(todo.dueDate, locale)}
                    </span>
                  ) : null}
                  <ActionButton
                    action={cycleTodoPriority}
                    fields={{ id: todo.id }}
                    className="status-pill prio-btn"
                    label={`${t.todo.priority}: ${t.todo.priorities[todo.priority]}. ${t.todo.prioHint}`}
                    title={t.todo.prioHint}
                    style={{ color: prio.color, background: prio.bg }}
                  >
                    {t.todo.priorities[todo.priority]}
                  </ActionButton>
                  <DeleteButton action={deleteTodo} id={todo.id} confirmText={t.todo.deleteConfirm} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
