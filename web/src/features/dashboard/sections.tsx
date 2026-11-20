import { countryName, type InsightsFilter } from '@acme/shared';
import { BarChart } from '../../components/charts/BarChart';
import { QueryContent } from '../../components/QueryContent';
import { formatCompactUsd, formatMoney, formatNumber, formatPercent } from '../../utils/format';
import {
  countryTakeaway,
  departmentTakeaway,
  distributionTakeaway,
  salaryBandLabel,
} from './insight-takeaways';
import { InsightSection } from './InsightSection';
import { usePayByCountry, usePayrollByDepartment, useSalaryDistribution } from './use-insights';

const formatUsd = (value: number) => formatMoney(value, 'USD');

export function PayByCountrySection({ filters }: { filters: InsightsFilter }) {
  const query = usePayByCountry(filters);

  return (
    <QueryContent
      query={query}
      loadingLabel="Loading pay by country…"
      errorTitle="Couldn't load pay by country"
    >
      {(countries) => (
        <InsightSection
          title="Typical pay by country (median, USD)"
          takeaway={countryTakeaway(countries)}
        >
          <BarChart
            data={[...countries]
              .sort((a, b) => b.usd.median - a.usd.median)
              .map((row) => ({ label: countryName(row.country), value: row.usd.median }))}
            formatValue={formatUsd}
            formatTick={formatCompactUsd}
          />
        </InsightSection>
      )}
    </QueryContent>
  );
}

export function SalaryDistributionSection({ filters }: { filters: InsightsFilter }) {
  const query = useSalaryDistribution(filters);

  return (
    <QueryContent
      query={query}
      loadingLabel="Loading salary distribution…"
      errorTitle="Couldn't load the salary distribution"
    >
      {(bands) => (
        <InsightSection title="Salary distribution (USD)" takeaway={distributionTakeaway(bands)}>
          <BarChart
            data={bands.map((band) => ({ label: salaryBandLabel(band), value: band.headcount }))}
            formatValue={(count) => `${formatNumber(count)} employees`}
            formatTick={formatNumber}
          />
        </InsightSection>
      )}
    </QueryContent>
  );
}

export function PayrollByDepartmentSection({ filters }: { filters: InsightsFilter }) {
  const query = usePayrollByDepartment(filters);

  return (
    <QueryContent
      query={query}
      loadingLabel="Loading payroll by department…"
      errorTitle="Couldn't load payroll by department"
    >
      {(departments) => {
        const totalPayroll = departments.reduce((sum, row) => sum + row.totalPayrollUsd, 0);
        return (
          <InsightSection
            title="Share of payroll by department"
            takeaway={departmentTakeaway(departments)}
          >
            <BarChart
              data={[...departments]
                .sort((a, b) => b.totalPayrollUsd - a.totalPayrollUsd)
                .map((row) => ({
                  label: row.department,
                  value: row.totalPayrollUsd / totalPayroll,
                }))}
              formatValue={formatPercent}
              formatTick={formatPercent}
            />
          </InsightSection>
        );
      }}
    </QueryContent>
  );
}
