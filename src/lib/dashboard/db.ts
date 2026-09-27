// The one door to the database. Everything else asks through Db, so tests can hand in
// a database that lives inside the test process.
import postgres from 'postgres';

export type Param = string | number | boolean | null;

export interface Db {
  /** Runs one statement. Values go in as $1, $2 and so on, never inside the text. */
  query<Row = Record<string, unknown>>(text: string, params?: readonly Param[]): Promise<Row[]>;
}

/** One connection. resilient() replaces it when it stops answering. */
export interface Client {
  query(text: string, params: readonly Param[]): Promise<unknown[]>;
  close(): Promise<void>;
}

/** The database cannot be reached, or the site has not been told where it is. */
export class DashboardUnavailable extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DashboardUnavailable';
  }
}

/** How long a statement may take. The slowest the dashboard runs takes well under a second. */
export const QUERY_TIMEOUT_MS = 5000;

class Stalled extends Error {}

function within<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Stalled(`No answer in ${ms} ms`)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * A Db that does not wait on a dead connection. Vercel pauses a function between requests,
 * and the connection it held can be gone when the function wakes. A statement sent down it
 * is never answered. So a statement with no answer in time, or a broken connection, is asked
 * once more on a new connection, and after that the dashboard is unavailable.
 *
 * A statement the database refused is a fault in the code. It is passed on and not asked again.
 */
export function resilient(
  open: () => Client,
  isRefusal: (error: unknown) => boolean,
  timeoutMs: number = QUERY_TIMEOUT_MS,
): Db {
  let client: Client | undefined;

  function drop(): void {
    // Not waited for: a dead connection may never finish closing.
    void client?.close().catch(() => {});
    client = undefined;
  }

  async function ask(text: string, params: readonly Param[]): Promise<unknown[]> {
    client ??= open();
    try {
      return await within(client.query(text, params), timeoutMs);
    } catch (error) {
      if (!isRefusal(error)) drop();
      throw error;
    }
  }

  return {
    async query<Row>(text: string, params: readonly Param[] = []) {
      try {
        return (await ask(text, params)) as Row[];
      } catch (error) {
        if (isRefusal(error)) throw error;
      }
      try {
        return (await ask(text, params)) as Row[];
      } catch (error) {
        if (isRefusal(error)) throw error;
        throw new DashboardUnavailable('The database cannot be reached', { cause: error });
      }
    },
  };
}

export function connect(url: string): Db {
  return resilient(
    () => {
      // Supabase's pooler in transaction mode has no prepared statements. One connection is
      // enough for a function that serves one request at a time.
      const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 10, max_lifetime: 300, connect_timeout: 5 });
      return {
        query: async (text, params) => [...(await sql.unsafe(text, [...params]))],
        close: () => sql.end({ timeout: 0 }),
      };
    },
    (error) => error instanceof postgres.PostgresError,
  );
}
