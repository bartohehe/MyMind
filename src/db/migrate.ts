/**
 * Ręczne uruchomienie migracji: `npm run db:migrate`.
 * Normalnie nie jest potrzebne — serwer migruje bazę sam przy starcie
 * (src/instrumentation.ts). Przydaje się, żeby sprawdzić migracje bez startu Next.js.
 */
import { databaseUrl } from './config';
import { runMigrations } from './run-migrations';

try {
  process.loadEnvFile();
} catch {
  // Brak .env — zostają zmienne środowiska albo domyślny lokalny adres.
}

const target = databaseUrl().replace(/:\/\/([^:@/]+):[^@/]*@/, '://$1:***@');

runMigrations({ attempts: 3 })
  .then(() => console.log(`Migracje zastosowane: ${target}`))
  .catch((error: unknown) => {
    console.error(`Migracja nie powiodła się (${target}):`, error);
    process.exitCode = 1;
  });
