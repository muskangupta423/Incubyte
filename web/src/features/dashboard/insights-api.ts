import type {
  CountryInsight,
  DepartmentInsight,
  InsightsFilter,
  InsightsSummary,
  JobTitleInsight,
  SalaryBand,
} from '@acme/shared';
import { apiRequest } from '../../services/http-client';

function getInsight<T>(path: string, filters: InsightsFilter, signal?: AbortSignal): Promise<T> {
  return apiRequest<T>(`/insights/${path}`, { query: { ...filters }, signal });
}

export const fetchSummary = (filters: InsightsFilter, signal?: AbortSignal) =>
  getInsight<InsightsSummary>('summary', filters, signal);

export const fetchByCountry = (filters: InsightsFilter, signal?: AbortSignal) =>
  getInsight<CountryInsight[]>('by-country', filters, signal);

export const fetchByDepartment = (filters: InsightsFilter, signal?: AbortSignal) =>
  getInsight<DepartmentInsight[]>('by-department', filters, signal);

export const fetchByJobTitle = (filters: InsightsFilter, signal?: AbortSignal) =>
  getInsight<JobTitleInsight[]>('by-job-title', filters, signal);

export const fetchDistribution = (filters: InsightsFilter, signal?: AbortSignal) =>
  getInsight<SalaryBand[]>('distribution', filters, signal);
