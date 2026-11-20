import { insightsFilterSchema, type InsightsFilter } from '@acme/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { parseSearchParams } from '../../utils/search-params';

/** Dashboard filters live in the URL (?country=IN&department=Sales), like the employee list's. */
export function useInsightsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseSearchParams(insightsFilterSchema, searchParams),
    [searchParams],
  );

  function updateFilters(changes: Partial<InsightsFilter>) {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams();
    if (next.country) params.set('country', next.country);
    if (next.department) params.set('department', next.department);
    setSearchParams(params);
  }

  return {
    filters,
    hasFilters: Boolean(filters.country || filters.department),
    updateFilters,
    clearFilters: () => setSearchParams(new URLSearchParams()),
  };
}
