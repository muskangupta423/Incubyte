import {
  MAX_BULK_DELETE,
  type Employee,
  type EmployeeListQuery,
  type EmployeeSortField,
} from '@acme/shared';
import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { PlusIcon, UploadIcon } from '../../components/icons';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../components/toast/toast-context';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useScreenSize } from '../../hooks/useScreenSize';
import { formatNumber } from '../../utils/format';
import { EmployeeFilters } from './EmployeeFilters';
import { useEmployeeListParams } from './employee-list-params';
import { EmployeeTable } from './EmployeeTable';
import { SelectionBar } from './SelectionBar';
import { useRowSelection, type RowSelection } from './use-row-selection';
import { useEmployeeList } from './use-employee-queries';

// The dialogs (and the form libraries they use) download on first use, keeping the list page fast to load.
const EmployeeFormDialog = lazy(() =>
  import('./EmployeeFormDialog').then((module) => ({ default: module.EmployeeFormDialog })),
);
const DeleteEmployeeDialog = lazy(() =>
  import('./DeleteEmployeeDialog').then((module) => ({ default: module.DeleteEmployeeDialog })),
);
const BulkDeleteEmployeesDialog = lazy(() =>
  import('./BulkDeleteEmployeesDialog').then((module) => ({
    default: module.BulkDeleteEmployeesDialog,
  })),
);
// Also brings the spreadsheet library, so it is only downloaded when someone uploads.
const ImportEmployeesDialog = lazy(() =>
  import('../employee-import/ImportEmployeesDialog').then((module) => ({
    default: module.ImportEmployeesDialog,
  })),
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
  | { kind: 'delete'; employee: Employee }
  | { kind: 'bulkDelete'; employees: Employee[] }
  | { kind: 'import' };

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
  const resultsQuery = { ...query, search: debouncedSearch };
  const selection = useRowSelection();
  const { showToast } = useToast();

  function changeSelection(employees: Employee[], isSelected: boolean) {
    if (!selection.setSelected(employees, isSelected)) {
      showToast(`You can select up to ${formatNumber(MAX_BULK_DELETE)} employees at a time`);
    }
  }

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
          // Phones: icons only (same accessible names), so the title keeps its row.
          <>
            <Button
              onClick={() => showDialog({ kind: 'import' })}
              aria-label={isPhone ? 'Upload employees' : undefined}
            >
              <UploadIcon />
              {!isPhone && 'Upload'}
            </Button>
            <Button
              variant="primary"
              onClick={() => showDialog({ kind: 'add' })}
              aria-label={isPhone ? 'Add employee' : undefined}
            >
              <PlusIcon />
              {!isPhone && 'Add employee'}
            </Button>
          </>
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
        query={resultsQuery}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        onSortChange={changeSort}
        onPageChange={(page) => updateQuery({ page })}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
        onEdit={(employee) => showDialog({ kind: 'edit', employee })}
        onDelete={(employee) => showDialog({ kind: 'delete', employee })}
        selection={selection}
        onSelectionChange={changeSelection}
        onBulkDelete={() =>
          showDialog({ kind: 'bulkDelete', employees: selection.selectedEmployees })
        }
      />

      <Suspense fallback={null}>
        {openDialog.kind === 'add' && <EmployeeFormDialog {...dialogVisibility} />}
        {openDialog.kind === 'edit' && (
          <EmployeeFormDialog employee={openDialog.employee} {...dialogVisibility} />
        )}
        {openDialog.kind === 'delete' && (
          <DeleteEmployeeDialog employee={openDialog.employee} {...dialogVisibility} />
        )}
        {openDialog.kind === 'bulkDelete' && (
          <BulkDeleteEmployeesDialog
            employees={openDialog.employees}
            onDeleted={selection.clear}
            {...dialogVisibility}
          />
        )}
        {openDialog.kind === 'import' && <ImportEmployeesDialog {...dialogVisibility} />}
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
  selection: RowSelection;
  onSelectionChange: (employees: Employee[], isSelected: boolean) => void;
  onBulkDelete: () => void;
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
  selection,
  onSelectionChange,
  onBulkDelete,
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

  // E.g. after deleting every employee on the last page: the page no longer exists.
  if (data.items.length === 0 && data.totalItems > 0) {
    return (
      <EmptyState
        title="This page is empty"
        message={`There are ${formatNumber(data.totalPages)} pages of employees now.`}
        action={<Button onClick={() => onPageChange(data.totalPages)}>Go to last page</Button>}
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

  const selectedCount = selection.selectedEmployees.length;
  const selectedOnPage = data.items.filter((employee) => selection.isSelected(employee.id)).length;

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
        isSelected={selection.isSelected}
        onSelectionChange={onSelectionChange}
      />
      {/* Stays at the bottom of the screen while the list scrolls. */}
      <StickyFooter>
        {selectedCount > 0 && (
          <SelectionBar
            count={selectedCount}
            countOnPage={selectedOnPage}
            onClear={selection.clear}
            onDelete={onBulkDelete}
          />
        )}
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalItems={data.totalItems}
          totalPages={data.totalPages}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </StickyFooter>
    </Results>
  );
}

const StickyFooter = styled.div`
  position: sticky;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const Results = styled.section<{ $isUpdating: boolean }>`
  opacity: ${({ $isUpdating }) => ($isUpdating ? 0.6 : 1)};
  transition: opacity 150ms ease;
`;
