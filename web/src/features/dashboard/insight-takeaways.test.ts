import type { CountryInsight, DepartmentInsight, GroupSalaryStats } from '@acme/shared';
import { describe, expect, it } from 'vitest';
import {
  countryTakeaway,
  departmentTakeaway,
  distributionTakeaway,
  salaryBandLabel,
} from './insight-takeaways';

function stats(medianUsd: number, headcount = 1, totalPayrollUsd = medianUsd): GroupSalaryStats {
  const usd = { min: medianUsd, median: medianUsd, average: medianUsd, max: medianUsd };
  return { headcount, totalPayrollUsd, usd, local: null };
}

describe('countryTakeaway', () => {
  it('names the highest- and lowest-paying countries by median', () => {
    const countries: CountryInsight[] = [
      { country: 'IN', ...stats(28_534) },
      { country: 'US', ...stats(102_000) },
      { country: 'GB', ...stats(77_140) },
    ];

    expect(countryTakeaway(countries)).toBe(
      'Median pay is highest in United States ($102,000) and lowest in India ($28,534).',
    );
  });

  it('describes a single country, including its local currency', () => {
    const india: CountryInsight = {
      country: 'IN',
      ...stats(28_534),
      local: { currency: 'INR', min: 1, median: 2_503_000, average: 1, max: 1 },
    };

    expect(countryTakeaway([india])).toBe('Median pay in India is $28,534 (₹2,503,000).');
  });

  it('has nothing to say without data', () => {
    expect(countryTakeaway([])).toBeNull();
  });
});

describe('distributionTakeaway', () => {
  it('names the most common band with its share', () => {
    const bands = [
      { minUsd: 0, maxUsd: 25_000, headcount: 1 },
      { minUsd: 25_000, maxUsd: 50_000, headcount: 3 },
      { minUsd: 250_000, maxUsd: null, headcount: 0 },
    ];

    expect(distributionTakeaway(bands)).toBe(
      'The most common salary range is $25K–$50K: 3 employees (75%).',
    );
  });

  it('labels the open-ended top band', () => {
    expect(salaryBandLabel({ minUsd: 250_000, maxUsd: null, headcount: 0 })).toBe('$250K+');
  });
});

describe('departmentTakeaway', () => {
  it("compares the biggest department's share of payroll and of headcount", () => {
    const departments: DepartmentInsight[] = [
      { department: 'Engineering', ...stats(100_000, 2, 300_000) },
      { department: 'Sales', ...stats(50_000, 2, 100_000) },
    ];

    expect(departmentTakeaway(departments)).toBe(
      'Engineering accounts for 75% of payroll and 50% of employees.',
    );
  });
});
