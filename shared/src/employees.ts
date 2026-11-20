import { z } from 'zod';

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

/** Query strings send "" for cleared inputs; treat that the same as "not provided". */
const optionalText = (schema: z.ZodString) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

/**
 * Query parameters for GET /api/employees.
 * Used by the API to validate requests and by the web app to read/write the URL.
 */
export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: optionalText(z.string().trim().max(MAX_SEARCH_LENGTH)),
  country: optionalText(z.string().trim().toUpperCase().length(2, 'Use a 2-letter country code')),
  department: optionalText(z.string().trim()),
  jobTitle: optionalText(z.string().trim()),
  sortBy: z.enum(EMPLOYEE_SORT_FIELDS).default('fullName'),
  sortOrder: z.enum(SORT_ORDERS).default('asc'),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
