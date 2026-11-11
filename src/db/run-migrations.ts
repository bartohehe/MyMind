import path from 'node:path';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool, type PoolClient } from 'pg';

import { databaseUrl } from './config';

/** Dowolna stała — klucz blokady doradczej, żeby dwa procesy nie migrowały naraz. */
const MIGRATION_LOCK_ID = 74_369_310;

type Options = {
  /** Ile razy próbować połączyć się z bazą, zanim się poddamy. */
  attempts?: number;
  delayMs?: number;
  log?: (message: string) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * W Dockerze Postgres może jeszcze startować, gdy aplikacja już wstała
 * (ECONNREFUSED albo 57P03 „the database system is starting up") — ponawiamy.
 */
async function connectWithRetry(pool: Pool, attempts: number, delayMs: number, log: (m: string) => void) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await pool.connect();
    } catch (error) {
      if (attempt >= attempts) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      log(`[db] Baza niedostępna (${reason}), próba ${attempt}/${attempts}…`);
      await sleep(delayMs);
    }
  }
}

/**
 * Stosuje brakujące migracje z ./drizzle. Bezpieczne do wołania przy każdym
 * starcie: zastosowane migracje drizzle pamięta w tabeli drizzle.__drizzle_migrations.
 */
export async function runMigrations({
  attempts = 30,
  delayMs = 2_000,
  log = (message: string) => console.log(message),
}: Options = {}): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl(), max: 1 });
  let client: PoolClient | undefined;

  try {
    client = await connectWithRetry(pool, attempts, delayMs, log);
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    try {
      await migrate(drizzle({ client }), {
        migrationsFolder: path.join(process.cwd(), 'drizzle'),
      });
      log('[db] Migracje aktualne.');
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
    }
  } finally {
    client?.release();
    await pool.end();
  }
}
