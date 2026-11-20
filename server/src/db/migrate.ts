import type { Database } from './client';
import { SYNC_EMPLOYEE_CODE_SEQUENCE_SQL } from './employee-code';
import { SCHEMA_STATEMENTS } from './schema';

/**
 * Databases created before the countries table existed: every country an employee already works in
 * becomes a set-up country. Does nothing once the table is filled (INSERT OR IGNORE).
 */
const BACKFILL_COUNTRIES_SQL = `
  INSERT OR IGNORE INTO countries (code, currency)
  SELECT DISTINCT country, currency FROM employees`;

/** Creates any missing tables and indexes, and syncs derived data, in one all-or-nothing batch. */
export async function migrate(db: Database): Promise<void> {
  await db.batch(
    [...SCHEMA_STATEMENTS, BACKFILL_COUNTRIES_SQL, SYNC_EMPLOYEE_CODE_SEQUENCE_SQL],
    'write',
  );
}
