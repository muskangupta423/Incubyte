import type { Database } from './client';
import { SYNC_EMPLOYEE_CODE_SEQUENCE_SQL } from './employee-code';
import { SCHEMA_STATEMENTS } from './schema';

/** Creates any missing tables and indexes, and syncs the employee-code counter, in one all-or-nothing batch. */
export async function migrate(db: Database): Promise<void> {
  await db.batch([...SCHEMA_STATEMENTS, SYNC_EMPLOYEE_CODE_SEQUENCE_SQL], 'write');
}
