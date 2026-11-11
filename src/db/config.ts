/**
 * Adres bazy. W Dockerze ustawia go docker-compose.yml; lokalnie (npm run dev)
 * domyślnie celuje w Postgresa z `docker compose up -d db`, wystawionego
 * tylko na 127.0.0.1.
 *
 * Plik celowo nie importuje 'server-only' — korzystają z niego też
 * instrumentation.ts, drizzle.config.ts i skrypty CLI.
 */
export const DEFAULT_DATABASE_URL = 'postgres://mymind:mymind@localhost:5432/mymind';

export function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}
