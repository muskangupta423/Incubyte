import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeInput,
  EmployeeListQuery,
  EmployeeSortField,
} from '@acme/shared';
import type { InStatement, InValue, Row } from '@libsql/client';
// From the web client: the same class the full client throws, without loading the full client
// (and its native SQLite engine), which is not shipped with the serverless function.
import { LibsqlError } from '@libsql/client/web';
import type { Database } from '../../db/client';
import {
  ADVANCE_EMPLOYEE_CODE_SEQUENCE_SQL,
  CURRENT_EMPLOYEE_CODE_SQL,
} from '../../db/employee-code';
import { buildEmployeeFilters } from './employee-filters';

/**
 * Whitelist of sortable columns. User input only ever selects a key from this map,
 * so it can never inject SQL into ORDER BY (which cannot use ? parameters).
 */
const SORT_COLUMNS: Record<EmployeeSortField, readonly string[]> = {
  fullName: ['e.full_name'],
  // Codes are text: plain text order would put EMP-100000 before EMP-99999.
  // Shorter codes first, then text order, gives numeric order.
  employeeCode: ['length(e.employee_code)', 'e.employee_code'],
  annualSalary: ['e.annual_salary'],
  hireDate: ['e.hire_date'],
};

/** Only the columns the API returns — no SELECT *. */
const EMPLOYEE_COLUMNS = `
  e.id, e.employee_code, e.full_name, e.email, e.job_title, e.department,
  e.country, e.currency, e.annual_salary, e.hire_date,
  CAST(ROUND(e.annual_salary * r.usd_rate) AS INTEGER) AS annual_salary_usd`;

/** What gets stored: the validated input plus the currency derived from the country. */
export type EmployeeRecord = EmployeeInput & { currency: string };

/** Thrown when a UNIQUE column (employee code or email) already holds the given value. */
export class DuplicateValueError extends Error {
  constructor(readonly field: 'employeeCode' | 'email') {
    super(`Duplicate value for ${field}`);
    this.name = 'DuplicateValueError';
  }
}

const UNIQUE_COLUMNS: Record<string, DuplicateValueError['field']> = {
  'employees.employee_code': 'employeeCode',
  'employees.email': 'email',
};

export interface EmployeePage {
  employees: Employee[];
  totalItems: number;
}

export async function findEmployeePage(
  db: Database,
  query: EmployeeListQuery,
): Promise<EmployeePage> {
  const { whereSql, args } = buildEmployeeFilters(query);
  const direction = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const orderSql = SORT_COLUMNS[query.sortBy].map((column) => `${column} ${direction}`).join(', ');
  const offset = (query.page - 1) * query.pageSize;

  // Both queries in one read batch: a single round trip and a consistent snapshot
  // (the total can't change between counting and fetching the page).
  const [countResult, pageResult] = await db.batch(
    [
      { sql: `SELECT count(*) AS total FROM employees e ${whereSql}`, args },
      {
        sql: `SELECT ${EMPLOYEE_COLUMNS}
              FROM employees e
              JOIN exchange_rates r ON r.currency = e.currency
              ${whereSql}
              ORDER BY ${orderSql}, e.id ASC
              LIMIT ? OFFSET ?`,
        // e.id as tie-breaker: rows with equal values keep a stable order across pages.
        args: [...args, query.pageSize, offset],
      },
    ],
    'read',
  );

  return {
    totalItems: Number(countResult?.rows[0]?.total ?? 0),
    employees: (pageResult?.rows ?? []).map(toEmployee),
  };
}

/**
 * Values that appear in the data, for the filter dropdowns: countries (codes) that have employees,
 * departments and job titles, A→Z. All three columns are indexed, so this reads the indexes only.
 */
export async function findFilterOptions(db: Database): Promise<EmployeeFilterOptions> {
  const [countries, departments, jobTitles] = await db.batch(
    [
      'SELECT DISTINCT country AS value FROM employees ORDER BY value',
      'SELECT DISTINCT department AS value FROM employees ORDER BY value',
      'SELECT DISTINCT job_title AS value FROM employees ORDER BY value',
    ],
    'read',
  );
  const values = (rows: Row[] = []) => rows.map((row) => String(row.value));
  return {
    countries: values(countries?.rows),
    departments: values(departments?.rows),
    jobTitles: values(jobTitles?.rows),
  };
}

export async function findEmployeeById(db: Database, id: number): Promise<Employee | null> {
  const result = await db.execute(selectEmployeeWhere('e.id = ?', [id]));
  const row = result.rows[0];
  return row ? toEmployee(row) : null;
}

/**
 * Adds an employee with the next system-assigned code, in ONE write batch (one transaction):
 * take the next number → insert with that code → read the new row back.
 * If the insert fails (e.g. duplicate email) everything rolls back, so no number is used up,
 * and SQLite runs write transactions one at a time, so two saves can't get the same code.
 */
export async function insertEmployee(db: Database, record: EmployeeRecord): Promise<Employee> {
  const [, , selectResult] = await runWrite(db, [
    ADVANCE_EMPLOYEE_CODE_SEQUENCE_SQL,
    {
      sql: `INSERT INTO employees
              (employee_code, full_name, email, job_title, department, country, currency, annual_salary, hire_date)
            VALUES ((${CURRENT_EMPLOYEE_CODE_SQL}), ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: recordValues(record),
    },
    selectEmployeeWhere('e.id = last_insert_rowid()', []),
  ]);
  const row = selectResult?.rows[0];
  if (!row) throw new Error('Inserted employee could not be read back');
  return toEmployee(row);
}

/** Returns the updated employee, or null if no employee has this id. */
export async function updateEmployee(
  db: Database,
  id: number,
  record: EmployeeRecord,
): Promise<Employee | null> {
  const [, selectResult] = await runWrite(db, [
    {
      // employee_code is deliberately not here: codes never change once assigned.
      sql: `UPDATE employees
            SET full_name = ?, email = ?, job_title = ?, department = ?,
                country = ?, currency = ?, annual_salary = ?, hire_date = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?`,
      args: [...recordValues(record), id],
    },
    selectEmployeeWhere('e.id = ?', [id]),
  ]);
  const row = selectResult?.rows[0];
  return row ? toEmployee(row) : null;
}

/** Returns false if no employee has this id. */
export async function deleteEmployee(db: Database, id: number): Promise<boolean> {
  const result = await db.execute({ sql: 'DELETE FROM employees WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

/** Deletes every employee in `ids` in one statement (so all or nothing); returns how many existed. */
export async function deleteEmployees(db: Database, ids: readonly number[]): Promise<number> {
  const placeholders = ids.map(() => '?').join(', ');
  const result = await db.execute({
    sql: `DELETE FROM employees WHERE id IN (${placeholders})`,
    args: [...ids],
  });
  return result.rowsAffected;
}

function selectEmployeeWhere(condition: string, args: InValue[]): InStatement {
  return {
    sql: `SELECT ${EMPLOYEE_COLUMNS}
          FROM employees e
          JOIN exchange_rates r ON r.currency = e.currency
          WHERE ${condition}`,
    args,
  };
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

/**
 * Runs a write batch, translating UNIQUE violations into DuplicateValueError.
 * Uniqueness is enforced by the database (not a SELECT beforehand), so two requests
 * arriving at the same time can't both slip through.
 */
export async function runWrite(db: Database, statements: InStatement[]) {
  try {
    return await db.batch(statements, 'write');
  } catch (error) {
    const duplicateField =
      error instanceof LibsqlError ? duplicateFieldIn(error.message) : undefined;
    throw duplicateField ? new DuplicateValueError(duplicateField) : error;
  }
}

function duplicateFieldIn(message: string): DuplicateValueError['field'] | undefined {
  const column = /UNIQUE constraint failed: (\S+)/.exec(message)?.[1];
  return column ? UNIQUE_COLUMNS[column] : undefined;
}

function toEmployee(row: Row): Employee {
  return {
    id: Number(row.id),
    employeeCode: String(row.employee_code),
    fullName: String(row.full_name),
    email: String(row.email),
    jobTitle: String(row.job_title),
    department: String(row.department),
    country: String(row.country),
    currency: String(row.currency),
    annualSalary: Number(row.annual_salary),
    annualSalaryUsd: Number(row.annual_salary_usd),
    hireDate: String(row.hire_date),
  };
}
