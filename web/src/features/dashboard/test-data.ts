import type {
  CountryInsight,
  DepartmentInsight,
  GroupSalaryStats,
  InsightsSummary,
  JobTitleInsight,
  SalaryBand,
} from '@acme/shared';
import { http, HttpResponse, type JsonBodyType } from 'msw';

function stats(
  median: number,
  headcount: number,
  totalPayrollUsd: number,
  local: GroupSalaryStats['local'] = null,
) {
  return {
    headcount,
    totalPayrollUsd,
    usd: { min: median / 2, median, average: median + 1_000, max: median * 2 },
    local,
  };
}

const inr = (median: number) => ({
  currency: 'INR',
  min: median / 2,
  median,
  average: median + 10_000,
  max: median * 2,
});

/** Figures for "all employees" and for ?country=IN, so tests can check that filters change the page. */
export const insightsFixtures = {
  all: {
    summary: {
      exchangeRatesAsOf: '2026-11-01',
      stats: stats(63_800, 10_000, 713_820_637),
    } satisfies InsightsSummary,
    byCountry: [
      { country: 'US', ...stats(102_000, 2_975, 300_000_000) },
      { country: 'IN', ...stats(28_534, 2_531, 72_000_000, inr(2_503_000)) },
    ] satisfies CountryInsight[],
    byDepartment: [
      { department: 'Engineering', ...stats(80_000, 4_000, 400_000_000) },
      { department: 'Sales', ...stats(60_000, 6_000, 100_000_000) },
    ] satisfies DepartmentInsight[],
    byJobTitle: [
      { jobTitle: 'Software Engineer', ...stats(70_000, 1_800, 126_000_000) },
      { jobTitle: 'Engineering Manager', ...stats(120_000, 300, 36_000_000) },
    ] satisfies JobTitleInsight[],
    distribution: [
      { minUsd: 0, maxUsd: 25_000, headcount: 1_000 },
      { minUsd: 25_000, maxUsd: 50_000, headcount: 6_000 },
      { minUsd: 250_000, maxUsd: null, headcount: 3_000 },
    ] satisfies SalaryBand[],
  },
  india: {
    summary: {
      exchangeRatesAsOf: '2026-11-01',
      stats: stats(28_534, 2_531, 72_000_000, inr(2_503_000)),
    } satisfies InsightsSummary,
    byJobTitle: [
      { jobTitle: 'Software Engineer', ...stats(27_000, 450, 12_000_000, inr(2_400_000)) },
    ] satisfies JobTitleInsight[],
  },
};

/** Fake /api/insights/* that answers with the India figures when ?country=IN, and records every request. */
export function insightsApiHandlers() {
  const requests: URL[] = [];
  const respond =
    (pick: (country: string | null) => JsonBodyType) =>
    ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      requests.push(url);
      return HttpResponse.json(pick(url.searchParams.get('country')));
    };
  const { all, india } = insightsFixtures;

  const handlers = [
    http.get(
      '*/api/insights/summary',
      respond((country) => (country === 'IN' ? india.summary : all.summary)),
    ),
    http.get(
      '*/api/insights/by-country',
      respond(() => all.byCountry),
    ),
    http.get(
      '*/api/insights/by-department',
      respond(() => all.byDepartment),
    ),
    http.get(
      '*/api/insights/by-job-title',
      respond((country) => (country === 'IN' ? india.byJobTitle : all.byJobTitle)),
    ),
    http.get(
      '*/api/insights/distribution',
      respond(() => all.distribution),
    ),
  ];
  return { handlers, requests };
}
