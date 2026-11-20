import type { InStatement } from '@libsql/client';
import type { Database } from '../client';
import type { SeedEmployee } from './generate-employees';
import { EXCHANGE_RATES_AS_OF, SEED_COUNTRIES } from './reference-data';

/**
 * Rows per INSERT statement. Multi-row inserts mean ~20 statements for 10,000 employees instead of 10,000.
 * 500 rows × 9 columns = 4,500 parameters, well under SQLite's limit of 32,766.
 */
const ROWS_PER_INSERT = 500;

const EMPLOYEE_COLUMNS = [
  'employee_code',
  'full_name',
  'email',
  'job_title',
  'department',
  'country',
  'currency',
  'annual_salary',
  'hire_date',
] as const satisfies readonly (keyof SeedEmployee)[];

/**
 * Replaces all employees and exchange rates with the given seed data.
 * Runs as ONE batch, which libSQL executes as a single transaction: it either fully succeeds or changes nothing.
 */
export async function seedDatabase(
  db: Database,
  employees: readonly SeedEmployee[],
): Promise<void> {
  await db.batch(
    [
      'DELETE FROM employees',
      'DELETE FROM exchange_rates',
      ...exchangeRateInserts(),
      ...employeeInserts(employees),
    ],
    'write',
  );
}

function exchangeRateInserts(): InStatement[] {
  return SEED_COUNTRIES.map((country) => ({
    sql: 'INSERT INTO exchange_rates (currency, usd_rate, as_of_date) VALUES (?, ?, ?)',
    args: [country.currency, country.usdRate, EXCHANGE_RATES_AS_OF],
  }));
}

function employeeInserts(employees: readonly SeedEmployee[]): InStatement[] {
  const statements: InStatement[] = [];
  const rowPlaceholder = `(${EMPLOYEE_COLUMNS.map(() => '?').join(', ')})`;

  for (let start = 0; start < employees.length; start += ROWS_PER_INSERT) {
    const chunk = employees.slice(start, start + ROWS_PER_INSERT);
    statements.push({
      sql: `INSERT INTO employees (${EMPLOYEE_COLUMNS.join(', ')})
            VALUES ${chunk.map(() => rowPlaceholder).join(', ')}`,
      args: chunk.flatMap((employee) => EMPLOYEE_COLUMNS.map((column) => employee[column])),
    });
  }

  return statements;
}
