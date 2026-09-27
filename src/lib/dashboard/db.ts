// The one door to the database. Everything else asks through Db, so tests can hand in
// a database that lives inside the test process.
import postgres from 'postgres';

export type Param = string | number | boolean | null;

export interface Db {
  /** Runs one statement. Values go in as $1, $2 and so on, never inside the text. */
  query<Row = Record<string, unknown>>(text: string, params?: readonly Param[]): Promise<Row[]>;
}

/** The database cannot be reached, or the site has not been told where it is. */
export class DashboardUnavailable extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DashboardUnavailable';
  }
}

export function connect(url: string): Db {
  // Supabase's pooler in transaction mode has no prepared statements. One connection is
  // enough for a function that serves one request at a time.
  const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  return {
    async query<Row>(text: string, params: readonly Param[] = []) {
      try {
        const rows = await sql.unsafe(text, [...params]);
        return [...rows] as Row[];
      } catch (error) {
        // A refused statement is a fault in the code. Anything else is the connection.
        if (error instanceof postgres.PostgresError) throw error;
        throw new DashboardUnavailable('The database cannot be reached', { cause: error });
      }
    },
  };
}
