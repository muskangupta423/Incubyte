import type { GroupSalaryStats } from '@acme/shared';
import styled from 'styled-components';
import { StatCard } from '../../components/StatCard';
import { formatCompactUsd, formatDate, formatMoney, formatNumber } from '../../utils/format';

interface SummaryCardsProps {
  stats: GroupSalaryStats;
  exchangeRatesAsOf: string | null;
}

export function SummaryCards({ stats, exchangeRatesAsOf }: SummaryCardsProps) {
  const { local } = stats;

  return (
    <div>
      <Grid>
        <StatCard label="Employees" value={formatNumber(stats.headcount)} />
        <StatCard
          label="Total annual payroll"
          value={formatCompactUsd(stats.totalPayrollUsd)}
          detail={formatMoney(stats.totalPayrollUsd, 'USD')}
        />
        <StatCard
          label="Median salary"
          value={formatMoney(stats.usd.median, 'USD')}
          detail={
            local ? formatMoney(local.median, local.currency) : 'Half earn more, half earn less'
          }
        />
        <StatCard
          label="Average salary"
          value={formatMoney(stats.usd.average, 'USD')}
          detail={local ? formatMoney(local.average, local.currency) : 'Pulled up by high earners'}
        />
      </Grid>
      {exchangeRatesAsOf && (
        <Note>USD figures use exchange rates as of {formatDate(exchangeRatesAsOf)}.</Note>
      )}
    </div>
  );
}

const Grid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin: 0;

  ${({ theme }) => theme.media.desktop} {
    grid-template-columns: repeat(4, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const Note = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
