import type { InStatement, InValue } from '@libsql/client';
import type { Database } from '../../db/client';
import { RESERVE_EMPLOYEE_CODES_SQL, RESERVED_EMPLOYEE_CODE_SQL } from '../../db/employee-code';
import { runWrite, type EmployeeRecord } from '../employees/employee-repository';

/**
 * Rows per statement, for lookups and writes. 500 rows × 10 values = 5,000 parameters,
 * well under SQLite's limit of 32,766, and ~20 statements for 10,000 rows instead of 10,000.
 */
const ROWS_PER_STATEMENT = 500;

/** Employee code → email, for the codes that exist. */
export async function findEmailsByCode(
  db: Database,
  codes: readonly string[],
): Promise<Map<string, string>> {
  const rows = await selectIn(
    db,
    'SELECT employee_code, email FROM employees',
    'employee_code',
    codes,
  );
  return new Map(rows.map((row) => [String(row.employee_code), String(row.email)]));
}

/** Email → code of the employee who has it, for the emails already in use. */
export async function findCodesByEmail(
  db: Database,
  emails: readonly string[],
): Promise<Map<string, string>> {
  const rows = await selectIn(db, 'SELECT employee_code, email FROM employees', 'email', emails);
  return new Map(rows.map((row) => [String(row.email), String(row.employee_code)]));
}

export type ImportUpdate = EmployeeRecord & { employeeCode: string };

const COLUMNS = [
  'full_name',
  'email',
  'job_title',
  'department',
  'country',
  'currency',
  'annual_salary',
  'hire_date',
] as const;

/**
 * Saves the whole file in ONE write batch (one transaction): if any statement fails, nothing is saved.
 * New employees get consecutive codes reserved in one step; updates are upserts by employee code
 * (every code was checked to exist beforehand), changing everything except the code.
 */
export async function saveImport(
  db: Database,
  creates: readonly EmployeeRecord[],
  updates: readonly ImportUpdate[],
): Promise<void> {
  const statements: InStatement[] = [];

  if (creates.length > 0) {
    statements.push({ sql: RESERVE_EMPLOYEE_CODES_SQL, args: [creates.length] });
    for (const [chunkStart, chunk] of chunksWithStart(creates)) {
      statements.push({
        sql: `INSERT INTO employees (employee_code, ${COLUMNS.join(', ')})
              VALUES ${chunk.map(() => `(${RESERVED_EMPLOYEE_CODE_SQL}, ${placeholders(COLUMNS.length)})`).join(', ')}`,
        // In file order: the first new row gets the lowest reserved number (offset n-1 from the last).
        args: chunk.flatMap((record, i) => [
          creates.length - 1 - (chunkStart + i),
          ...recordValues(record),
        ]),
      });
    }
  }

  for (const chunk of chunks(updates)) {
    statements.push({
      sql: `INSERT INTO employees (employee_code, ${COLUMNS.join(', ')})
            VALUES ${chunk.map(() => `(${placeholders(COLUMNS.length + 1)})`).join(', ')}
            ON CONFLICT (employee_code) DO UPDATE SET
              ${COLUMNS.map((column) => `${column} = excluded.${column}`).join(', ')},
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      args: chunk.flatMap((record) => [record.employeeCode, ...recordValues(record)]),
    });
  }

  await runWrite(db, statements);
}

function recordValues(record: EmployeeRecord): InValue[] {
  return [
    record.fullName,
    record.email,
    record.jobTitle,
    record.department,
    record.country,
    record.currency,
    record.annualSalary,
    record.hireDate,
  ];
}

async function selectIn(db: Database, select: string, column: string, values: readonly string[]) {
  const results = await Promise.all(
    chunks(values).map((chunk) =>
      db.execute({
        sql: `${select} WHERE ${column} IN (${placeholders(chunk.length)})`,
        args: [...chunk],
      }),
    ),
  );
  return results.flatMap((result) => result.rows);
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

function chunks<T>(items: readonly T[]): T[][] {
  return chunksWithStart(items).map(([, chunk]) => chunk);
}

/** [index of the chunk's first item, chunk] pairs. */
function chunksWithStart<T>(items: readonly T[]): [number, T[]][] {
  const result: [number, T[]][] = [];
  for (let start = 0; start < items.length; start += ROWS_PER_STATEMENT) {
    result.push([start, items.slice(start, start + ROWS_PER_STATEMENT)]);
  }
  return result;
}
