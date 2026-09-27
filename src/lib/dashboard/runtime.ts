// The settings the dashboard reads when it runs. This is the only dashboard file in src/lib
// that imports from Astro, so it is the only one the unit tests cannot load.
import { getSecret } from 'astro:env/server';
import { connect, DashboardUnavailable, type Db } from './db';

let db: Db | undefined;

function need(name: string): string {
  const value = getSecret(name);
  if (!value) throw new DashboardUnavailable(`${name} is not set`);
  return value;
}

export function getDb(): Db {
  db ??= connect(need('DATABASE_URL'));
  return db;
}

export function sessionSecret(): string {
  const secret = need('SESSION_SECRET');
  if (secret.length < 32) throw new DashboardUnavailable('SESSION_SECRET needs 32 characters or more');
  return secret;
}

/** Undefined when no mentor code has been set. Then no one can sign in as a mentor. */
export function mentorCodeHash(): string | undefined {
  return getSecret('MENTOR_CODE_HASH') || undefined;
}

export function cronSecret(): string | undefined {
  return getSecret('CRON_SECRET') || undefined;
}
