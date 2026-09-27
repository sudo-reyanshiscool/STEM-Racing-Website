// Slows down guessing. Five failed sign-ins from one address in 15 minutes block that address
// until 15 minutes have passed since the last of them.
import { createHmac } from 'node:crypto';
import type { Db } from './db';

export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

/** Addresses are kept as hashes, so the table holds nothing that names a person or a place. */
export function hashAddress(address: string, secret: string): string {
  return createHmac('sha256', secret).update(`address:${address}`).digest('base64url');
}

function windowStart(now: Date): string {
  return new Date(now.getTime() - WINDOW_MINUTES * 60_000).toISOString();
}

export async function isBlocked(db: Db, addressHash: string, now: Date = new Date()): Promise<boolean> {
  const rows = await db.query<{ count: number }>(
    `select count(*)::int as count from signin_failures
     where address_hash = $1 and happened_at > $2::timestamptz`,
    [addressHash, windowStart(now)],
  );
  return (rows[0]?.count ?? 0) >= MAX_FAILURES;
}

export async function recordFailure(db: Db, addressHash: string, now: Date = new Date()): Promise<void> {
  await db.query('insert into signin_failures (address_hash, happened_at) values ($1, $2::timestamptz)', [
    addressHash,
    now.toISOString(),
  ]);
  // Rows past the window decide nothing. Clearing them here keeps the table small.
  await db.query('delete from signin_failures where happened_at <= $1::timestamptz', [windowStart(now)]);
}
