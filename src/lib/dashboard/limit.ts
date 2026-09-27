// Slows down guessing. An attempt is written down before the code is checked, so guesses sent
// at the same moment count against each other. An attempt that signs in is forgotten. Once an
// address has 20 failed attempts inside 15 minutes, its next attempts are refused.
import { createHmac } from 'node:crypto';
import type { Db } from './db';

/**
 * A school shares one address, so a low limit lets one pupil lock everyone out with a few
 * wrong codes. Twenty keeps guessing slow and leaves room for honest mistakes.
 */
export const MAX_FAILURES = 20;
export const WINDOW_MINUTES = 15;

/** Addresses are kept as hashes, so the table holds nothing that names a person or a place. */
export function hashAddress(address: string, secret: string): string {
  return createHmac('sha256', secret).update(`address:${address}`).digest('base64url');
}

function windowStart(now: Date): string {
  return new Date(now.getTime() - WINDOW_MINUTES * 60_000).toISOString();
}

/** Writes the attempt down and returns its id. */
export async function recordAttempt(db: Db, addressHash: string, now: Date = new Date()): Promise<number> {
  // Rows past the window decide nothing. Clearing them here keeps the table small.
  await db.query('delete from signin_failures where happened_at <= $1::timestamptz', [windowStart(now)]);
  const rows = await db.query<{ id: number }>(
    'insert into signin_failures (address_hash, happened_at) values ($1, $2::timestamptz) returning id',
    [addressHash, now.toISOString()],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error('The sign-in attempt was not recorded');
  return id;
}

export async function forgetAttempt(db: Db, id: number): Promise<void> {
  await db.query('delete from signin_failures where id = $1', [id]);
}

/** How many attempts from this address are inside the window, the newest included. */
export async function countAttempts(db: Db, addressHash: string, now: Date = new Date()): Promise<number> {
  const rows = await db.query<{ count: number }>(
    `select count(*)::int as count from signin_failures
     where address_hash = $1 and happened_at > $2::timestamptz`,
    [addressHash, windowStart(now)],
  );
  return rows[0]?.count ?? 0;
}
