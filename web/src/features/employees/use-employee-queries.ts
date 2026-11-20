import type { EmployeeListQuery } from '@acme/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchEmployees, fetchFilterOptions } from './employees-api';

const FIVE_MINUTES = 5 * 60_000;

/** Cache keys in one place, so later changes (create/update/delete) can refresh exactly these. */
export const employeeQueryKeys = {
  all: ['employees'] as const,
  list: (query: EmployeeListQuery) => [...employeeQueryKeys.all, 'list', query] as const,
  filterOptions: () => [...employeeQueryKeys.all, 'filter-options'] as const,
};

export function useEmployeeList(query: EmployeeListQuery) {
  return useQuery({
    queryKey: employeeQueryKeys.list(query),
    queryFn: ({ signal }) => fetchEmployees(query, signal),
    // Keep showing the current page while the next one loads, instead of flashing a spinner.
    placeholderData: keepPreviousData,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: employeeQueryKeys.filterOptions(),
    queryFn: ({ signal }) => fetchFilterOptions(signal),
    // Departments and job titles rarely change.
    staleTime: FIVE_MINUTES,
  });
}
