import type { Employee, EmployeeListQuery, EmployeeSortField } from '@acme/shared';
import type { InValue, Row } from '@libsql/client';
import type { Database } from '../../db/client';

/**
 * Whitelist of sortable columns. User input only ever selects a key from this map,
 * so it can never inject SQL into ORDER BY (which cannot use ? parameters).
 */
const SORT_COLUMNS: Record<EmployeeSortField, string> = {
  fullName: 'e.full_name',
  employeeCode: 'e.employee_code',
  annualSalary: 'e.annual_salary',
  hireDate: 'e.hire_date',
};

/** Only the columns the API returns — no SELECT *. */
const EMPLOYEE_COLUMNS = `
  e.id, e.employee_code, e.full_name, e.email, e.job_title, e.department,
  e.country, e.currency, e.annual_salary, e.hire_date,
  CAST(ROUND(e.annual_salary * r.usd_rate) AS INTEGER) AS annual_salary_usd`;

export interface EmployeePage {
  employees: Employee[];
  totalItems: number;
}

export async function findEmployeePage(
  db: Database,
  query: EmployeeListQuery,
): Promise<EmployeePage> {
  const { whereSql, args } = buildFilters(query);
  const orderSql = `${SORT_COLUMNS[query.sortBy]} ${query.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
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

function buildFilters(query: EmployeeListQuery): { whereSql: string; args: InValue[] } {
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (query.search) {
    conditions.push(
      `(e.full_name LIKE ? ESCAPE '\\' OR e.email LIKE ? ESCAPE '\\' OR e.employee_code LIKE ? ESCAPE '\\')`,
    );
    const pattern = `%${escapeLikePattern(query.search)}%`;
    args.push(pattern, pattern, pattern);
  }
  if (query.country) {
    conditions.push('e.country = ?');
    args.push(query.country);
  }
  if (query.department) {
    conditions.push('e.department = ?');
    args.push(query.department);
  }
  if (query.jobTitle) {
    conditions.push('e.job_title = ?');
    args.push(query.jobTitle);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    args,
  };
}

/** In LIKE, % and _ are wildcards. Escape them so a search for "50%" matches the text "50%". */
function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
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
