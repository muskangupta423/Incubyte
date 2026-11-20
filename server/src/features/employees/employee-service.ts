import {
  MAX_EXPORT_ROWS,
  type BulkDeleteResult,
  type Employee,
  type EmployeeExportQuery,
  type EmployeeFilterOptions,
  type EmployeeInput,
  type EmployeeListQuery,
  type PaginatedResponse,
} from '@acme/shared';
import type { Database } from '../../db/client';
import { ConflictError, NotFoundError } from '../../http/errors';
import { requireCountryCurrency } from '../countries/country-service';
import {
  deleteEmployee as deleteEmployeeRow,
  deleteEmployees as deleteEmployeeRows,
  DuplicateValueError,
  findEmployeeById,
  findEmployees,
  findEmployeePage,
  findFilterOptions,
  insertEmployee,
  updateEmployee as updateEmployeeRow,
  type EmployeeRecord,
} from './employee-repository';

export async function listEmployees(
  db: Database,
  query: EmployeeListQuery,
): Promise<PaginatedResponse<Employee>> {
  const { employees, totalItems } = await findEmployeePage(db, query);
  return {
    items: employees,
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / query.pageSize),
  };
}

/** Everyone matching the search and filters (exports), capped so one response stays small. */
export async function exportEmployees(
  db: Database,
  query: EmployeeExportQuery,
): Promise<Employee[]> {
  return findEmployees(db, query, MAX_EXPORT_ROWS);
}

export async function getFilterOptions(db: Database): Promise<EmployeeFilterOptions> {
  return findFilterOptions(db);
}

export async function getEmployee(db: Database, id: number): Promise<Employee> {
  return (await findEmployeeById(db, id)) ?? throwNotFound(id);
}

export async function createEmployee(db: Database, input: EmployeeInput): Promise<Employee> {
  const record = await toRecord(db, input);
  return withConflictCheck(() => insertEmployee(db, record));
}

export async function updateEmployee(
  db: Database,
  id: number,
  input: EmployeeInput,
): Promise<Employee> {
  const record = await toRecord(db, input);
  const updated = await withConflictCheck(() => updateEmployeeRow(db, id, record));
  return updated ?? throwNotFound(id);
}

export async function deleteEmployee(db: Database, id: number): Promise<void> {
  const deleted = await deleteEmployeeRow(db, id);
  if (!deleted) throwNotFound(id);
}

/**
 * Deletes the selected employees together. Ids that no longer exist are not an error — someone may
 * have deleted them already — the result says how many were actually deleted.
 */
export async function deleteEmployees(
  db: Database,
  ids: readonly number[],
): Promise<BulkDeleteResult> {
  return { deletedCount: await deleteEmployeeRows(db, ids) };
}

/** Business rule: an employee is always paid in their (set-up) country's currency. */
async function toRecord(db: Database, input: EmployeeInput): Promise<EmployeeRecord> {
  return { ...input, currency: await requireCountryCurrency(db, input.country) };
}

const DUPLICATE_MESSAGES: Record<DuplicateValueError['field'], string> = {
  employeeCode: 'Another employee already has this employee code.',
  email: 'Another employee already uses this email address.',
};

async function withConflictCheck<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof DuplicateValueError) {
      const message = DUPLICATE_MESSAGES[error.field];
      throw new ConflictError(message, [{ field: error.field, message }]);
    }
    throw error;
  }
}

function throwNotFound(id: number): never {
  throw new NotFoundError(`Employee ${id} was not found.`);
}
