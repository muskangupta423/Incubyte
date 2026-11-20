import { z } from 'zod';
import { countryCodeSchema } from './countries';
import { optionalFilter } from './schema-helpers';

/**
 * Optional filters accepted by every /api/insights endpoint, so all dashboard numbers
 * always describe the same set of employees.
 */
export const insightsFilterSchema = z.object({
  country: optionalFilter(countryCodeSchema),
  department: optionalFilter(z.string().trim()),
});

export type InsightsFilter = z.infer<typeof insightsFilterSchema>;

/** Whole-unit salary statistics for a group of employees. */
export interface SalaryStats {
  min: number;
  median: number;
  average: number;
  max: number;
}

export interface LocalSalaryStats extends SalaryStats {
  currency: string;
}

export interface GroupSalaryStats {
  headcount: number;
  totalPayrollUsd: number;
  usd: SalaryStats;
  /** Only present when everyone in the group is paid in the same currency; otherwise null. */
  local: LocalSalaryStats | null;
}

export interface InsightsSummary {
  /** null when no employees match the filters. */
  stats: GroupSalaryStats | null;
  /** Date of the exchange-rate snapshot used for USD figures. */
  exchangeRatesAsOf: string | null;
}

export type CountryInsight = GroupSalaryStats & { country: string };
export type DepartmentInsight = GroupSalaryStats & { department: string };
export type JobTitleInsight = GroupSalaryStats & { jobTitle: string };

/** Salary distribution uses fixed USD bands: 0–25k, 25–50k, … and a final open-ended band. */
export const SALARY_BAND_WIDTH_USD = 25_000;
export const SALARY_BAND_COUNT = 11;

export interface SalaryBand {
  minUsd: number;
  /** null for the last, open-ended band ("250k and above"). */
  maxUsd: number | null;
  headcount: number;
}
