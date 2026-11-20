import type { Employee } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { Dialog, type DialogVisibility } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { useToast } from '../../components/toast/toast-context';
import { formatNumber } from '../../utils/format';
import { useDeleteEmployees } from './use-employee-mutations';

/** Enough names to recognise the selection, without a long scrolling list. */
const NAMES_SHOWN = 5;

interface BulkDeleteEmployeesDialogProps extends DialogVisibility {
  employees: readonly Employee[];
  /** Called after the employees are deleted (e.g. to clear the selection). */
  onDeleted: () => void;
}

/** One confirmation for all selected employees, naming the first few so the user can check the selection. */
export function BulkDeleteEmployeesDialog({
  employees,
  onDeleted,
  open,
  onClose,
  onExited,
}: BulkDeleteEmployeesDialogProps) {
  const { showToast } = useToast();
  const deleteEmployees = useDeleteEmployees();
  const count = employees.length;
  const countLabel = employeeCount(count);
  const hiddenCount = count - NAMES_SHOWN;

  function confirmDelete() {
    deleteEmployees.mutate(
      employees.map((employee) => employee.id),
      {
        onSuccess: ({ deletedCount }) => {
          showToast(deletedMessage(deletedCount, count), 'danger');
          onDeleted();
          onClose();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onExited={onExited}
      variant="centered"
      title={`Delete ${countLabel}?`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteEmployees.isPending}>
            {deleteEmployees.isPending ? 'Deleting…' : `Delete ${countLabel}`}
          </Button>
        </>
      }
    >
      {deleteEmployees.error && <InlineAlert>{deleteEmployees.error.message}</InlineAlert>}
      <Text>
        These employees and their salary records will be permanently deleted. This can&apos;t be
        undone.
      </Text>
      <Names aria-label="Employees to delete">
        {employees.slice(0, NAMES_SHOWN).map((employee) => (
          <li key={employee.id}>
            <strong>{employee.fullName}</strong> ({employee.employeeCode})
          </li>
        ))}
        {hiddenCount > 0 && <li>and {formatNumber(hiddenCount)} more</li>}
      </Names>
    </Dialog>
  );
}

function employeeCount(count: number): string {
  return count === 1 ? '1 employee' : `${formatNumber(count)} employees`;
}

/** "3 employees deleted", plus a note if some had already been deleted by someone else. */
function deletedMessage(deletedCount: number, requestedCount: number): string {
  const message = `${employeeCount(deletedCount)} deleted`;
  const alreadyGone = requestedCount - deletedCount;
  if (alreadyGone === 0) return message;
  return `${message}. ${employeeCount(alreadyGone)} had already been removed.`;
}

const Text = styled.p`
  margin: 0;
`;

const Names = styled.ul`
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  padding-left: ${({ theme }) => theme.spacing.xl};

  li + li {
    margin-top: ${({ theme }) => theme.spacing.xs};
  }
`;
