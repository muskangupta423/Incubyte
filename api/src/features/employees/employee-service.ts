import {
  COUNTRIES,
  type Employee,
  type EmployeeFilterOptions,
  type EmployeeInput,
  type EmployeeListQuery,
  type PaginatedResponse,
} from '@acme/shared';
import type { Database } from '../../db/client';
import { ConflictError, NotFoundError } from '../../http/errors';
import {
  deleteEmployee as deleteEmployeeRow,
  DuplicateValueError,
  findEmployeeById,
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

export async function getFilterOptions(db: Database): Promise<EmployeeFilterOptions> {
  return findFilterOptions(db);
}

export async function getEmployee(db: Database, id: number): Promise<Employee> {
  return (await findEmployeeById(db, id)) ?? throwNotFound(id);
}

export async function createEmployee(db: Database, input: EmployeeInput): Promise<Employee> {
  return withConflictCheck(() => insertEmployee(db, toRecord(input)));
}

export async function updateEmployee(
  db: Database,
  id: number,
  input: EmployeeInput,
): Promise<Employee> {
  const updated = await withConflictCheck(() => updateEmployeeRow(db, id, toRecord(input)));
  return updated ?? throwNotFound(id);
}

export async function deleteEmployee(db: Database, id: number): Promise<void> {
  const deleted = await deleteEmployeeRow(db, id);
  if (!deleted) throwNotFound(id);
}

/** Business rule: an employee is always paid in their country's currency. */
function toRecord(input: EmployeeInput): EmployeeRecord {
  return { ...input, currency: COUNTRIES[input.country].currency };
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
