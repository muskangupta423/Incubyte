import {
  employeeExportQuerySchema,
  employeeListQuerySchema,
  insightsFilterSchema,
} from '@acme/shared';
import { config } from '../config';
import { openDatabase } from '../db/client';
import {
  exportEmployees,
  getFilterOptions,
  listEmployees,
} from '../features/employees/employee-service';
import {
  getByCountry,
  getByDepartment,
  getByJobTitle,
  getSalaryDistribution,
  getSummary,
} from '../features/insights/insights-service';

/**
 * `npm run bench`: times the app's real queries (the same service functions the API calls, without
 * HTTP) against the configured database, and shows SQLite's query plan for the main filters.
 * Read-only: changes no data. Run `npm run seed` first for the 10,000-employee database.
 */
const RUNS = 30;
const WARM_UP_RUNS = 5;
const MIN_EMPLOYEES = 1_000;

const db = await openDatabase(config.database);
const employeeCount = Number((await db.execute('SELECT count(*) AS n FROM employees')).rows[0]?.n);
if (!(employeeCount >= MIN_EMPLOYEES)) {
  console.error(
    `Only ${employeeCount} employees in ${config.database.url}. Run "npm run seed" first.`,
  );
  process.exit(1);
}

const list = (query: object) => employeeListQuerySchema.parse(query);
const insights = (filters: object) => insightsFilterSchema.parse(filters);

const operations: [name: string, run: () => Promise<unknown>][] = [
  ['Employee list, page 1 (sorted by name)', () => listEmployees(db, list({}))],
  ['Employee list, last page (offset 9,975)', () => listEmployees(db, list({ page: 400 }))],
  [
    'Search "sharma" + country + salary sort',
    () =>
      listEmployees(
        db,
        list({ search: 'sharma', country: 'IN', sortBy: 'annualSalary', sortOrder: 'desc' }),
      ),
  ],
  ['Employee list sorted by code', () => listEmployees(db, list({ sortBy: 'employeeCode' }))],
  ['Filter options (countries, departments, titles)', () => getFilterOptions(db)],
  ['Insights summary (incl. median)', () => getSummary(db, insights({}))],
  ['Insights by country', () => getByCountry(db, insights({}))],
  ['Insights by job title, one country', () => getByJobTitle(db, insights({ country: 'IN' }))],
  ['Insights by department', () => getByDepartment(db, insights({}))],
  ['Salary distribution (11 bands)', () => getSalaryDistribution(db, insights({}))],
  ['Export everyone (no paging)', () => exportEmployees(db, employeeExportQuerySchema.parse({}))],
];

console.log(
  `\n${employeeCount.toLocaleString('en-US')} employees in ${config.database.url}; ${RUNS} runs each\n`,
);
console.log('| Operation | Median | Slowest |');
console.log('|-----------|--------|---------|');
for (const [name, run] of operations) {
  for (let i = 0; i < WARM_UP_RUNS; i += 1) await run();
  const times: number[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    const start = performance.now();
    await run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(`| ${name} | ${ms(times[Math.floor(RUNS / 2)])} | ${ms(times.at(-1))} |`);
}

/** How SQLite answers the main kinds of query: SEARCH … USING INDEX is good, SCAN reads every row. */
const plans: [name: string, sql: string][] = [
  ['Filter by country', "SELECT id FROM employees e WHERE e.country = 'IN'"],
  ['Filter by department', "SELECT id FROM employees e WHERE e.department = 'Sales'"],
  ['Filter by job title', "SELECT id FROM employees e WHERE e.job_title = 'Accountant'"],
  [
    'Sort by salary, first page',
    'SELECT id FROM employees e ORDER BY e.annual_salary DESC, e.id LIMIT 25',
  ],
  ['Sort by name, first page', 'SELECT id FROM employees e ORDER BY e.full_name, e.id LIMIT 25'],
  ['Search by text', "SELECT id FROM employees e WHERE e.full_name LIKE '%sharma%'"],
];
console.log('\nQuery plans\n');
for (const [name, sql] of plans) {
  const plan = await db.execute(`EXPLAIN QUERY PLAN ${sql}`);
  console.log(`- ${name}: ${plan.rows.map((row) => String(row.detail)).join(' → ')}`);
}

function ms(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1)} ms`;
}
