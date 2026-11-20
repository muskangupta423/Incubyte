import { COUNTRY_CODES, countryName, isCountryCode, type EmployeeListQuery } from '@acme/shared';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { SearchField } from '../../components/SearchField';
import { SelectField } from '../../components/SelectField';
import { useFilterOptions } from './use-employee-queries';

const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  value: code,
  label: countryName(code),
})).sort((a, b) => a.label.localeCompare(b.label));

type FilterChanges = Pick<EmployeeListQuery, 'search' | 'country' | 'department' | 'jobTitle'>;

interface EmployeeFiltersProps {
  searchText: string;
  query: EmployeeListQuery;
  hasFilters: boolean;
  onChange: (changes: Partial<FilterChanges>, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

const toOptions = (values: string[] = []) => values.map((value) => ({ value, label: value }));

export function EmployeeFilters({
  searchText,
  query,
  hasFilters,
  onChange,
  onClear,
}: EmployeeFiltersProps) {
  const { data: filterOptions } = useFilterOptions();

  return (
    <Bar role="search" aria-label="Filter employees">
      <SearchArea>
        <SearchField
          label="Search"
          placeholder="Name, email or employee code"
          value={searchText}
          // replace: typing shouldn't add a browser-history entry per keystroke.
          onChange={(search) => onChange({ search }, { replace: true })}
        />
      </SearchArea>
      <SelectField
        label="Country"
        emptyOptionLabel="All countries"
        value={query.country ?? ''}
        options={COUNTRY_OPTIONS}
        onChange={(event) => {
          const country = event.target.value;
          onChange({ country: isCountryCode(country) ? country : undefined });
        }}
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
    grid-template-columns: 1fr 1fr;
  }

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 2fr 1fr 1fr 1fr auto;
    align-items: end;
  }
`;

const SearchArea = styled.div`
  ${({ theme }) => theme.media.tablet} {
    grid-column: 1 / -1;
  }

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
