import { describe, expect, it } from 'vitest';
import { DashboardUnavailable, resilient, type Client } from '../../../src/lib/dashboard/db';

/** A statement the database refused, as the driver reports it. */
class Refused extends Error {}
const isRefusal = (error: unknown) => error instanceof Refused;

interface Fake extends Client {
  asked: number;
  closed: boolean;
}

function fake(answer: () => Promise<unknown[]>): Fake {
  const client: Fake = {
    asked: 0,
    closed: false,
    query() {
      client.asked += 1;
      return answer();
    },
    async close() {
      client.closed = true;
    },
  };
  return client;
}

const never = () => new Promise<unknown[]>(() => {});
const rows = async () => [{ one: 1 }];

function opener(clients: Fake[]) {
  let opened = 0;
  return { open: () => clients[opened++] ?? fake(never), count: () => opened };
}

describe('the connection to the database', () => {
  it('opens no connection until the first question', async () => {
    const made = opener([fake(rows)]);
    const db = resilient(made.open, isRefusal, 50);
    expect(made.count()).toBe(0);
    expect(await db.query('select 1')).toEqual([{ one: 1 }]);
    expect(made.count()).toBe(1);
  });

  it('keeps one connection for question after question', async () => {
    const first = fake(rows);
    const made = opener([first]);
    const db = resilient(made.open, isRefusal, 50);
    await db.query('select 1');
    await db.query('select 1');
    expect(made.count()).toBe(1);
    expect(first.asked).toBe(2);
  });

  it('gives up on a connection that does not answer, opens another and asks again', async () => {
    const stalled = fake(never);
    const fresh = fake(rows);
    const made = opener([stalled, fresh]);
    const db = resilient(made.open, isRefusal, 50);
    const started = Date.now();
    expect(await db.query('select 1')).toEqual([{ one: 1 }]);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(stalled.closed).toBe(true);
    expect(fresh.asked).toBe(1);
  });

  it('uses the new connection from then on', async () => {
    const fresh = fake(rows);
    const made = opener([fake(never), fresh]);
    const db = resilient(made.open, isRefusal, 50);
    await db.query('select 1');
    await db.query('select 1');
    expect(made.count()).toBe(2);
    expect(fresh.asked).toBe(2);
  });

  it('opens another connection when the first one breaks', async () => {
    const broken = fake(async () => {
      throw new Error('read ECONNRESET');
    });
    const made = opener([broken, fake(rows)]);
    const db = resilient(made.open, isRefusal, 50);
    expect(await db.query('select 1')).toEqual([{ one: 1 }]);
    expect(broken.closed).toBe(true);
  });

  it('says the dashboard is unavailable when the second connection does not answer either', async () => {
    const made = opener([fake(never), fake(never)]);
    const db = resilient(made.open, isRefusal, 50);
    const started = Date.now();
    await expect(db.query('select 1')).rejects.toBeInstanceOf(DashboardUnavailable);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(made.count()).toBe(2);
  });

  it('recovers on the next question after it was unavailable', async () => {
    const made = opener([fake(never), fake(never), fake(rows)]);
    const db = resilient(made.open, isRefusal, 50);
    await expect(db.query('select 1')).rejects.toBeInstanceOf(DashboardUnavailable);
    expect(await db.query('select 1')).toEqual([{ one: 1 }]);
  });

  it('passes on a statement the database refused, and does not ask again', async () => {
    const client = fake(async () => {
      throw new Refused('violates check constraint');
    });
    const made = opener([client]);
    const db = resilient(made.open, isRefusal, 50);
    await expect(db.query('insert')).rejects.toBeInstanceOf(Refused);
    expect(client.asked).toBe(1);
    expect(client.closed).toBe(false);
    expect(made.count()).toBe(1);
  });

  it('is not held up by a connection that will not close', async () => {
    const stalled = fake(never);
    stalled.close = () => new Promise<void>(() => {});
    const made = opener([stalled, fake(rows)]);
    const db = resilient(made.open, isRefusal, 50);
    expect(await db.query('select 1')).toEqual([{ one: 1 }]);
  });
});
