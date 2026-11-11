// Szybki podgląd bazy: ile migracji zastosowano i ile wierszy ma każda tabela.
// Użycie: node scripts/inspect-db.mjs [ścieżka do app.db]
import Database from 'better-sqlite3';

const db = new Database(process.argv[2] ?? 'data/app.db', { readonly: true });

const migrations = db.prepare('SELECT COUNT(*) AS n FROM __drizzle_migrations').get();
console.log(`Migracje: ${migrations.n}`);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name")
  .all();
for (const { name } of tables) {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get();
  console.log(`  ${name.padEnd(18)} ${n}`);
}
db.close();
