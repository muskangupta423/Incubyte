import type {
  Employee,
  EmployeeFilterOptions,
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
