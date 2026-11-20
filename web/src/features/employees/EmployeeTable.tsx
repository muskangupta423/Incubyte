import { countryName, type Employee, type EmployeeSortField } from '@acme/shared';
import styled, { css } from 'styled-components';
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
  /** Ticked rows, for bulk actions (they may include rows on other pages). */
  isSelected: (id: number) => boolean;
  onSelectionChange: (employees: Employee[], isSelected: boolean) => void;
}

/**
 * One semantic <table>. On phones, CSS turns each row into a card (labels come from data-label)
 * and the sortable headers into a row of sort buttons — same markup, no duplicate content.
 * On tablets the table is wider than the screen: it scrolls sideways inside its own card (the page
 * never does), with the Edit/Delete column pinned on the right so actions stay in reach.
 */
export function EmployeeTable({
  employees,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
  isSelected,
  onSelectionChange,
}: EmployeeTableProps) {
  const sortProps = { sortBy, sortOrder, onSortChange };
  const selectedOnPage = employees.filter((employee) => isSelected(employee.id)).length;
  const allSelected = employees.length > 0 && selectedOnPage === employees.length;

  return (
    // Focusable so keyboard users can scroll it sideways when it's wider than the screen.
    <TableScroll tabIndex={0} aria-label="Employees table">
      <Table>
        <caption className="visually-hidden">Employees</caption>
        <thead>
          <tr>
            <SelectHeader scope="col">
              <SelectAllLabel>
                <Checkbox
                  type="checkbox"
                  checked={allSelected}
                  // "Some but not all": shown as a dash. Only settable from script, not from HTML.
                  ref={(checkbox) => {
                    if (checkbox) checkbox.indeterminate = selectedOnPage > 0 && !allSelected;
                  }}
                  onChange={(event) => onSelectionChange(employees, event.target.checked)}
                  aria-label="Select all employees on this page"
                />
                <SelectAllText aria-hidden>Select all</SelectAllText>
              </SelectAllLabel>
            </SelectHeader>
            <SortableHeader field="fullName" label="Employee" {...sortProps} />
            <SortableHeader field="employeeCode" label="Code" {...sortProps} />
            <PlainHeader>Role</PlainHeader>
            <PlainHeader>Country</PlainHeader>
            <SortableHeader
              field="annualSalary"
              label="Annual salary"
              align="right"
              {...sortProps}
            />
            <SortableHeader field="hireDate" label="Hire date" {...sortProps} />
            <ActionsHeader>
              <span className="visually-hidden">Actions</span>
            </ActionsHeader>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const isRowSelected = isSelected(employee.id);
            return (
              <tr key={employee.id} data-selected={isRowSelected || undefined}>
                <SelectCell>
                  <Checkbox
                    type="checkbox"
                    checked={isRowSelected}
                    onChange={(event) => onSelectionChange([employee], event.target.checked)}
                    aria-label={`Select ${employee.fullName}`}
                  />
                </SelectCell>
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
                <ActionsCell>
                  <RowActions>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(employee)}
                      aria-label={`Edit ${employee.fullName}`}
                      title={`Edit ${employee.fullName}`}
                    >
                      <EditIcon />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghostDanger"
                      onClick={() => onDelete(employee)}
                      aria-label={`Delete ${employee.fullName}`}
                      title={`Delete ${employee.fullName}`}
                    >
                      <TrashIcon />
                    </Button>
                  </RowActions>
                </ActionsCell>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableScroll>
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

  tbody tr {
    position: relative;
  }

  /* Cards start with the name (cell 2): cell 1, the checkbox, sits in the card's top-right corner. */
  tbody td:nth-child(2) {
    padding-top: ${({ theme }) => theme.spacing.lg};
  }

  tbody tr[data-selected] {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  tbody td:last-child {
    padding-bottom: ${({ theme }) => theme.spacing.lg};
  }

  /* Tablet and up: a normal table. */
  ${({ theme }) => theme.media.tablet} {
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

    tbody tr:hover,
    tbody tr:hover > td,
    tbody tr[data-selected] > td {
      background: ${({ theme }) => theme.colors.surfaceMuted};
    }

    tbody td,
    tbody td:nth-child(2),
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

/** The card around the table (tablet and up); scrolls sideways when the table is wider than it. */
const TableScroll = styled.div`
  ${({ theme }) => theme.media.tablet} {
    overflow-x: auto;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

/** Pinned to the right edge on tablets, over the columns scrolling underneath. */
const pinnedOnTablet = css`
  ${({ theme }) => theme.media.tablet} {
    position: sticky;
    right: 0;
    box-shadow: inset 1px 0 0 ${({ theme }) => theme.colors.border};
  }

  /* Desktop is wide enough for every column: nothing to pin. */
  ${({ theme }) => theme.media.desktop} {
    position: static;
    box-shadow: none;
  }
`;

const ActionsCell = styled.td`
  ${pinnedOnTablet}

  ${({ theme }) => theme.media.tablet} {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const Checkbox = styled.input`
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;

/** Phones: top-right corner of the card. Tablet and up: a narrow first column. */
const SelectCell = styled.td`
  && {
    position: absolute;
    top: ${({ theme }) => theme.spacing.lg};
    right: ${({ theme }) => theme.spacing.lg};
    padding: 0;
  }

  ${({ theme }) => theme.media.tablet} {
    && {
      position: static;
      width: 1%;
      /* Lines the box up with the first line of the name next to it. */
      padding-top: calc(${({ theme }) => theme.spacing.md} + 0.1875rem);
      padding-right: 0;
      padding-left: ${({ theme }) => theme.spacing.lg};
    }
  }
`;

const SelectHeader = styled.th`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.media.tablet} {
    display: table-cell;
    width: 1%;
    padding: ${({ theme }) => theme.spacing.sm} 0 ${({ theme }) => theme.spacing.sm}
      ${({ theme }) => theme.spacing.lg};
    background: ${({ theme }) => theme.colors.surfaceMuted};
    vertical-align: middle;
  }
`;

const SelectAllLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.layout.controlHeightSmall};
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  ${({ theme }) => theme.media.tablet} {
    min-height: 0;
    padding: 0;
    border: none;
  }
`;

/** Phones show the words next to the box (no column header there); tables don't need them. */
const SelectAllText = styled.span`
  ${({ theme }) => theme.media.tablet} {
    display: none;
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

const ActionsHeader = styled(PlainHeader)`
  ${pinnedOnTablet}
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
