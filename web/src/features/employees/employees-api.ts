import type {
  BulkDeleteResult,
  Employee,
  EmployeeFilterOptions,
  EmployeeInput,
  EmployeeListQuery,
  PaginatedResponse,
} from '@acme/shared';
import { apiRequest } from '../../services/http-client';

export function fetchEmployees(query: EmployeeListQuery, signal?: AbortSignal) {
  return apiRequest<PaginatedResponse<Employee>>('/employees', { query: { ...query }, signal });
}

export function fetchFilterOptions(signal?: AbortSignal) {
  return apiRequest<EmployeeFilterOptions>('/employees/filter-options', { signal });
}

export function createEmployee(input: EmployeeInput) {
  return apiRequest<Employee>('/employees', { method: 'POST', body: input });
}

export function updateEmployee(id: number, input: EmployeeInput) {
  return apiRequest<Employee>(`/employees/${id}`, { method: 'PUT', body: input });
}

export function deleteEmployee(id: number) {
  return apiRequest<undefined>(`/employees/${id}`, { method: 'DELETE' });
}

/** Deletes several employees in one request (and one database transaction). */
export function deleteEmployees(ids: readonly number[]) {
  return apiRequest<BulkDeleteResult>('/employees/bulk-delete', { method: 'POST', body: { ids } });
}
