// A Postgres database on this computer, for working on the dashboard. Nothing needs installing.
// The data is kept in .dashboard-db, which git ignores. Stop it with Ctrl+C.
//   npm run dashboard:db
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { pending, TRACKING } from './dashboard-migrations';

const PORT = 54329;

const db = await PGlite.create(join(process.cwd(), '.dashboard-db'));
await db.exec(TRACKING);
const { rows } = await db.query<{ name: string }>('select name from dashboard_migrations');
for (const migration of pending(new Set(rows.map((row) => row.name)))) {
  await db.transaction(async (tx) => {
    await tx.exec(migration.sql);
    await tx.query('insert into dashboard_migrations (name) values ($1)', [migration.name]);
  });
  console.log(`Ran ${migration.name}`);
}

const server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1' });
await server.start();
console.log('The local database is ready. Put this line in .env:');
console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void server
      .stop()
      .then(() => db.close())
      .then(() => process.exit(0));
  });
}
