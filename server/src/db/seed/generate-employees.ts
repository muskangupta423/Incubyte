import { formatEmployeeCode } from '../employee-code';
import { createRandom, type Random } from './random';
import { SEED_COUNTRIES, SEED_ROLES, type SeedCountry, type SeedRole } from './reference-data';

/** One employee row, shaped like the `employees` table columns (without generated fields). */
export interface SeedEmployee {
  employee_code: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  currency: string;
  annual_salary: number;
  hire_date: string;
}

/** Local salaries are rounded to whole thousands, as HR usually states them. */
export const SALARY_ROUNDING = 1_000;

const EMAIL_DOMAIN = 'acme.test';
const EARLIEST_HIRE_DATE = Date.UTC(2012, 0, 1);
const LATEST_HIRE_DATE = Date.UTC(2026, 9, 31);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Converts a role's US salary range to the local currency and market. */
export function localSalaryRange(role: SeedRole, country: SeedCountry) {
  const toLocal = (usd: number) => (usd * country.payLevel) / country.usdRate;
  return { min: toLocal(role.minUsd), max: toLocal(role.maxUsd) };
}

/**
 * Generates `count` realistic employees. Pure function: the same seed always returns the same list.
 */
export function generateEmployees(count: number, seed: number): SeedEmployee[] {
  const random = createRandom(seed);
  const usedEmailCounts = new Map<string, number>();
  const employees: SeedEmployee[] = [];

  for (let sequence = 1; sequence <= count; sequence++) {
    const country = random.pickWeighted(SEED_COUNTRIES);
    const role = random.pickWeighted(SEED_ROLES);
    const firstName = random.pick(country.firstNames);
    const lastName = random.pick(country.lastNames);

    employees.push({
      employee_code: formatEmployeeCode(sequence),
      full_name: `${firstName} ${lastName}`,
      email: uniqueEmail(firstName, lastName, usedEmailCounts),
      job_title: role.jobTitle,
      department: role.department,
      country: country.code,
      currency: country.currency,
      annual_salary: randomSalary(random, role, country),
      hire_date: randomHireDate(random),
    });
  }

  return employees;
}

function randomSalary(random: Random, role: SeedRole, country: SeedCountry): number {
  const { min, max } = localSalaryRange(role, country);
  const salary = random.integer(Math.round(min), Math.round(max));
  return Math.round(salary / SALARY_ROUNDING) * SALARY_ROUNDING;
}

function randomHireDate(random: Random): string {
  const totalDays = Math.floor((LATEST_HIRE_DATE - EARLIEST_HIRE_DATE) / MS_PER_DAY);
  const date = new Date(EARLIEST_HIRE_DATE + random.integer(0, totalDays) * MS_PER_DAY);
  return date.toISOString().slice(0, 10);
}

/** "Hui Min Tan" → "huimin.tan@acme.test"; repeats get a number: "huimin.tan2@acme.test". */
function uniqueEmail(firstName: string, lastName: string, usedCounts: Map<string, number>): string {
  const localPart = `${toEmailWord(firstName)}.${toEmailWord(lastName)}`;
  const timesUsed = (usedCounts.get(localPart) ?? 0) + 1;
  usedCounts.set(localPart, timesUsed);
  const suffix = timesUsed === 1 ? '' : String(timesUsed);
  return `${localPart}${suffix}@${EMAIL_DOMAIN}`;
}

function toEmailWord(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}
