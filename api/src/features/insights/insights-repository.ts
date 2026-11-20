import type { InsightsFilter } from '@acme/shared';
import type { Row } from '@libsql/client';
import type { Database } from '../../db/client';
import { buildEmployeeFilters } from '../employees/employee-filters';

/** Columns insights can be grouped by. A fixed whitelist: user input never becomes a column name. */
export type InsightsGrouping = 'country' | 'department' | 'job_title';

/** Raw numbers per group, straight from SQL (USD values are unrounded). */
export interface GroupStatsRow {
  groupKey: string;
  headcount: number;
  currencyCount: number;
  currency: string;
  totalUsd: number;
  usd: RawStats;
  local: RawStats;
}

interface RawStats {
  min: number;
  median: number;
  average: number;
  max: number;
}

/**
 * Headcount, payroll and min / median / average / max salary per group, all computed in the database,
 * so only one small row per group is returned (never the individual salaries).
 *
 * SQLite has no MEDIAN(), so it is computed with window functions:
 * each salary gets its position within its group (ROW_NUMBER) and the group size (COUNT OVER);
 * the median is the middle value, or the average of the two middle values for an even-sized group.
 * Local-currency stats reuse the same positions; they are only meaningful (and only used)
 * when the whole group shares one currency, in which case USD and local order are identical.
 *
 * Pass `null` to treat all matching employees as one group.
 */
export async function findSalaryStats(
  db: Database,
  grouping: InsightsGrouping | null,
  filters: InsightsFilter,
): Promise<GroupStatsRow[]> {
  const groupExpression = grouping ? `e.${grouping}` : `'all'`;
  const { whereSql, args } = buildEmployeeFilters(filters);
  const isMiddle = 'position IN ((group_size + 1) / 2, (group_size + 2) / 2)';

  const result = await db.execute({
    sql: `
      WITH salaries AS (
        SELECT ${groupExpression} AS group_key,
               e.currency,
               e.annual_salary AS local_salary,
               e.annual_salary * r.usd_rate AS usd_salary
        FROM employees e
        JOIN exchange_rates r ON r.currency = e.currency
        ${whereSql}
      ),
      ranked AS (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY group_key ORDER BY usd_salary) AS position,
               COUNT(*) OVER (PARTITION BY group_key) AS group_size
        FROM salaries
      )
      SELECT group_key,
             COUNT(*)                 AS headcount,
             COUNT(DISTINCT currency) AS currency_count,
             MIN(currency)            AS currency,
             SUM(usd_salary)          AS total_usd,
             MIN(usd_salary)          AS min_usd,
             AVG(CASE WHEN ${isMiddle} THEN usd_salary END) AS median_usd,
             AVG(usd_salary)          AS average_usd,
             MAX(usd_salary)          AS max_usd,
             MIN(local_salary)        AS min_local,
             AVG(CASE WHEN ${isMiddle} THEN local_salary END) AS median_local,
             AVG(local_salary)        AS average_local,
             MAX(local_salary)        AS max_local
      FROM ranked
      GROUP BY group_key
      ORDER BY group_key`,
    args,
  });

  return result.rows.map(toGroupStatsRow);
}

/** Headcount per USD salary band. Band index = floor(salary / width), capped at the last band. */
export async function countBySalaryBand(
  db: Database,
  filters: InsightsFilter,
  bandWidthUsd: number,
  lastBandIndex: number,
): Promise<Map<number, number>> {
  const { whereSql, args } = buildEmployeeFilters(filters);
  const result = await db.execute({
    sql: `
      SELECT MIN(CAST(e.annual_salary * r.usd_rate / ? AS INTEGER), ?) AS band,
             COUNT(*) AS headcount
      FROM employees e
      JOIN exchange_rates r ON r.currency = e.currency
      ${whereSql}
      GROUP BY band`,
    args: [bandWidthUsd, lastBandIndex, ...args],
  });

  return new Map(result.rows.map((row) => [Number(row.band), Number(row.headcount)]));
}

/** Date of the exchange-rate snapshot (all rates share one date in this version). */
export async function findExchangeRatesAsOf(db: Database): Promise<string | null> {
  const result = await db.execute('SELECT MAX(as_of_date) AS as_of FROM exchange_rates');
  const asOf = result.rows[0]?.as_of;
  return typeof asOf === 'string' ? asOf : null;
}

function toGroupStatsRow(row: Row): GroupStatsRow {
  return {
    groupKey: String(row.group_key),
    headcount: Number(row.headcount),
    currencyCount: Number(row.currency_count),
    currency: String(row.currency),
    totalUsd: Number(row.total_usd),
    usd: {
      min: Number(row.min_usd),
      median: Number(row.median_usd),
      average: Number(row.average_usd),
      max: Number(row.max_usd),
    },
    local: {
      min: Number(row.min_local),
      median: Number(row.median_local),
      average: Number(row.average_local),
      max: Number(row.max_local),
    },
  };
}
