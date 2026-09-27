// A Postgres database inside the test process, with the dashboard's tables in it.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { Db, Param } from '../../src/lib/dashboard/db';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

export interface TestDb extends Db {
  close(): Promise<void>;
}

export async function testDb(): Promise<TestDb> {
  const lite = new PGlite();
  for (const file of migrationFiles()) await lite.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
  return {
    async query<Row>(text: string, params: readonly Param[] = []) {
      const result = await lite.query<Row>(text, [...params]);
      return result.rows;
    },
    close: () => lite.close(),
  };
}
