// Szybki podgląd bazy: ile migracji zastosowano i ile wierszy ma każda tabela.
// Użycie: npm run db:inspect   (bierze DATABASE_URL z otoczenia albo domyślny lokalny adres)
import pg from 'pg';

try {
  process.loadEnvFile();
} catch {
  // Brak .env — zostają zmienne środowiska albo domyślny lokalny adres.
}

const url = process.env.DATABASE_URL || 'postgres://mymind:mymind@localhost:5432/mymind';
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const migrations = await client
    .query('SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations')
    .then((r) => r.rows[0].n)
    .catch(() => 0);
  console.log(`Migracje: ${migrations}`);

  const { rows: tables } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  for (const { tablename } of tables) {
    const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM "${tablename}"`);
    console.log(`  ${tablename.padEnd(18)} ${rows[0].n}`);
  }
} finally {
  await client.end();
}
