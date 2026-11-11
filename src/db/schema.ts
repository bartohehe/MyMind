import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Schemat bazy. Jedna zakładka = jedna tabela (albo mały zestaw powiązanych tabel).
 * Dodajesz zakładkę? Dopisz tutaj tabelę, potem `npm run db:generate`.
 *
 * Daty dzienne trzymamy jako tekst 'YYYY-MM-DD' (lokalna strefa serwera),
 * znaczniki czasu jako unix epoch w sekundach.
 */

const createdAt = () =>
  integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`);

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date());

/* --------------------------------- Profil --------------------------------- */
/** Zawsze dokładnie jeden wiersz o id = 1 (upsert). */
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  fullName: text('full_name').notNull().default(''),
  /** 'YYYY-MM-DD' albo '' — wiek liczymy z tego w locie. */
  birthDate: text('birth_date').notNull().default(''),
  weightKg: real('weight_kg'),
  heightCm: integer('height_cm'),
  bloodType: text('blood_type').notNull().default(''),
  allergies: text('allergies', { mode: 'json' }).$type<string[]>().notNull().default([]),
  chronicConditions: text('chronic_conditions', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  insurance: text('insurance').notNull().default(''),
  pesel: text('pesel').notNull().default(''),
  updatedAt: updatedAt(),
});

/* ---------------------------------- Leki ---------------------------------- */
export const MED_SLOTS = ['morning', 'noon', 'evening'] as const;
export type MedSlot = (typeof MED_SLOTS)[number];

export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dose: text('dose').notNull().default(''),
  /** Dowolna notatka o przyjmowaniu, np. „na czczo". */
  schedule: text('schedule').notNull().default(''),
  /** Pory dnia, w których lek się bierze — każda ma własny checkbox. */
  times: text('times', { mode: 'json' }).$type<MedSlot[]>().notNull().default(['morning']),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
});

export const medicationLogs = sqliteTable(
  'medication_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    medicationId: integer('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    /** Data lokalna w formacie 'YYYY-MM-DD'. */
    date: text('date').notNull(),
    slot: text('slot').$type<MedSlot>().notNull().default('morning'),
    taken: integer('taken', { mode: 'boolean' }).notNull().default(false),
    takenAt: integer('taken_at', { mode: 'timestamp' }),
  },
  (table) => [
    // Klucz upsertu: jeden wpis na lek, dzień i porę.
    uniqueIndex('medication_logs_med_date_slot_unq').on(
      table.medicationId,
      table.date,
      table.slot,
    ),
    index('medication_logs_date_idx').on(table.date),
  ],
);

/* -------------------------------- Notatki --------------------------------- */
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ------------------------------- Pamiętnik -------------------------------- */
export const MOODS = [1, 2, 3, 4, 5] as const;
export type Mood = (typeof MOODS)[number];

export const journalEntries = sqliteTable(
  'journal_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Data lokalna w formacie 'YYYY-MM-DD'. */
    date: text('date').notNull(),
    content: text('content').notNull().default(''),
    /** 1 (źle) … 5 (świetnie); null dla starszych wpisów bez nastroju. */
    mood: integer('mood').$type<Mood>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('journal_entries_date_idx').on(table.date)],
);

/* -------------------------------- Projekty -------------------------------- */
export const PROJECT_STATUSES = ['pomysł', 'w toku', 'zrobione'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').$type<ProjectStatus>().notNull().default('pomysł'),
  links: text('links', { mode: 'json' }).$type<string[]>().notNull().default([]),
  /** Termin 'YYYY-MM-DD' albo null. */
  dueDate: text('due_date'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const projectTasks = sqliteTable(
  'project_tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index('project_tasks_project_idx').on(table.projectId)],
);

/* --------------------------------- Zadania -------------------------------- */
export const TODO_PRIORITIES = ['low', 'med', 'high'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  priority: text('priority').$type<TodoPriority>().notNull().default('med'),
  /** Termin 'YYYY-MM-DD' albo null. */
  dueDate: text('due_date'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------- Kalendarz ------------------------------- */
export const EVENT_CATEGORIES = ['health', 'work', 'personal', 'project'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** 'YYYY-MM-DD'. */
    date: text('date').notNull(),
    /** 'HH:MM' albo '' dla wydarzeń całodniowych. */
    time: text('time').notNull().default(''),
    title: text('title').notNull(),
    category: text('category').$type<EventCategory>().notNull().default('personal'),
    createdAt: createdAt(),
  },
  (table) => [index('events_date_idx').on(table.date)],
);

/* -------------------------------- Aktywność ------------------------------- */
/** Dzienne statystyki — jeden wiersz na dzień (upsert po dacie). */
export const activityDays = sqliteTable('activity_days', {
  date: text('date').primaryKey(),
  steps: integer('steps'),
  sleepMinutes: integer('sleep_minutes'),
  calories: integer('calories'),
  updatedAt: updatedAt(),
});

export const WORKOUT_TYPES = ['walk', 'run', 'gym', 'bike', 'swim', 'other'] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const workouts = sqliteTable(
  'workouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    time: text('time').notNull().default(''),
    type: text('type').$type<WorkoutType>().notNull().default('walk'),
    distanceKm: real('distance_km'),
    durationMin: integer('duration_min'),
    calories: integer('calories'),
    createdAt: createdAt(),
  },
  (table) => [index('workouts_date_idx').on(table.date)],
);

/* ------------------------------- Typy wierszy ------------------------------ */
export type Profile = typeof profile.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type CalendarEvent = typeof events.$inferSelect;
export type ActivityDay = typeof activityDays.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
