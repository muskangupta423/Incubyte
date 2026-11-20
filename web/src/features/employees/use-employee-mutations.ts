import type { EmployeeInput } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployee, deleteEmployee, deleteEmployees, updateEmployee } from './employees-api';

/**
 * After any change, mark all cached server data as outdated: the employee list, filter options
 * AND the insights dashboard are all derived from employees. Whatever is on screen refetches.
 */
function useRefreshEmployeesOnSuccess() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateEmployee() {
  const refresh = useRefreshEmployeesOnSuccess();
  return useMutation({ mutationFn: createEmployee, onSuccess: refresh });
}

export function useUpdateEmployee() {
  const refresh = useRefreshEmployeesOnSuccess();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EmployeeInput }) => updateEmployee(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteEmployee() {
  const refresh = useRefreshEmployeesOnSuccess();
  return useMutation({ mutationFn: deleteEmployee, onSuccess: refresh });
}

export function useDeleteEmployees() {
  const refresh = useRefreshEmployeesOnSuccess();
  return useMutation({ mutationFn: deleteEmployees, onSuccess: refresh });
}
