import { z } from 'zod';
import { countryCode, optionalFilter } from './schema-helpers';

/** An employee as returned by the API. Salaries are whole units of the employee's local currency. */
export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  annualSalary: number;
  /** annualSalary converted with the fixed exchange-rate snapshot, rounded to whole dollars. */
  annualSalaryUsd: number;
  hireDate: string;
}

/** Values that currently exist in the data, for filter dropdowns. */
export interface EmployeeFilterOptions {
  departments: string[];
  jobTitles: string[];
}

export const EMPLOYEE_SORT_FIELDS = [
  'fullName',
  'employeeCode',
  'annualSalary',
  'hireDate',
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

/**
 * Query parameters for GET /api/employees.
 * Used by the API to validate requests and by the web app to read/write the URL.
 */
export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: optionalFilter(z.string().trim().max(MAX_SEARCH_LENGTH)),
  country: optionalFilter(countryCode),
  department: optionalFilter(z.string().trim()),
  jobTitle: optionalFilter(z.string().trim()),
  sortBy: z.enum(EMPLOYEE_SORT_FIELDS).default('fullName'),
  sortOrder: z.enum(SORT_ORDERS).default('asc'),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;

export const MAX_ANNUAL_SALARY = 1_000_000_000;
const MAX_TEXT_LENGTH = 100;

const requiredText = (label: string) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(MAX_TEXT_LENGTH, `${label} must be at most ${MAX_TEXT_LENGTH} characters`);

/**
 * Body for creating or updating an employee (PUT replaces all fields).
 * Currency is not part of the input: it is derived from the country.
 * Shared so the web form shows exactly the same rules the API enforces.
 */
export const employeeInputSchema = z.object({
  employeeCode: z
    .string('Employee code is required')
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,20}$/, 'Use 3–20 letters, digits or dashes, e.g. EMP-00042'),
  fullName: requiredText('Full name'),
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address')),
  jobTitle: requiredText('Job title'),
  department: requiredText('Department'),
  country: countryCode,
  annualSalary: z
    .number('Annual salary must be a number')
    .int('Annual salary must be a whole number')
    .positive('Annual salary must be greater than 0')
    .max(MAX_ANNUAL_SALARY, 'Annual salary looks too large — please check it'),
  hireDate: z.iso.date('Use the format YYYY-MM-DD'),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;

/** What a form holds before validation (e.g. country may still be lower-case or empty). */
export type EmployeeInputDraft = z.input<typeof employeeInputSchema>;
