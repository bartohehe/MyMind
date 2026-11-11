import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from './schema';

/**
 * Połączenie z SQLite. Jedna instancja na proces (w dev trzymana na globalThis,
 * żeby hot-reload nie otwierał kolejnych uchwytów do pliku).
 *
 * Połączenie jest LENIWE: plik otwiera się i migruje dopiero przy pierwszym
 * zapytaniu, a nie przy imporcie modułu. To ważne, bo `next build` importuje
 * strony w kilku procesach równolegle — gdyby każdy z nich migrował przy imporcie,
 * ścigałyby się o ten sam plik („table already exists"). Build zapytań nie robi
 * (strony są dynamiczne), więc bazy w ogóle nie dotyka.
 *
 * Migracje przy pierwszym użyciu sprawiają, że `docker compose up` na czystym
 * wolumenie po prostu działa, bez ręcznych kroków.
 */

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'app.db');
const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  // Gdyby drugi proces trzymał zapis, poczekaj zamiast od razu rzucać SQLITE_BUSY.
  sqlite.pragma('busy_timeout = 5000');

  const instance = drizzle(sqlite, { schema });
  migrate(instance, { migrationsFolder: MIGRATIONS_DIR });

  return instance;
}

type DrizzleDb = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { __mymindDb?: DrizzleDb };

function getDb(): DrizzleDb {
  globalForDb.__mymindDb ??= createDb();
  return globalForDb.__mymindDb;
}

/**
 * `db` wygląda jak zwykła instancja Drizzle, ale prawdziwe połączenie powstaje
 * przy pierwszym dostępie do dowolnej metody.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, property) {
    const real = getDb();
    const value: unknown = Reflect.get(real, property, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export { schema };
