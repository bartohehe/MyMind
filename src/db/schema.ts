import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Schemat bazy (PostgreSQL). Jedna zakładka = jedna tabela (albo mały zestaw
 * powiązanych tabel). Dodajesz zakładkę? Dopisz tutaj tabelę, potem `npm run db:generate`.
 *
 * Daty dzienne to kolumny `date` czytane jako tekst 'YYYY-MM-DD' (mode: 'string') —
 * aplikacja liczy „dzisiaj" w lokalnej strefie serwera i porównuje stringi,
 * więc nie ma żadnej konwersji stref po drodze. Znaczniki czasu to `timestamptz`.
 */

const id = () => integer('id').primaryKey().generatedAlwaysAsIdentity();

/** Dzień kalendarzowy jako 'YYYY-MM-DD'. */
const day = (name: string) => date(name, { mode: 'string' });

const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());

/* --------------------------------- Profil --------------------------------- */
/** Zawsze dokładnie jeden wiersz o id = 1 (upsert). */
export const profile = pgTable('profile', {
  id: integer('id').primaryKey(),
  fullName: text('full_name').notNull().default(''),
  /** Wiek liczymy z tego w locie. */
  birthDate: day('birth_date'),
  weightKg: real('weight_kg'),
  heightCm: integer('height_cm'),
  bloodType: text('blood_type').notNull().default(''),
  allergies: jsonb('allergies').$type<string[]>().notNull().default([]),
  chronicConditions: jsonb('chronic_conditions').$type<string[]>().notNull().default([]),
  insurance: text('insurance').notNull().default(''),
  pesel: text('pesel').notNull().default(''),
  updatedAt: updatedAt(),
});

/* ---------------------------------- Leki ---------------------------------- */
export const MED_SLOTS = ['morning', 'noon', 'evening'] as const;
export type MedSlot = (typeof MED_SLOTS)[number];

export const medications = pgTable('medications', {
  id: id(),
  name: text('name').notNull(),
  dose: text('dose').notNull().default(''),
  /** Dowolna notatka o przyjmowaniu, np. „na czczo". */
  schedule: text('schedule').notNull().default(''),
  /** Pory dnia, w których lek się bierze — każda ma własny checkbox. */
  times: jsonb('times').$type<MedSlot[]>().notNull().default(['morning']),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

export const medicationLogs = pgTable(
  'medication_logs',
  {
    id: id(),
    medicationId: integer('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    date: day('date').notNull(),
    slot: text('slot').$type<MedSlot>().notNull().default('morning'),
    taken: boolean('taken').notNull().default(false),
    takenAt: timestamp('taken_at', { withTimezone: true, mode: 'date' }),
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
export const notes = pgTable('notes', {
  id: id(),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ------------------------------- Pamiętnik -------------------------------- */
export const MOODS = [1, 2, 3, 4, 5] as const;
export type Mood = (typeof MOODS)[number];

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: id(),
    date: day('date').notNull(),
    content: text('content').notNull().default(''),
    /** 1 (źle) … 5 (świetnie); null dla wpisów bez nastroju. */
    mood: integer('mood').$type<Mood>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('journal_entries_date_idx').on(table.date)],
);

/* -------------------------------- Projekty -------------------------------- */
export const PROJECT_STATUSES = ['pomysł', 'w toku', 'zrobione'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projects = pgTable('projects', {
  id: id(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').$type<ProjectStatus>().notNull().default('pomysł'),
  links: jsonb('links').$type<string[]>().notNull().default([]),
  dueDate: day('due_date'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const projectTasks = pgTable(
  'project_tasks',
  {
    id: id(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    done: boolean('done').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index('project_tasks_project_idx').on(table.projectId)],
);

/* --------------------------------- Zadania -------------------------------- */
export const TODO_PRIORITIES = ['low', 'med', 'high'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const todos = pgTable('todos', {
  id: id(),
  text: text('text').notNull(),
  done: boolean('done').notNull().default(false),
  priority: text('priority').$type<TodoPriority>().notNull().default('med'),
  dueDate: day('due_date'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------- Kalendarz ------------------------------- */
export const EVENT_CATEGORIES = ['health', 'work', 'personal', 'project'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const events = pgTable(
  'events',
  {
    id: id(),
    date: day('date').notNull(),
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
export const activityDays = pgTable('activity_days', {
  date: day('date').primaryKey(),
  steps: integer('steps'),
  sleepMinutes: integer('sleep_minutes'),
  calories: integer('calories'),
  updatedAt: updatedAt(),
});

export const WORKOUT_TYPES = ['walk', 'run', 'gym', 'bike', 'swim', 'other'] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const workouts = pgTable(
  'workouts',
  {
    id: id(),
    date: day('date').notNull(),
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
