import { createApp } from '../../app';
import type { SeedEmployee } from '../../db/seed/generate-employees';
import { seedDatabase } from '../../db/seed/seed-database';
import { createTestDatabase } from '../../db/test-database';

/**
 * Builds employee rows with unique codes and emails. Each test calls createEmployeeFactory()
 * so numbering always starts at 1 (EMP-00001) regardless of test order.
 */
export function createEmployeeFactory() {
  let nextNumber = 1;

  return (overrides: Partial<SeedEmployee> = {}): SeedEmployee => {
    const number = nextNumber++;
    return {
      employee_code: `EMP-${String(number).padStart(5, '0')}`,
      full_name: `Person ${number}`,
      email: `person${number}@acme.test`,
      job_title: 'Software Engineer',
      department: 'Engineering',
      country: 'US',
      currency: 'USD',
      annual_salary: 100_000,
      hire_date: '2020-01-01',
      ...overrides,
    };
  };
}

/** An app backed by a fresh in-memory database containing exactly these employees. */
export async function createAppWith(employees: SeedEmployee[]) {
  const db = await createTestDatabase();
  await seedDatabase(db, employees);
  return { app: createApp({ db }), db };
}
