import type { TodoPriority } from '@/db/schema';

/** Kolory priorytetów z designu. */
export const PRIORITY_STYLE: Record<TodoPriority, { color: string; bg: string }> = {
  high: { color: 'var(--red)', bg: 'var(--accent-soft)' },
  med: { color: 'var(--amber)', bg: 'var(--amber-soft)' },
  low: { color: 'var(--green)', bg: 'var(--green-soft)' },
};
