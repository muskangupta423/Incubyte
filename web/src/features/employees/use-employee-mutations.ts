import type { EmployeeInput } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployee, deleteEmployee, updateEmployee } from './employees-api';
import { employeeQueryKeys } from './use-employee-queries';

/**
 * After any change, mark all employee data (list pages, filter options) as outdated,
 * so whatever is on screen refetches and shows the change.
 */
function useRefreshEmployeesOnSuccess() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
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
