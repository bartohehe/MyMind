import type { Config } from 'drizzle-kit';

import { databaseUrl } from './src/db/config';

try {
  process.loadEnvFile();
} catch {
  // Brak .env — zostają zmienne środowiska albo domyślny lokalny adres.
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Potrzebne tylko do `db:studio` — `db:generate` liczy migracje z samego schematu.
  dbCredentials: { url: databaseUrl() },
  strict: true,
  verbose: true,
} satisfies Config;
