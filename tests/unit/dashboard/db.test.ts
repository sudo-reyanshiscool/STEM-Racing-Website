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

  it('answers questions asked together on one connection', async () => {
    const client = fake(rows);
    const made = opener([client]);
    const db = resilient(made.open, isRefusal, 50);
    const answers = await Promise.all(Array.from({ length: 8 }, () => db.query('select 1')));
    expect(answers).toHaveLength(8);
    expect(made.count()).toBe(1);
    expect(client.closed).toBe(false);
  });

  it('moves every question asked together onto one new connection when the first connection breaks', async () => {
    const broken = fake(async () => {
      throw new Error('write CONNECTION_DESTROYED');
    });
    const fresh = fake(rows);
    const made = opener([broken, fresh]);
    const db = resilient(made.open, isRefusal, 50);
    const answers = await Promise.all(Array.from({ length: 8 }, () => db.query('select 1')));
    expect(answers).toEqual(Array.from({ length: 8 }, () => [{ one: 1 }]));
    expect(made.count()).toBe(2);
    expect(fresh.closed).toBe(false);
    expect(fresh.asked).toBe(8);
  });

  it('asks one question at a time, because questions sent together down one connection are never answered', async () => {
    let inFlight = 0;
    let most = 0;
    const client = fake(async () => {
      inFlight += 1;
      most = Math.max(most, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return [{ one: 1 }];
    });
    const db = resilient(opener([client]).open, isRefusal, 50);
    await Promise.all(Array.from({ length: 8 }, () => db.query('select 1')));
    expect(most).toBe(1);
    expect(client.asked).toBe(8);
  });

  it('answers in the order the questions were asked', async () => {
    let next = 0;
    const client = fake(async () => [{ n: (next += 1) }]);
    const db = resilient(opener([client]).open, isRefusal, 50);
    const answers = await Promise.all(Array.from({ length: 5 }, () => db.query<{ n: number }>('select 1')));
    expect(answers.map((rows) => rows[0]?.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not count the time a question waits its turn against it', async () => {
    const client = fake(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return [{ one: 1 }];
    });
    const made = opener([client]);
    const db = resilient(made.open, isRefusal, 50);
    // Five questions of 30 ms each take 150 ms in all, and each is inside its own 50 ms.
    const answers = await Promise.all(Array.from({ length: 5 }, () => db.query('select 1')));
    expect(answers).toHaveLength(5);
    expect(made.count()).toBe(1);
  });

  it('goes on to the next question after one fails', async () => {
    let asked = 0;
    const client = fake(async () => {
      asked += 1;
      if (asked === 1) throw new Refused('violates check constraint');
      return [{ one: 1 }];
    });
    const db = resilient(opener([client]).open, isRefusal, 50);
    const results = await Promise.allSettled([db.query('insert'), db.query('select 1')]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled']);
  });

  it('does not close the connection over a statement the database refused while others are being asked', async () => {
    let asked = 0;
    const client = fake(async () => {
      asked += 1;
      if (asked === 3) throw new Refused('violates check constraint');
      return [{ one: 1 }];
    });
    const made = opener([client]);
    const db = resilient(made.open, isRefusal, 50);
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => db.query('select 1')));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(5);
    expect(client.closed).toBe(false);
    expect(made.count()).toBe(1);
  });
});
