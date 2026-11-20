import { COUNTRIES, COUNTRY_CODES } from '@acme/shared';
import { describe, expect, it } from 'vitest';
import { formatEmployeeCode } from '../employee-code';
import { generateEmployees, localSalaryRange, SALARY_ROUNDING } from './generate-employees';
import { SEED_COUNTRIES, SEED_ROLES } from './reference-data';

const SEED = 42;

describe('generateEmployees', () => {
  // Generated once and shared: the function is pure, so tests cannot affect each other.
  const employees = generateEmployees(10_000, SEED);

  it('generates the requested number of employees', () => {
    expect(employees).toHaveLength(10_000);
  });

  it('returns exactly the same employees for the same seed', () => {
    expect(generateEmployees(10_000, SEED)).toEqual(employees);
  });

  it('returns different employees for a different seed', () => {
    expect(generateEmployees(100, SEED + 1)).not.toEqual(employees.slice(0, 100));
  });

  it('gives every employee a unique code and a unique email', () => {
    const codes = new Set(employees.map((employee) => employee.employee_code));
    const emails = new Set(employees.map((employee) => employee.email.toLowerCase()));

    expect(codes.size).toBe(employees.length);
    expect(emails.size).toBe(employees.length);
  });

  it('numbers employee codes in order', () => {
    expect(employees[0]?.employee_code).toBe('EMP-00001');
    expect(employees.at(-1)?.employee_code).toBe('EMP-10000');
  });

  it('pays each employee in their country currency, within the local range for their role', () => {
    for (const employee of employees) {
      const country = SEED_COUNTRIES.find((candidate) => candidate.code === employee.country);
      const role = SEED_ROLES.find((candidate) => candidate.jobTitle === employee.job_title);
      if (!country || !role)
        throw new Error(`Unknown country or role on ${employee.employee_code}`);

      const range = localSalaryRange(role, country);
      expect(employee.currency).toBe(COUNTRIES[country.code].currency);
      expect(employee.department).toBe(role.department);
      expect(employee.annual_salary % SALARY_ROUNDING).toBe(0);
      expect(employee.annual_salary).toBeGreaterThanOrEqual(range.min - SALARY_ROUNDING);
      expect(employee.annual_salary).toBeLessThanOrEqual(range.max + SALARY_ROUNDING);
    }
  });

  it('includes every supported country and every role', () => {
    const countries = new Set(employees.map((employee) => employee.country));
    const jobTitles = new Set(employees.map((employee) => employee.job_title));

    expect([...countries].sort()).toEqual([...COUNTRY_CODES].sort());
    expect(jobTitles.size).toBe(SEED_ROLES.length);
  });

  it('uses valid ISO hire dates between 2012 and October 2026', () => {
    for (const employee of employees) {
      expect(employee.hire_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(employee.hire_date >= '2012-01-01' && employee.hire_date <= '2026-10-31').toBe(true);
    }
  });

  it('adds a number to the email when the same name appears again', () => {
    const repeated = employees.filter((employee) => /^priya\.sharma\d*@/.test(employee.email));

    expect(repeated.length).toBeGreaterThan(1);
    expect(repeated[0]?.email).toBe('priya.sharma@acme.test');
    expect(repeated[1]?.email).toBe('priya.sharma2@acme.test');
  });
});

describe('formatEmployeeCode', () => {
  it('pads the number to five digits', () => {
    expect(formatEmployeeCode(42)).toBe('EMP-00042');
  });
});
