import { countryName, sortByCountryName, type EmployeeListQuery } from '@acme/shared';
import styled from 'styled-components';
import { ActiveFilters, type ActiveFilter } from '../../components/ActiveFilters';
import { Button } from '../../components/Button';
import { Dialog, useDialog } from '../../components/Dialog';
import { FilterIcon } from '../../components/icons';
import { SearchField } from '../../components/SearchField';
import { SelectField } from '../../components/SelectField';
import { useScreenSize } from '../../hooks/useScreenSize';
import { useFilterOptions } from './use-employee-queries';

type FilterChanges = Pick<EmployeeListQuery, 'search' | 'country' | 'department' | 'jobTitle'>;

interface EmployeeFiltersProps {
  searchText: string;
  query: EmployeeListQuery;
  hasFilters: boolean;
  onChange: (changes: Partial<FilterChanges>, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

const toOptions = (values: string[] = []) => values.map((value) => ({ value, label: value }));

/** Only countries that have employees, so every choice returns results. */
const toCountryOptions = (codes: string[] = []) =>
  sortByCountryName(codes).map((code) => ({ value: code, label: countryName(code) }));

/**
 * Search plus Country / Department / Job title.
 * - Desktop: everything in one row, with a "Clear filters" button.
 * - Tablet: search on its own row, the dropdowns below; chips show what's filtered.
 * - Phone: search and a "Filters" button that opens the dropdowns in a panel; chips below.
 */
export function EmployeeFilters({
  searchText,
  query,
  hasFilters,
  onChange,
  onClear,
}: EmployeeFiltersProps) {
  const { data: filterOptions } = useFilterOptions();
  const screenSize = useScreenSize();
  const filtersPanel = useDialog();

  const activeFilters: ActiveFilter[] = [];
  if (query.country) {
    activeFilters.push({
      name: 'Country',
      value: countryName(query.country),
      onRemove: () => onChange({ country: undefined }),
    });
  }
  if (query.department) {
    activeFilters.push({
      name: 'Department',
      value: query.department,
      onRemove: () => onChange({ department: undefined }),
    });
  }
  if (query.jobTitle) {
    activeFilters.push({
      name: 'Job title',
      value: query.jobTitle,
      onRemove: () => onChange({ jobTitle: undefined }),
    });
  }

  const search = (
    <SearchField
      label="Search"
      placeholder="Name, email or employee code"
      value={searchText}
      // replace: typing shouldn't add a browser-history entry per keystroke.
      onChange={(value) => onChange({ search: value }, { replace: true })}
    />
  );

  const dropdowns = (
    <>
      <SelectField
        label="Country"
        emptyOptionLabel="All countries"
        value={query.country ?? ''}
        options={toCountryOptions(filterOptions?.countries)}
        onChange={(event) => onChange({ country: event.target.value || undefined })}
      />
      <SelectField
        label="Department"
        emptyOptionLabel="All departments"
        value={query.department ?? ''}
        options={toOptions(filterOptions?.departments)}
        onChange={(event) => onChange({ department: event.target.value || undefined })}
      />
      <SelectField
        label="Job title"
        emptyOptionLabel="All job titles"
        value={query.jobTitle ?? ''}
        options={toOptions(filterOptions?.jobTitles)}
        onChange={(event) => onChange({ jobTitle: event.target.value || undefined })}
      />
    </>
  );

  if (screenSize === 'phone') {
    return (
      <Stack role="search" aria-label="Filter employees">
        <PhoneRow>
          {search}
          <Button
            onClick={filtersPanel.show}
            aria-label={
              activeFilters.length > 0 ? `Filters, ${activeFilters.length} active` : 'Filters'
            }
          >
            <FilterIcon />
            Filters
            {activeFilters.length > 0 && <Count aria-hidden>{activeFilters.length}</Count>}
          </Button>
        </PhoneRow>
        <ActiveFilters filters={activeFilters} onClearAll={onClear} />

        {filtersPanel.isShown && (
          <Dialog
            {...filtersPanel.visibility}
            title="Filters"
            footer={
              <>
                <Button onClick={onClear} disabled={activeFilters.length === 0}>
                  Clear all
                </Button>
                {/* Filters apply as they change; this just closes the panel. */}
                <Button variant="primary" onClick={filtersPanel.visibility.onClose}>
                  Show results
                </Button>
              </>
            }
          >
            <PanelFields>{dropdowns}</PanelFields>
          </Dialog>
        )}
      </Stack>
    );
  }

  return (
    <Stack role="search" aria-label="Filter employees">
      <Bar>
        <SearchArea>{search}</SearchArea>
        {dropdowns}
        {screenSize === 'desktop' && (
          <ClearArea>
            <Button onClick={onClear} disabled={!hasFilters}>
              Clear filters
            </Button>
          </ClearArea>
        )}
      </Bar>
      {screenSize === 'tablet' && <ActiveFilters filters={activeFilters} onClearAll={onClear} />}
    </Stack>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PhoneRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};

  & > :first-child {
    flex: 1;
    min-width: 0;
  }
`;

const Count = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const PanelFields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Bar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 2fr 1fr 1fr 1fr auto;
    align-items: end;
  }
`;

const SearchArea = styled.div`
  grid-column: 1 / -1;

  ${({ theme }) => theme.media.desktop} {
    grid-column: auto;
  }
`;

const ClearArea = styled.div`
  display: flex;
  align-items: flex-end;

  & > button {
    width: 100%;
  }
`;
