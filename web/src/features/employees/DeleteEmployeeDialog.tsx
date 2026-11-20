import type { Employee } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { useToast } from '../../components/toast/toast-context';
import { useDeleteEmployee } from './use-employee-mutations';

interface DeleteEmployeeDialogProps {
  employee: Employee;
  onClose: () => void;
}

/** Deleting is permanent, so it always asks first and names exactly who will be deleted. */
export function DeleteEmployeeDialog({ employee, onClose }: DeleteEmployeeDialogProps) {
  const { showToast } = useToast();
  const deleteEmployee = useDeleteEmployee();

  function confirmDelete() {
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => {
        showToast(`${employee.fullName} deleted`);
        onClose();
      },
    });
  }

  return (
    <Dialog
      open
      variant="centered"
      title="Delete employee?"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteEmployee.isPending}>
            {deleteEmployee.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      {deleteEmployee.error && <InlineAlert>{deleteEmployee.error.message}</InlineAlert>}
      <Text>
        <strong>{employee.fullName}</strong> ({employee.employeeCode}) and their salary record will
        be permanently deleted. This can&apos;t be undone.
      </Text>
    </Dialog>
  );
}

const Text = styled.p`
  margin: 0;
`;
