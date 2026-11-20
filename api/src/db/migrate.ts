import type { Database } from './client';
import { SCHEMA_STATEMENTS } from './schema';

/** Creates any missing tables and indexes in a single all-or-nothing batch. */
export async function migrate(db: Database): Promise<void> {
  await db.batch(SCHEMA_STATEMENTS, 'write');
}
