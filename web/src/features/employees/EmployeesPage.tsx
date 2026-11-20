import type { Employee, EmployeeListQuery, EmployeeSortField } from '@acme/shared';
import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { PlusIcon } from '../../components/icons';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useScreenSize } from '../../hooks/useScreenSize';
import { EmployeeFilters } from './EmployeeFilters';
import { useEmployeeListParams } from './employee-list-params';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeList } from './use-employee-queries';

// The dialogs (and the form libraries they use) download on first use, keeping the list page fast to load.
const EmployeeFormDialog = lazy(() =>
  import('./EmployeeFormDialog').then((module) => ({ default: module.EmployeeFormDialog })),
);
const DeleteEmployeeDialog = lazy(() =>
  import('./DeleteEmployeeDialog').then((module) => ({ default: module.DeleteEmployeeDialog })),
);

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Sorting a new column starts with the most useful order: names A→Z, highest salary and newest hires first. */
const FIRST_SORT_ORDER: Record<EmployeeSortField, 'asc' | 'desc'> = {
  fullName: 'asc',
  employeeCode: 'asc',
  annualSalary: 'desc',
  hireDate: 'desc',
};

/** Which dialog is open. One value instead of several booleans, so two dialogs can never be open at once. */
type OpenDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; employee: Employee }
  | { kind: 'delete'; employee: Employee };

export function EmployeesPage() {
  const { query, searchText, hasFilters, updateQuery, clearFilters } = useEmployeeListParams();
  const isPhone = useScreenSize() === 'phone';
  const [openDialog, setOpenDialog] = useState<OpenDialog>({ kind: 'none' });
  // Closing is two steps: the dialog animates out (open = false), then it is removed (onExited).
  const [isDialogClosing, setIsDialogClosing] = useState(false);
  function showDialog(dialog: OpenDialog) {
    setIsDialogClosing(false);
    setOpenDialog(dialog);
  }
  const dialogVisibility = {
    open: !isDialogClosing,
    onClose: () => setIsDialogClosing(true),
    onExited: () => showDialog({ kind: 'none' }),
  };

  // The URL updates on every keystroke; the request waits until typing pauses.
  const debouncedSearch = useDebouncedValue(query.search, SEARCH_DEBOUNCE_MS);

  function changeSort(field: EmployeeSortField) {
    const sortOrder =
      field === query.sortBy
        ? query.sortOrder === 'asc'
          ? 'desc'
          : 'asc'
        : FIRST_SORT_ORDER[field];
    updateQuery({ sortBy: field, sortOrder });
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description="Search, filter and manage salaries for everyone at ACME."
        actions={
          // Phones: just the + icon (same accessible name), so the title keeps its row.
          <Button
            variant="primary"
            onClick={() => showDialog({ kind: 'add' })}
            aria-label={isPhone ? 'Add employee' : undefined}
          >
            <PlusIcon />
            {!isPhone && 'Add employee'}
          </Button>
        }
      />
      <EmployeeFilters
        searchText={searchText}
        query={query}
        hasFilters={hasFilters}
        onChange={updateQuery}
        onClear={clearFilters}
      />
      <EmployeeResults
        query={{ ...query, search: debouncedSearch }}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        onSortChange={changeSort}
        onPageChange={(page) => updateQuery({ page })}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
        onEdit={(employee) => showDialog({ kind: 'edit', employee })}
        onDelete={(employee) => showDialog({ kind: 'delete', employee })}
      />

      <Suspense fallback={null}>
        {openDialog.kind === 'add' && <EmployeeFormDialog {...dialogVisibility} />}
        {openDialog.kind === 'edit' && (
          <EmployeeFormDialog employee={openDialog.employee} {...dialogVisibility} />
        )}
        {openDialog.kind === 'delete' && (
          <DeleteEmployeeDialog employee={openDialog.employee} {...dialogVisibility} />
        )}
      </Suspense>
    </>
  );
}

interface EmployeeResultsProps {
  query: EmployeeListQuery;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSortChange: (field: EmployeeSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

/** Chooses what to show for the current request: loading, error, empty or the table. */
function EmployeeResults({
  query,
  hasFilters,
  onClearFilters,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: EmployeeResultsProps) {
  const { data, error, isPending, isPlaceholderData, refetch } = useEmployeeList(query);

  if (isPending) return <LoadingState label="Loading employees…" />;

  if (error) {
    return (
      <ErrorState
        title="Couldn't load employees"
        message={error.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  }

  if (data.items.length === 0) {
    return hasFilters ? (
      <EmptyState
        title="No employees match these filters"
        message="Try a different search, or clear the filters to see everyone."
        action={<Button onClick={onClearFilters}>Clear filters</Button>}
      />
    ) : (
      <EmptyState title="No employees yet" message="Employees you add will appear here." />
    );
  }

  return (
    // While the next page loads, the current one stays visible but dimmed.
    <Results aria-busy={isPlaceholderData} $isUpdating={isPlaceholderData}>
      <EmployeeTable
        employees={data.items}
        sortBy={query.sortBy}
        sortOrder={query.sortOrder}
        onSortChange={onSortChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        totalItems={data.totalItems}
        totalPages={data.totalPages}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </Results>
  );
}

const Results = styled.section<{ $isUpdating: boolean }>`
  opacity: ${({ $isUpdating }) => ($isUpdating ? 0.6 : 1)};
  transition: opacity 150ms ease;
`;
