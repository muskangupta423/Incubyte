import { openDatabase, type Database } from './client';
import { migrate } from './migrate';

/** A fresh, empty in-memory database with the schema applied. Each call is fully isolated. */
export async function createTestDatabase(): Promise<Database> {
  const db = await openDatabase({ url: ':memory:' });
  await migrate(db);
  return db;
}
