import {
  SALARY_BAND_COUNT,
  SALARY_BAND_WIDTH_USD,
  type CountryInsight,
  type DepartmentInsight,
  type GroupSalaryStats,
  type InsightsFilter,
  type InsightsSummary,
  type JobTitleInsight,
  type SalaryBand,
  type SalaryStats,
} from '@acme/shared';
import type { Database } from '../../db/client';
import {
  countBySalaryBand,
  findExchangeRatesAsOf,
  findSalaryStats,
  type GroupStatsRow,
} from './insights-repository';

export async function getSummary(db: Database, filters: InsightsFilter): Promise<InsightsSummary> {
  const [rows, exchangeRatesAsOf] = await Promise.all([
    findSalaryStats(db, null, filters),
    findExchangeRatesAsOf(db),
  ]);
  const [allEmployees] = rows;
  return { stats: allEmployees ? toGroupSalaryStats(allEmployees) : null, exchangeRatesAsOf };
}

export async function getByCountry(
  db: Database,
  filters: InsightsFilter,
): Promise<CountryInsight[]> {
  const rows = await findSalaryStats(db, 'country', filters);
  return rows.map((row) => ({ country: row.groupKey, ...toGroupSalaryStats(row) }));
}

export async function getByDepartment(
  db: Database,
  filters: InsightsFilter,
): Promise<DepartmentInsight[]> {
  const rows = await findSalaryStats(db, 'department', filters);
  return rows.map((row) => ({ department: row.groupKey, ...toGroupSalaryStats(row) }));
}

export async function getByJobTitle(
  db: Database,
  filters: InsightsFilter,
): Promise<JobTitleInsight[]> {
  const rows = await findSalaryStats(db, 'job_title', filters);
  return rows.map((row) => ({ jobTitle: row.groupKey, ...toGroupSalaryStats(row) }));
}

export async function getSalaryDistribution(
  db: Database,
  filters: InsightsFilter,
): Promise<SalaryBand[]> {
  const lastBandIndex = SALARY_BAND_COUNT - 1;
  const headcountByBand = await countBySalaryBand(
    db,
    filters,
    SALARY_BAND_WIDTH_USD,
    lastBandIndex,
  );
  return buildSalaryBands(headcountByBand, SALARY_BAND_WIDTH_USD, SALARY_BAND_COUNT);
}

/** Lists every band, including empty ones, so charts always show the full salary range. */
function buildSalaryBands(
  headcountByBand: ReadonlyMap<number, number>,
  bandWidth: number,
  bandCount: number,
): SalaryBand[] {
  return Array.from({ length: bandCount }, (_, index) => ({
    minUsd: index * bandWidth,
    maxUsd: index === bandCount - 1 ? null : (index + 1) * bandWidth,
    headcount: headcountByBand.get(index) ?? 0,
  }));
}

/** Rounds to whole units and only exposes local stats when the group shares a single currency. */
function toGroupSalaryStats(row: GroupStatsRow): GroupSalaryStats {
  return {
    headcount: row.headcount,
    totalPayrollUsd: Math.round(row.totalUsd),
    usd: roundStats(row.usd),
    local: row.currencyCount === 1 ? { currency: row.currency, ...roundStats(row.local) } : null,
  };
}

function roundStats(stats: SalaryStats): SalaryStats {
  return {
    min: Math.round(stats.min),
    median: Math.round(stats.median),
    average: Math.round(stats.average),
    max: Math.round(stats.max),
  };
}
