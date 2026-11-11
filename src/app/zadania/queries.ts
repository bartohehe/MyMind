import 'server-only';

import { db } from '@/db';
import { todos, type Todo, type TodoPriority } from '@/db/schema';

export const TODO_FILTERS = ['all', 'active', 'done'] as const;
export type TodoFilter = (typeof TODO_FILTERS)[number];

export function parseFilter(value: unknown): TodoFilter {
  return (TODO_FILTERS as readonly unknown[]).includes(value) ? (value as TodoFilter) : 'all';
}

const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, med: 1, low: 2 };

/** Niezrobione na górze; w grupie priorytet, potem najbliższy termin, potem najnowsze. */
function compare(a: Todo, b: Todo): number {
  return (
    Number(a.done) - Number(b.done) ||
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
    (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
    b.id - a.id
  );
}

export async function getTodos(filter: TodoFilter): Promise<{ items: Todo[]; total: number; left: number }> {
  const all = db.select().from(todos).all();
  const items = all
    .filter((todo) => (filter === 'all' ? true : filter === 'done' ? todo.done : !todo.done))
    .sort(compare);

  return { items, total: all.length, left: all.filter((todo) => !todo.done).length };
}
