import type { Employee, EmployeeExportQuery } from '@acme/shared';
import { apiRequest } from '../../services/http-client';

/** Everyone matching the search and filters (up to MAX_EXPORT_ROWS), in the list's order. */
export function fetchEmployeesForExport(query: EmployeeExportQuery) {
  return apiRequest<Employee[]>('/employees/export', { query: { ...query } });
}
