import { employeeListQuerySchema, type EmployeeListQuery } from '@acme/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { parseSearchParams } from '../../utils/search-params';

/**
 * The employee list's search, filters, sort and page live in the URL (?country=IN&page=2…):
 * shareable links, refresh-safe, and the back button works. The URL is the single source of truth.
 */

const DEFAULT_QUERY = employeeListQuerySchema.parse({});

// Fixed order keeps URLs stable and readable.
const URL_FIELDS = [
  'search',
  'country',
  'department',
  'jobTitle',
  'sortBy',
  'sortOrder',
  'page',
  'pageSize',
] as const satisfies readonly (keyof EmployeeListQuery)[];

export function parseListParams(searchParams: URLSearchParams): EmployeeListQuery {
  return parseSearchParams(employeeListQuerySchema, searchParams);
}

/** Writes only values that differ from the defaults, so the plain list has a clean URL. */
export function toListSearchParams(query: EmployeeListQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const field of URL_FIELDS) {
    const value = query[field];
    if (value !== undefined && value !== '' && value !== DEFAULT_QUERY[field]) {
      params.set(field, String(value));
    }
  }
  return params;
}

export function useEmployeeListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseListParams(searchParams), [searchParams]);

  function updateQuery(changes: Partial<EmployeeListQuery>, options: { replace?: boolean } = {}) {
    // Any change other than paging starts again at page 1, so the user never lands on an empty page.
    const nextQuery = { ...query, page: 1, ...changes };
    setSearchParams(toListSearchParams(nextQuery), { replace: options.replace ?? false });
  }

  function clearFilters() {
    updateQuery({
      search: undefined,
      country: undefined,
      department: undefined,
      jobTitle: undefined,
    });
  }

  return {
    query,
    /** Raw text for the search box. `query.search` is trimmed, which would eat spaces while typing. */
    searchText: searchParams.get('search') ?? '',
    hasFilters: Boolean(query.search || query.country || query.department || query.jobTitle),
    updateQuery,
    clearFilters,
  };
}
