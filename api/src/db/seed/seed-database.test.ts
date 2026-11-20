import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../client';
import { createTestDatabase } from '../test-database';
import { generateEmployees } from './generate-employees';
import { SEED_COUNTRIES } from './reference-data';
import { seedDatabase } from './seed-database';

async function count(db: Database, table: 'employees' | 'exchange_rates'): Promise<unknown> {
  const result = await db.execute(`SELECT count(*) AS total FROM ${table}`);
  return result.rows[0]?.total;
}

describe('seedDatabase', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  it('stores every generated employee and one exchange rate per currency', async () => {
    // 1,234 is not a multiple of the insert chunk size, so the last partial chunk is covered too.
    const employees = generateEmployees(1_234, 7);

    await seedDatabase(db, employees);

    expect(await count(db, 'employees')).toBe(1_234);
    expect(await count(db, 'exchange_rates')).toBe(SEED_COUNTRIES.length);
    const stored = await db.execute({
      sql: 'SELECT * FROM employees WHERE employee_code = ?',
      args: ['EMP-01234'],
    });
    expect(stored.rows[0]).toMatchObject({ ...employees.at(-1) });
  });

  it('replaces existing data instead of adding to it when run again', async () => {
    await seedDatabase(db, generateEmployees(300, 7));

    await seedDatabase(db, generateEmployees(200, 7));

    expect(await count(db, 'employees')).toBe(200);
    expect(await count(db, 'exchange_rates')).toBe(SEED_COUNTRIES.length);
  });

  it('changes nothing if any row is invalid', async () => {
    await seedDatabase(db, generateEmployees(50, 7));
    const [first, ...rest] = generateEmployees(100, 8);
    if (!first) throw new Error('expected generated employees');

    await expect(seedDatabase(db, [{ ...first, annual_salary: -1 }, ...rest])).rejects.toThrow();

    expect(await count(db, 'employees')).toBe(50);
  });
});
