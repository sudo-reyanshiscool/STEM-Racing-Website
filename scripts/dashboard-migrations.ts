// Which migration files there are and how they are kept track of. Used by the local database
// and by the script that prepares the Supabase project.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FOLDER = join(process.cwd(), 'supabase/migrations');

/** The table that records which files have run. It is secured like every other table. */
export const TRACKING = `
  create table if not exists dashboard_migrations (
    name text primary key,
    run_at timestamptz not null default now()
  );
  alter table dashboard_migrations enable row level security;
`;

export interface Migration {
  name: string;
  sql: string;
}

/** The files that have not run yet, in order. */
export function pending(done: ReadonlySet<string>): Migration[] {
  return readdirSync(FOLDER)
    .filter((name) => name.endsWith('.sql') && !done.has(name))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(FOLDER, name), 'utf8') }));
}
