import styled from 'styled-components';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { QueryContent } from '../../components/QueryContent';
import { useInsightsFilters } from './insights-filter-params';
import { InsightsFilters } from './InsightsFilters';
import { JobTitlePaySection } from './JobTitlePaySection';
import {
  PayByCountrySection,
  PayrollByDepartmentSection,
  SalaryDistributionSection,
} from './sections';
import { SummaryCards } from './SummaryCards';
import { useInsightsSummary } from './use-insights';

export function InsightsPage() {
  const { filters, hasFilters, updateFilters, clearFilters } = useInsightsFilters();
  const summary = useInsightsSummary(filters);

  return (
    <>
      <PageHeader
        title="Insights"
        description="How ACME pays people across countries, departments and roles."
      />
      <InsightsFilters
        filters={filters}
        hasFilters={hasFilters}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      <QueryContent
        query={summary}
        loadingLabel="Loading insights…"
        errorTitle="Couldn't load insights"
      >
        {({ stats, exchangeRatesAsOf }) =>
          stats ? (
            // Each section loads independently: one slow or failed chart doesn't block the others.
            <Layout aria-busy={summary.isPlaceholderData}>
              <SummaryCards stats={stats} exchangeRatesAsOf={exchangeRatesAsOf} />
              <TwoColumns>
                <PayByCountrySection filters={filters} />
                <SalaryDistributionSection filters={filters} />
              </TwoColumns>
              <PayrollByDepartmentSection filters={filters} />
              <JobTitlePaySection filters={filters} />
            </Layout>
          ) : (
            <EmptyState
              title="No employees match these filters"
              message="Choose a different country or department."
              action={<Button onClick={clearFilters}>Clear filters</Button>}
            />
          )
        }
      </QueryContent>
    </>
  );
}

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 1fr 1fr;
  }
`;
