/**
 * Hak startowy Next.js — wywoływany raz przy uruchomieniu serwera (dev i produkcja),
 * a Next czeka na jego zakończenie, zanim obsłuży pierwsze żądanie.
 * `next build` go nie wywołuje, więc build nie potrzebuje bazy.
 *
 * Tu stosujemy migracje: świeży wolumen po `docker compose up` sam dostaje schemat.
 */
export async function register(): Promise<void> {
  // Import MUSI siedzieć wewnątrz warunku: Next kompiluje ten plik też pod
  // runtime edge, a webpack wycina gałąź `if ('edge' === 'nodejs')` w całości
  // tylko wtedy. Przy wczesnym `return` próbowałby zbundlować `pg` pod edge.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./db/run-migrations');
    await runMigrations();
  }
}
