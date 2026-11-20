import {
  countryName,
  type CountryInsight,
  type DepartmentInsight,
  type SalaryBand,
} from '@acme/shared';
import { formatCompactUsd, formatMoney, formatNumber, formatPercent } from '../../utils/format';

/**
 * One plain-language sentence per chart, so the HR manager gets the answer without reading the axes.
 * Pure functions: easy to test, no React involved.
 */

export function salaryBandLabel(band: SalaryBand): string {
  return band.maxUsd === null
    ? `${formatCompactUsd(band.minUsd)}+`
    : `${formatCompactUsd(band.minUsd)}–${formatCompactUsd(band.maxUsd)}`;
}

export function countryTakeaway(countries: readonly CountryInsight[]): string | null {
  const byMedian = [...countries].sort((a, b) => b.usd.median - a.usd.median);
  const highest = byMedian[0];
  const lowest = byMedian.at(-1);
  if (!highest || !lowest) return null;

  if (highest === lowest) {
    const local = highest.local
      ? ` (${formatMoney(highest.local.median, highest.local.currency)})`
      : '';
    return `Typical pay in ${countryName(highest.country)} is ${formatMoney(highest.usd.median, 'USD')}${local}.`;
  }
  return (
    `Typical pay is highest in ${countryName(highest.country)} (${formatMoney(highest.usd.median, 'USD')}) ` +
    `and lowest in ${countryName(lowest.country)} (${formatMoney(lowest.usd.median, 'USD')}).`
  );
}

export function distributionTakeaway(bands: readonly SalaryBand[]): string | null {
  const total = bands.reduce((sum, band) => sum + band.headcount, 0);
  const largest = [...bands].sort((a, b) => b.headcount - a.headcount)[0];
  if (!largest || total === 0) return null;

  return (
    `The most common salary range is ${salaryBandLabel(largest)}: ` +
    `${formatNumber(largest.headcount)} employees (${formatPercent(largest.headcount / total)}).`
  );
}

export function departmentTakeaway(departments: readonly DepartmentInsight[]): string | null {
  const totalPayroll = departments.reduce((sum, row) => sum + row.totalPayrollUsd, 0);
  const totalHeadcount = departments.reduce((sum, row) => sum + row.headcount, 0);
  const largest = [...departments].sort((a, b) => b.totalPayrollUsd - a.totalPayrollUsd)[0];
  if (!largest || totalPayroll === 0) return null;

  return (
    `${largest.department} accounts for ${formatPercent(largest.totalPayrollUsd / totalPayroll)} of payroll ` +
    `and ${formatPercent(largest.headcount / totalHeadcount)} of employees.`
  );
}
