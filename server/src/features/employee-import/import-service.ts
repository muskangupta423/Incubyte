import {
  countryName,
  importColumnHeader,
  importRowSchema,
  type ImportCheckResult,
  type ImportRequest,
  type ImportResult,
  type ImportRow,
  type ImportRowError,
} from '@acme/shared';
import type { Database } from '../../db/client';
import { ConflictError, ValidationError } from '../../http/errors';
import { findCountries } from '../countries/country-repository';
import { DuplicateValueError, type EmployeeRecord } from '../employees/employee-repository';
import {
  findCodesByEmail,
  findEmailsByCode,
  saveImport,
  type ImportUpdate,
} from './import-repository';

/** Problems listed in one answer. A file with more gets the first ones plus the total count. */
const MAX_ERRORS_SHOWN = 100;

interface ImportPlan {
  creates: EmployeeRecord[];
  updates: ImportUpdate[];
  errors: ImportRowError[];
}

type CheckedRow = ImportRow & { rowNumber: number };

/** Checks a file without saving anything: what would be added and updated, or what to fix. */
export async function checkImport(
  db: Database,
  request: ImportRequest,
): Promise<ImportCheckResult> {
  const { creates, updates, errors } = await planImport(db, request);
  return {
    toCreate: creates.length,
    toUpdate: updates.length,
    errors: errors.slice(0, MAX_ERRORS_SHOWN),
    errorCount: errors.length,
  };
}

/**
 * Saves the file — all of it, or nothing. Everything is checked again here, so the result never
 * depends on the data being unchanged since the user's earlier check.
 */
export async function runImport(db: Database, request: ImportRequest): Promise<ImportResult> {
  const { creates, updates, errors } = await planImport(db, request);
  if (errors.length > 0) {
    throw new ValidationError(
      errors.slice(0, MAX_ERRORS_SHOWN).map((error) => ({
        field: `row ${error.rowNumber}: ${error.column}`,
        message: error.message,
      })),
    );
  }
  try {
    await saveImport(db, creates, updates);
  } catch (error) {
    // Only possible if data changed between the checks above and saving, or two rows swap emails.
    if (error instanceof DuplicateValueError) {
      throw new ConflictError(
        'Some emails in the file are used by other employees. Check the file again and retry.',
      );
    }
    throw error;
  }
  return { created: creates.length, updated: updates.length };
}

async function planImport(db: Database, { rows }: ImportRequest): Promise<ImportPlan> {
  const errors: ImportRowError[] = [];
  const addError = (rowNumber: number, field: string, message: string) =>
    errors.push({ rowNumber, column: importColumnHeader(field), message });

  // 1. Each row on its own: the same rules as the Add employee form.
  const checked: CheckedRow[] = [];
  for (const { rowNumber, ...values } of rows) {
    const result = importRowSchema.safeParse(values);
    if (result.success) checked.push({ ...result.data, rowNumber });
    else
      for (const issue of result.error.issues)
        addError(rowNumber, String(issue.path[0]), issue.message);
  }

  // 2. Rows against each other: the same email or code twice in one file.
  const firstRowWith = new Map<string, number>();
  const valid = checked.filter((row) => {
    for (const [field, value] of [
      ['email', row.email],
      ['employeeCode', row.employeeCode],
    ] as const) {
      if (value === undefined) continue;
      const earlierRow = firstRowWith.get(`${field}:${value}`);
      if (earlierRow !== undefined) {
        addError(row.rowNumber, field, `Also used on row ${earlierRow}`);
        return false;
      }
      firstRowWith.set(`${field}:${value}`, row.rowNumber);
    }
    return true;
  });

  // 3. Rows against the database (a few queries for the whole file, not one per row).
  const codes = valid.flatMap((row) => row.employeeCode ?? []);
  const [currencies, emailsByCode, codesByEmail] = await Promise.all([
    findCountries(db).then((countries) => new Map(countries.map((c) => [c.code, c.currency]))),
    findEmailsByCode(db, codes),
    findCodesByEmail(
      db,
      valid.map((row) => row.email),
    ),
  ]);

  const creates: EmployeeRecord[] = [];
  const updates: ImportUpdate[] = [];
  for (const { rowNumber, employeeCode, ...input } of valid) {
    const currency = currencies.get(input.country);
    const emailOwner = codesByEmail.get(input.email);

    if (!currency) {
      addError(
        rowNumber,
        'country',
        `${countryName(input.country)} isn't set up yet — add it from the Add employee form first`,
      );
    } else if (employeeCode !== undefined && !emailsByCode.has(employeeCode)) {
      addError(
        rowNumber,
        'employeeCode',
        `No employee has this code — leave it empty to add a new employee`,
      );
    } else if (emailOwner !== undefined && emailOwner !== employeeCode) {
      addError(rowNumber, 'email', `Already used by ${emailOwner}`);
    } else if (employeeCode === undefined) {
      creates.push({ ...input, currency });
    } else {
      updates.push({ ...input, currency, employeeCode });
    }
  }

  errors.sort((a, b) => a.rowNumber - b.rowNumber);
  return { creates, updates, errors };
}
