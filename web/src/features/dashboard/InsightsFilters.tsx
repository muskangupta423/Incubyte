import { COUNTRY_CODES, countryName, isCountryCode, type InsightsFilter } from '@acme/shared';
import styled from 'styled-components';
import { ActiveFilters, type ActiveFilter } from '../../components/ActiveFilters';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { useScreenSize } from '../../hooks/useScreenSize';
import { useFilterOptions } from '../employees/use-employee-queries';

const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  value: code,
  label: countryName(code),
})).sort((a, b) => a.label.localeCompare(b.label));

interface InsightsFiltersProps {
  filters: InsightsFilter;
  hasFilters: boolean;
  onChange: (changes: Partial<InsightsFilter>) => void;
  onClear: () => void;
}

/** Desktop: a "Clear filters" button; phones and tablets: removable chips with "Clear all". */
export function InsightsFilters({ filters, hasFilters, onChange, onClear }: InsightsFiltersProps) {
  const isDesktop = useScreenSize() === 'desktop';
  // Departments come from the employee data, the same list as on the Employees page.
  const { data: filterOptions } = useFilterOptions();
  const departmentOptions = (filterOptions?.departments ?? []).map((value) => ({
    value,
    label: value,
  }));

  const activeFilters: ActiveFilter[] = [];
  if (filters.country) {
    activeFilters.push({
      name: 'Country',
      value: countryName(filters.country),
      onRemove: () => onChange({ country: undefined }),
    });
  }
  if (filters.department) {
    activeFilters.push({
      name: 'Department',
      value: filters.department,
      onRemove: () => onChange({ department: undefined }),
    });
  }

  return (
    <Stack role="search" aria-label="Filter insights">
      <Bar>
        <SelectField
          label="Country"
          emptyOptionLabel="All countries"
          value={filters.country ?? ''}
          options={COUNTRY_OPTIONS}
          onChange={(event) => {
            const country = event.target.value;
            onChange({ country: isCountryCode(country) ? country : undefined });
          }}
        />
        <SelectField
          label="Department"
          emptyOptionLabel="All departments"
          value={filters.department ?? ''}
          options={departmentOptions}
          onChange={(event) => onChange({ department: event.target.value || undefined })}
        />
        {isDesktop && (
          <ClearArea>
            <Button onClick={onClear} disabled={!hasFilters}>
              Clear filters
            </Button>
          </ClearArea>
        )}
      </Bar>
      {!isDesktop && <ActiveFilters filters={activeFilters} onClearAll={onClear} />}
    </Stack>
  );
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Bar = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr 1fr;
  }

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 16rem 16rem auto;
    align-items: end;
  }
`;

const ClearArea = styled.div`
  & > button {
    width: 100%;
  }
`;
