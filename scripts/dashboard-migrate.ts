// Runs the migration files that the database has not seen, in order. Safe to run again.
// It reads DATABASE_URL from .env, so check that file names the database you mean.
//   npm run dashboard:migrate
import postgres from 'postgres';
import { pending, TRACKING } from './dashboard-migrations';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
try {
  console.log(`Database: ${new URL(url).host}`);
  await sql.unsafe(TRACKING);
  const rows = await sql<{ name: string }[]>`select name from dashboard_migrations`;
  const todo = pending(new Set(rows.map((row) => row.name)));
  for (const migration of todo) {
    await sql.begin(async (tx) => {
      await tx.unsafe(migration.sql);
      await tx`insert into dashboard_migrations (name) values (${migration.name})`;
    });
    console.log(`Ran ${migration.name}`);
  }
  if (todo.length === 0) console.log('Nothing to run. The database is up to date.');
} finally {
  await sql.end();
}
