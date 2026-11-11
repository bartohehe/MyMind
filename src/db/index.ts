import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { databaseUrl } from './config';
import * as schema from './schema';

/**
 * Pula połączeń do PostgreSQL. Jedna na proces (trzymana na globalThis,
 * żeby hot-reload w dev nie zostawiał osieroconych pul).
 *
 * `new Pool()` niczego nie otwiera — pierwsze połączenie powstaje przy pierwszym
 * zapytaniu. Dzięki temu `next build` (który importuje strony) w ogóle nie
 * potrzebuje działającej bazy.
 *
 * Migracje NIE dzieją się tutaj, tylko w src/instrumentation.ts — raz przy
 * starcie serwera, zanim Next obsłuży pierwsze żądanie.
 */

const globalForDb = globalThis as unknown as { __mymindPool?: Pool };

globalForDb.__mymindPool ??= new Pool({
  connectionString: databaseUrl(),
  // Jeden użytkownik na Raspberry Pi — kilka połączeń w zupełności wystarczy.
  max: 5,
});

export const db = drizzle({ client: globalForDb.__mymindPool, schema });

export { schema };
