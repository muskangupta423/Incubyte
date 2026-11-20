import { z } from 'zod';
import { countryCodeFromInput } from './countries';
import { employeeInputSchema } from './employees';

/**
 * Bulk upload (Excel / CSV). The browser reads the file into rows and the API checks and saves
 * them; both use these definitions, so the template, the checks and the messages always agree.
 */

/** Most rows one file may have: all of ACME today, and small enough for one request (~2 MB). */
export const MAX_IMPORT_ROWS = 10_000;

/** Columns of the template, in order. Headers are matched ignoring letter case and spaces. */
export const IMPORT_COLUMNS = [
  { key: 'employeeCode', header: 'Employee code' },
  { key: 'fullName', header: 'Full name' },
  { key: 'email', header: 'Email' },
  { key: 'jobTitle', header: 'Job title' },
  { key: 'department', header: 'Department' },
  { key: 'country', header: 'Country' },
  { key: 'annualSalary', header: 'Annual salary' },
  { key: 'hireDate', header: 'Hire date' },
] as const;

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number]['key'];

/** Employee code is optional (empty = new employee); every other column must be in the file. */
export const REQUIRED_IMPORT_COLUMNS: readonly ImportColumnKey[] = IMPORT_COLUMNS.map(
  (column) => column.key,
).filter((key) => key !== 'employeeCode');

export function importColumnHeader(key: string): string {
  return IMPORT_COLUMNS.find((column) => column.key === key)?.header ?? key;
}

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** Spreadsheets give numbers as numbers or as text like "1,200,000". */
const numberFromText = (value: unknown) => {
  const cleaned = emptyToUndefined(value);
  if (typeof cleaned !== 'string') return cleaned;
  const parsed = Number(cleaned.replaceAll(',', '').trim());
  return Number.isNaN(parsed) ? cleaned : parsed;
};

/**
 * One row of the file. Same rules as the Add employee form, plus:
 * - Employee code: empty → a new employee (a code is assigned); a code → update that employee.
 * - Country: a code ("IN") or an English name ("India").
 */
export const importRowSchema = employeeInputSchema.extend({
  employeeCode: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^EMP-\d{5,}$/, 'Use a code like EMP-00042, or leave it empty for a new employee')
      .optional(),
  ),
  country: z.preprocess(
    (value) => (typeof value === 'string' ? countryCodeFromInput(value) : value),
    employeeInputSchema.shape.country,
  ),
  annualSalary: z.preprocess(numberFromText, employeeInputSchema.shape.annualSalary),
});

export type ImportRow = z.infer<typeof importRowSchema>;

/** A row as read from the file: its spreadsheet row number plus the raw cell values. */
export const importRequestSchema = z.object({
  rows: z
    .array(z.looseObject({ rowNumber: z.number().int().positive() }), 'Send the rows to import')
    .min(1, 'The file has no employees in it')
    .max(
      MAX_IMPORT_ROWS,
      `A file can have at most ${MAX_IMPORT_ROWS.toLocaleString('en-US')} employees`,
    ),
});

export type ImportRequest = z.infer<typeof importRequestSchema>;

export interface ImportRowError {
  /** As in the spreadsheet: the header is row 1, so the first employee is row 2. */
  rowNumber: number;
  /** Column header, e.g. "Annual salary". */
  column: string;
  message: string;
}

/** Result of checking a file: what would happen, or what must be fixed first. */
export interface ImportCheckResult {
  toCreate: number;
  toUpdate: number;
  /** The first problems found (capped, so a badly broken file still gets a quick answer)… */
  errors: ImportRowError[];
  /** …and how many there are in total. */
  errorCount: number;
}

export interface ImportResult {
  created: number;
  updated: number;
}
