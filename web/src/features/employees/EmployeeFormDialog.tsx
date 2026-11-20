import type { Employee, EmployeeInput } from '@acme/shared';
import { useId } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { useToast } from '../../components/toast/toast-context';
import { EmployeeForm } from './EmployeeForm';
import { useCreateEmployee, useUpdateEmployee } from './use-employee-mutations';

interface EmployeeFormDialogProps {
  /** The employee to edit, or undefined to add a new one. */
  employee?: Employee | undefined;
  onClose: () => void;
}

export function EmployeeFormDialog({ employee, onClose }: EmployeeFormDialogProps) {
  const formId = useId();
  const { showToast } = useToast();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isEditing = employee !== undefined;
  const isSaving = createEmployee.isPending || updateEmployee.isPending;

  function save(input: EmployeeInput): Promise<Employee> {
    return isEditing
      ? updateEmployee.mutateAsync({ id: employee.id, input })
      : createEmployee.mutateAsync(input);
  }

  function handleSaved(saved: Employee) {
    showToast(
      isEditing
        ? `Changes to ${saved.fullName} saved`
        : `${saved.fullName} added as ${saved.employeeCode}`,
    );
    onClose();
  }

  return (
    <Dialog
      open
      title={isEditing ? `Edit ${employee.fullName}` : 'Add employee'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} disabled={isSaving}>
            {submitLabel(isSaving, isEditing)}
          </Button>
        </>
      }
    >
      <EmployeeForm formId={formId} employee={employee} onSubmit={save} onSaved={handleSaved} />
    </Dialog>
  );
}

function submitLabel(isSaving: boolean, isEditing: boolean): string {
  if (isSaving) return 'Saving…';
  return isEditing ? 'Save changes' : 'Add employee';
}
