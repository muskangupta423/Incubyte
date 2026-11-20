import { beforeEach, describe, expect, it } from 'vitest';
import type { Database } from './client';
import { migrate } from './migrate';
import { createTestDatabase } from './test-database';

const validEmployee = {
  employee_code: 'EMP-00001',
  full_name: 'Asha Rao',
  email: 'asha.rao@acme.test',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  currency: 'INR',
  annual_salary: 1_800_000,
  hire_date: '2022-04-01',
};

type EmployeeRow = typeof validEmployee;

function insertEmployee(db: Database, overrides: Partial<EmployeeRow> = {}) {
  const employee = { ...validEmployee, ...overrides };
  return db.execute({
    sql: `INSERT INTO employees
            (employee_code, full_name, email, job_title, department, country, currency, annual_salary, hire_date)
          VALUES
            (:employee_code, :full_name, :email, :job_title, :department, :country, :currency, :annual_salary, :hire_date)`,
    args: employee,
  });
}

describe('database schema', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.execute(
      `INSERT INTO exchange_rates (currency, usd_rate, as_of_date) VALUES ('INR', 0.012, '2026-11-01')`,
    );
  });

  it('can be applied again without errors or data loss', async () => {
    await insertEmployee(db);

    await migrate(db);

    const result = await db.execute('SELECT count(*) AS total FROM employees');
    expect(result.rows[0]?.total).toBe(1);
  });

  it('starts the employee-code counter from the highest existing code, never lowering it', async () => {
    await insertEmployee(db, { employee_code: 'EMP-00042' });
    await db.execute(`UPDATE sequences SET last_value = 10 WHERE name = 'employee_code'`);

    await migrate(db);
    const afterSync = await db.execute(
      `SELECT last_value FROM sequences WHERE name = 'employee_code'`,
    );
    await db.execute(`UPDATE sequences SET last_value = 99 WHERE name = 'employee_code'`);
    await migrate(db);
    const afterSecondSync = await db.execute(
      `SELECT last_value FROM sequences WHERE name = 'employee_code'`,
    );

    expect(afterSync.rows[0]?.last_value).toBe(42);
    expect(afterSecondSync.rows[0]?.last_value).toBe(99);
  });

  it('stores a valid employee with timestamps filled in', async () => {
    await insertEmployee(db);

    const result = await db.execute('SELECT * FROM employees');
    expect(result.rows[0]).toMatchObject({ ...validEmployee, id: 1 });
    expect(result.rows[0]?.created_at).toEqual(expect.any(String));
  });

  it('rejects a duplicate employee code', async () => {
    await insertEmployee(db);

    await expect(insertEmployee(db, { email: 'other@acme.test' })).rejects.toThrow(/UNIQUE/);
  });

  it('rejects a duplicate email, ignoring letter case', async () => {
    await insertEmployee(db);

    await expect(
      insertEmployee(db, { employee_code: 'EMP-00002', email: 'ASHA.RAO@acme.test' }),
    ).rejects.toThrow(/UNIQUE/);
  });

  it.each([0, -1])('rejects an annual salary of %i', async (salary) => {
    await expect(insertEmployee(db, { annual_salary: salary })).rejects.toThrow(/CHECK/);
  });

  it('rejects a blank name', async () => {
    await expect(insertEmployee(db, { full_name: '   ' })).rejects.toThrow(/CHECK/);
  });

  it('rejects a currency that has no exchange rate', async () => {
    await expect(insertEmployee(db, { currency: 'XYZ' })).rejects.toThrow(/FOREIGN KEY/);
  });

  it('rejects a salary that is not a whole number', async () => {
    await expect(insertEmployee(db, { annual_salary: 1500.5 })).rejects.toThrow(
      /cannot store REAL value in INTEGER column/,
    );
  });
});
