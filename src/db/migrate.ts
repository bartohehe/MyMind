/**
 * Ręczne uruchomienie migracji: `npm run db:migrate`.
 * Normalnie nie jest potrzebne — aplikacja migruje bazę sama przy starcie
 * (patrz src/db/index.ts). Przydaje się do sprawdzenia migracji bez startu Next.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
migrate(drizzle(sqlite), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
sqlite.close();

console.log(`Migracje zastosowane: ${dbPath}`);
