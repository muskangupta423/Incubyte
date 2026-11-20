import {
  countryName,
  type InsightsFilter,
  type JobTitleInsight,
  type SalaryStats,
} from '@acme/shared';
import styled from 'styled-components';
import { QueryContent } from '../../components/QueryContent';
import { formatMoney, formatNumber } from '../../utils/format';
import { InsightSection } from './InsightSection';
import { usePayByJobTitle } from './use-insights';

/**
 * "What do we pay this role?" — in the local currency when one country is selected
 * (that's how HR thinks about pay), otherwise in USD so countries can be compared.
 */
export function JobTitlePaySection({ filters }: { filters: InsightsFilter }) {
  const query = usePayByJobTitle(filters);

  return (
    <QueryContent
      query={query}
      loadingLabel="Loading pay by job title…"
      errorTitle="Couldn't load pay by job title"
    >
      {(rows) => {
        const localCurrency = filters.country ? rows[0]?.local?.currency : undefined;
        const currency = localCurrency ?? 'USD';
        const scope = filters.country
          ? `in ${countryName(filters.country)}`
          : 'across all countries';

        return (
          <InsightSection
            title="Pay by job title"
            takeaway={
              rows.length > 0 ? `In ${currency}, ${scope}. Highest typical pay first.` : null
            }
          >
            <ScrollArea tabIndex={0} aria-label="Pay by job title table">
              <Table>
                <thead>
                  <tr>
                    <th scope="col">Job title</th>
                    <NumberHeader scope="col">Employees</NumberHeader>
                    <NumberHeader scope="col">Min</NumberHeader>
                    <NumberHeader scope="col">Typical (median)</NumberHeader>
                    <NumberHeader scope="col">Average</NumberHeader>
                    <NumberHeader scope="col">Max</NumberHeader>
                  </tr>
                </thead>
                <tbody>
                  {sortByMedian(rows).map((row) => {
                    const stats: SalaryStats = localCurrency && row.local ? row.local : row.usd;
                    return (
                      <tr key={row.jobTitle}>
                        <th scope="row">{row.jobTitle}</th>
                        <NumberCell>{formatNumber(row.headcount)}</NumberCell>
                        <NumberCell>{formatMoney(stats.min, currency)}</NumberCell>
                        <NumberCell>
                          <strong>{formatMoney(stats.median, currency)}</strong>
                        </NumberCell>
                        <NumberCell>{formatMoney(stats.average, currency)}</NumberCell>
                        <NumberCell>{formatMoney(stats.max, currency)}</NumberCell>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </ScrollArea>
          </InsightSection>
        );
      }}
    </QueryContent>
  );
}

function sortByMedian(rows: readonly JobTitleInsight[]): JobTitleInsight[] {
  return [...rows].sort((a, b) => b.usd.median - a.usd.median);
}

/** Six number columns don't fit a phone: the table scrolls sideways inside its card instead of squashing. */
const ScrollArea = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 40rem;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
  }

  thead th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  tbody th {
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  tbody tr:last-child > * {
    border-bottom: none;
  }
`;

// "&&" doubles the class to outrank the table's generic "th, td { text-align: left }" rule.
const NumberHeader = styled.th`
  && {
    text-align: right;
  }
`;

const NumberCell = styled.td`
  && {
    text-align: right;
  }
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;
