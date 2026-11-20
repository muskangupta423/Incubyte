import type { InsightsFilter } from '@acme/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchByCountry,
  fetchByDepartment,
  fetchByJobTitle,
  fetchDistribution,
  fetchSummary,
} from './insights-api';

const insightsKey = (section: string, filters: InsightsFilter) =>
  ['insights', section, filters] as const;

// keepPreviousData: when filters change, charts keep showing the old numbers until the new ones arrive.
const shared = { placeholderData: keepPreviousData };

export const useInsightsSummary = (filters: InsightsFilter) =>
  useQuery({
    queryKey: insightsKey('summary', filters),
    queryFn: ({ signal }) => fetchSummary(filters, signal),
    ...shared,
  });

export const usePayByCountry = (filters: InsightsFilter) =>
  useQuery({
    queryKey: insightsKey('by-country', filters),
    queryFn: ({ signal }) => fetchByCountry(filters, signal),
    ...shared,
  });

export const usePayrollByDepartment = (filters: InsightsFilter) =>
  useQuery({
    queryKey: insightsKey('by-department', filters),
    queryFn: ({ signal }) => fetchByDepartment(filters, signal),
    ...shared,
  });

export const usePayByJobTitle = (filters: InsightsFilter) =>
  useQuery({
    queryKey: insightsKey('by-job-title', filters),
    queryFn: ({ signal }) => fetchByJobTitle(filters, signal),
    ...shared,
  });

export const useSalaryDistribution = (filters: InsightsFilter) =>
  useQuery({
    queryKey: insightsKey('distribution', filters),
    queryFn: ({ signal }) => fetchDistribution(filters, signal),
    ...shared,
  });
