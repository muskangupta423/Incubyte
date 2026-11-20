import { createClient, type Client } from '@libsql/client';

export type Database = Client;

interface DatabaseOptions {
  url: string;
  authToken?: string | undefined;
}

/**
 * Opens a SQLite database through libSQL.
 * The same code works for a local file (`file:local.db`), an in-memory DB (`:memory:`, tests)
 * and a hosted Turso DB (`libsql://...`, production).
 */
export async function openDatabase({ url, authToken }: DatabaseOptions): Promise<Database> {
  const db = createClient(authToken ? { url, authToken } : { url });
  // SQLite does not check foreign keys unless this is switched on.
  await db.execute('PRAGMA foreign_keys = ON');
  return db;
}
