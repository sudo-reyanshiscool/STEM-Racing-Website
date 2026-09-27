import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  countAttempts,
  forgetAttempt,
  hashAddress,
  MAX_FAILURES,
  recordAttempt,
  WINDOW_MINUTES,
} from '../../src/lib/dashboard/limit';
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
  it('is twenty in 15 minutes, so that one pupil cannot lock out a school with a few mistakes', () => {
    expect(MAX_FAILURES).toBe(20);
    expect(WINDOW_MINUTES).toBe(15);
  });

  it('keeps an address as a hash', async () => {
    const hash = hashAddress('203.0.113.7', SECRET);
    expect(hash).not.toContain('203');
    expect(hash).toBe(hashAddress('203.0.113.7', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.8', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.7', 't'.repeat(32)));
  });

  it('counts each attempt as it is recorded', async () => {
    const address = hashAddress('198.51.100.1', SECRET);
    for (let i = 1; i <= 3; i += 1) {
      await recordAttempt(db, address, after(i));
      expect(await countAttempts(db, address, after(i))).toBe(i);
    }
  });

  it('counts attempts made at the same moment, so guesses sent together see each other', async () => {
    const address = hashAddress('198.51.100.6', SECRET);
    await Promise.all(Array.from({ length: 30 }, () => recordAttempt(db, address, START)));
    expect(await countAttempts(db, address, START)).toBe(30);
  });

  it('forgets one attempt and leaves the rest', async () => {
    const address = hashAddress('198.51.100.7', SECRET);
    const first = await recordAttempt(db, address, START);
    await recordAttempt(db, address, START);
    await forgetAttempt(db, first);
    expect(await countAttempts(db, address, START)).toBe(1);
  });

  it('stops counting an attempt 15 minutes after it was made', async () => {
    const address = hashAddress('198.51.100.2', SECRET);
    await recordAttempt(db, address, START);
    expect(await countAttempts(db, address, after(14.9))).toBe(1);
    expect(await countAttempts(db, address, after(15))).toBe(0);
  });

  it('does not count the attempts of another address', async () => {
    const guesser = hashAddress('198.51.100.3', SECRET);
    for (let i = 0; i < 9; i += 1) await recordAttempt(db, guesser, START);
    expect(await countAttempts(db, hashAddress('198.51.100.4', SECRET), START)).toBe(0);
  });

  it('clears rows that are past the window', async () => {
    await recordAttempt(db, hashAddress('198.51.100.5', SECRET), after(120));
    expect(await db.query('select 1 from signin_failures')).toHaveLength(1);
  });
});
