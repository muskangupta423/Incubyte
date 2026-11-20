import { countryName, type Employee, type EmployeeSortField } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EditIcon,
  TrashIcon,
} from '../../components/icons';
import { formatDate, formatMoney } from '../../utils/format';

type SortOrder = 'asc' | 'desc';

interface EmployeeTableProps {
  employees: Employee[];
  sortBy: EmployeeSortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: EmployeeSortField) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

/**
 * One semantic <table>. On phones, CSS turns each row into a card (labels come from data-label)
 * and the sortable headers into a row of sort buttons — same markup, no duplicate content.
 */
export function EmployeeTable({
  employees,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const sortProps = { sortBy, sortOrder, onSortChange };

  return (
    <Table>
      <caption className="visually-hidden">Employees</caption>
      <thead>
        <tr>
          <SortableHeader field="fullName" label="Employee" {...sortProps} />
          <SortableHeader field="employeeCode" label="Code" {...sortProps} />
          <PlainHeader>Role</PlainHeader>
          <PlainHeader>Country</PlainHeader>
          <SortableHeader field="annualSalary" label="Annual salary" align="right" {...sortProps} />
          <SortableHeader field="hireDate" label="Hire date" {...sortProps} />
          <PlainHeader>
            <span className="visually-hidden">Actions</span>
          </PlainHeader>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => (
          <tr key={employee.id}>
            <PrimaryCell>
              <Strong>{employee.fullName}</Strong>
              <Muted>{employee.email}</Muted>
            </PrimaryCell>
            <CodeCell data-label="Code">{employee.employeeCode}</CodeCell>
            <td data-label="Role">
              {employee.jobTitle}
              <Muted>{employee.department}</Muted>
            </td>
            <td data-label="Country">{countryName(employee.country)}</td>
            <NumberCell data-label="Annual salary">
              {formatMoney(employee.annualSalary, employee.currency)}
              {employee.currency !== 'USD' && (
                <Muted>≈ {formatMoney(employee.annualSalaryUsd, 'USD')}</Muted>
              )}
            </NumberCell>
            <td data-label="Hire date">{formatDate(employee.hireDate)}</td>
            <td>
              <RowActions>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(employee)}
                  aria-label={`Edit ${employee.fullName}`}
                >
                  <EditIcon />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(employee)}
                  aria-label={`Delete ${employee.fullName}`}
                >
                  <TrashIcon />
                </Button>
              </RowActions>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

interface SortableHeaderProps {
  field: EmployeeSortField;
  label: string;
  align?: 'left' | 'right';
  sortBy: EmployeeSortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: EmployeeSortField) => void;
}

function SortableHeader({
  field,
  label,
  align = 'left',
  sortBy,
  sortOrder,
  onSortChange,
}: SortableHeaderProps) {
  const isSorted = sortBy === field;
  const ariaSort = sortOrder === 'asc' ? 'ascending' : 'descending';

  return (
    <HeaderCell scope="col" $align={align} aria-sort={isSorted ? ariaSort : undefined}>
      <SortButton type="button" onClick={() => onSortChange(field)} $active={isSorted}>
        {label}
        <SortIcon $active={isSorted}>{sortIconFor(isSorted, sortOrder)}</SortIcon>
      </SortButton>
    </HeaderCell>
  );
}

function sortIconFor(isSorted: boolean, sortOrder: SortOrder) {
  if (!isSorted) return <ArrowUpDownIcon />;
  return sortOrder === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />;
}

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  td {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    vertical-align: top;
  }

  /* Phones: each row becomes a card. */
  thead tr {
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.sm};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  tbody,
  tbody tr,
  tbody td {
    display: block;
  }

  tbody tr {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};
  }

  tbody td {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  }

  tbody td[data-label]::before {
    content: attr(data-label);
    display: block;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }

  tbody td:first-child {
    padding-top: ${({ theme }) => theme.spacing.lg};
  }

  tbody td:last-child {
    padding-bottom: ${({ theme }) => theme.spacing.lg};
  }

  /* Tablet and up: a normal table. */
  ${({ theme }) => theme.media.tablet} {
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};

    thead tr {
      display: table-row;
      margin: 0;
    }

    tbody {
      display: table-row-group;
    }

    tbody tr {
      display: table-row;
      margin: 0;
      border: none;
      border-radius: 0;
    }

    tbody tr:hover {
      background: ${({ theme }) => theme.colors.surfaceMuted};
    }

    tbody td,
    tbody td:first-child,
    tbody td:last-child {
      display: table-cell;
      padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
      border-top: 1px solid ${({ theme }) => theme.colors.border};
    }

    tbody td[data-label]::before {
      content: none;
    }
  }
`;

const HeaderCell = styled.th<{ $align: 'left' | 'right' }>`
  padding: 0;
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    background: ${({ theme }) => theme.colors.surfaceMuted};
    text-align: ${({ $align }) => $align};
  }
`;

/** Non-sortable headers are only needed in table layout (cards have their own labels). */
const PlainHeader = styled.th.attrs({ scope: 'col' })`
  display: none;

  ${({ theme }) => theme.media.tablet} {
    display: table-cell;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-align: left;
  }
`;

const SortButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: ${({ theme }) => theme.layout.controlHeightSmall};
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.surface)};
  color: ${({ theme, $active }) => ($active ? theme.colors.onAccent : theme.colors.textMuted)};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.accentHover};
  }

  ${({ theme }) => theme.media.tablet} {
    padding: 0 ${({ theme }) => theme.spacing.sm};
    border-color: transparent;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

const SortIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
`;

const PrimaryCell = styled.td`
  ${({ theme }) => theme.media.tablet} {
    min-width: 14rem;
  }
`;

const CodeCell = styled.td`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const NumberCell = styled.td`
  font-variant-numeric: tabular-nums;

  ${({ theme }) => theme.media.tablet} {
    text-align: right;
    white-space: nowrap;
  }
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Strong = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Muted = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
