import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashAddress, isBlocked, MAX_FAILURES, recordFailure, WINDOW_MINUTES } from '../../src/lib/dashboard/limit';
import { testDb, type TestDb } from '../helpers/database';

const SECRET = 's'.repeat(32);
const START = new Date('2026-09-28T09:00:00Z');
const after = (minutes: number) => new Date(START.getTime() + minutes * 60_000);

let db: TestDb;
beforeAll(async () => {
  db = await testDb();
});
afterAll(() => db.close());

describe('the limit on failed sign-ins', () => {
  it('is five in 15 minutes', () => {
    expect(MAX_FAILURES).toBe(5);
    expect(WINDOW_MINUTES).toBe(15);
  });

  it('keeps an address as a hash', async () => {
    const hash = hashAddress('203.0.113.7', SECRET);
    expect(hash).not.toContain('203');
    expect(hash).toBe(hashAddress('203.0.113.7', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.8', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.7', 't'.repeat(32)));
  });

  it('allows four failures and blocks at the fifth', async () => {
    const address = hashAddress('198.51.100.1', SECRET);
    for (let i = 0; i < 4; i += 1) await recordFailure(db, address, after(i));
    expect(await isBlocked(db, address, after(4))).toBe(false);
    await recordFailure(db, address, after(4));
    expect(await isBlocked(db, address, after(4))).toBe(true);
  });

  it('lifts the block 15 minutes after the first of the five', async () => {
    const address = hashAddress('198.51.100.2', SECRET);
    for (let i = 0; i < 5; i += 1) await recordFailure(db, address, after(i));
    expect(await isBlocked(db, address, after(14.9))).toBe(true);
    expect(await isBlocked(db, address, after(15))).toBe(false);
  });

  it('does not block one address for the failures of another', async () => {
    const guesser = hashAddress('198.51.100.3', SECRET);
    for (let i = 0; i < 9; i += 1) await recordFailure(db, guesser, START);
    expect(await isBlocked(db, guesser, START)).toBe(true);
    expect(await isBlocked(db, hashAddress('198.51.100.4', SECRET), START)).toBe(false);
  });

  it('clears rows that are past the window', async () => {
    await recordFailure(db, hashAddress('198.51.100.5', SECRET), after(120));
    const rows = await db.query<{ happened_at: Date }>('select happened_at from signin_failures');
    expect(rows).toHaveLength(1);
  });
});
