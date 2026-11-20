import type { Employee, EmployeeListQuery, PaginatedResponse } from '@acme/shared';
import type { Database } from '../../db/client';
import { findEmployeePage } from './employee-repository';

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
