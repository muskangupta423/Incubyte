import type { EmployeeListQuery, EmployeeSortField } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { EmployeeFilters } from './EmployeeFilters';
import { useEmployeeListParams } from './employee-list-params';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeList } from './use-employee-queries';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Sorting a new column starts with the most useful order: names A→Z, highest salary and newest hires first. */
const FIRST_SORT_ORDER: Record<EmployeeSortField, 'asc' | 'desc'> = {
  fullName: 'asc',
  employeeCode: 'asc',
  annualSalary: 'desc',
  hireDate: 'desc',
};

export function EmployeesPage() {
  const { query, searchText, hasFilters, updateQuery, clearFilters } = useEmployeeListParams();

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
      />
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
}

/** Chooses what to show for the current request: loading, error, empty or the table. */
function EmployeeResults({
  query,
  hasFilters,
  onClearFilters,
  onSortChange,
  onPageChange,
  onPageSizeChange,
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
