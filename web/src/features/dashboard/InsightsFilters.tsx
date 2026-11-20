import { COUNTRY_CODES, countryName, isCountryCode, type InsightsFilter } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
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

export function InsightsFilters({ filters, hasFilters, onChange, onClear }: InsightsFiltersProps) {
  // Departments come from the employee data, the same list as on the Employees page.
  const { data: filterOptions } = useFilterOptions();
  const departmentOptions = (filterOptions?.departments ?? []).map((value) => ({
    value,
    label: value,
  }));

  return (
    <Bar role="search" aria-label="Filter insights">
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
      <ClearArea>
        <Button onClick={onClear} disabled={!hasFilters}>
          Clear filters
        </Button>
      </ClearArea>
    </Bar>
  );
}

const Bar = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr 1fr auto;
    align-items: end;
  }

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 16rem 16rem auto;
  }
`;

const ClearArea = styled.div`
  & > button {
    width: 100%;
  }
`;
