import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAppWith, createEmployeeFactory } from '../employees/test-fixtures';

/**
 * Five employees, chosen so every expected number can be checked by hand.
 * Seed exchange rates: 1 USD = 1 USD, 1 INR = 0.0114 USD.
 *
 *   #  country  department   job title          salary           in USD
 *   1  US       Engineering  Software Engineer  100,000 USD      100,000
 *   2  US       Engineering  Software Engineer  200,000 USD      200,000
 *   3  US       Sales        Account Executive  300,000 USD      300,000
 *   4  IN       Engineering  Software Engineer  1,000,000 INR     11,400
 *   5  IN       Engineering  Software Engineer  3,000,000 INR     34,200
 */
async function appWithTeam() {
  const employee = createEmployeeFactory();
  const indian = { country: 'IN', currency: 'INR' };
  const { app } = await createAppWith([
    employee({ annual_salary: 100_000 }),
    employee({ annual_salary: 200_000 }),
    employee({ annual_salary: 300_000, department: 'Sales', job_title: 'Account Executive' }),
    employee({ ...indian, annual_salary: 1_000_000 }),
    employee({ ...indian, annual_salary: 3_000_000 }),
  ]);
  return app;
}

describe('GET /api/insights/summary', () => {
  it('summarises pay across the whole organisation in USD', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/summary');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      exchangeRatesAsOf: '2026-11-01',
      stats: {
        headcount: 5,
        totalPayrollUsd: 645_600, // 100k + 200k + 300k + 11.4k + 34.2k
        // Sorted: 11,400 · 34,200 · 100,000 · 200,000 · 300,000 → the middle one is the median.
        usd: { min: 11_400, median: 100_000, average: 129_120, max: 300_000 },
        local: null, // two currencies, so no single local figure makes sense
      },
    });
  });

  it('shows local-currency figures when filtered to one country', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/summary?country=in');

    expect(response.body.stats).toMatchObject({
      headcount: 2,
      local: {
        currency: 'INR',
        min: 1_000_000,
        median: 2_000_000,
        average: 2_000_000,
        max: 3_000_000,
      },
    });
  });

  it('applies the department filter', async () => {
    const response = await request(await appWithTeam()).get(
      '/api/insights/summary?department=Sales',
    );

    expect(response.body.stats).toMatchObject({ headcount: 1, totalPayrollUsd: 300_000 });
  });

  it('returns no stats, without failing, when nobody matches', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).get('/api/insights/summary');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ stats: null, exchangeRatesAsOf: '2026-11-01' });
  });

  it('rejects an unsupported country filter', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/summary?country=FR');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('country');
  });
});

describe('GET /api/insights/by-country', () => {
  it('gives each country its stats in local currency and in USD', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/by-country');

    expect(response.body).toEqual([
      {
        country: 'IN',
        headcount: 2,
        totalPayrollUsd: 45_600,
        // Even number of people → median is the average of the two middle salaries.
        usd: { min: 11_400, median: 22_800, average: 22_800, max: 34_200 },
        local: {
          currency: 'INR',
          min: 1_000_000,
          median: 2_000_000,
          average: 2_000_000,
          max: 3_000_000,
        },
      },
      {
        country: 'US',
        headcount: 3,
        totalPayrollUsd: 600_000,
        usd: { min: 100_000, median: 200_000, average: 200_000, max: 300_000 },
        local: { currency: 'USD', min: 100_000, median: 200_000, average: 200_000, max: 300_000 },
      },
    ]);
  });
});

describe('GET /api/insights/by-department', () => {
  it('gives headcount, payroll and USD stats per department', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/by-department');

    expect(response.body).toEqual([
      {
        department: 'Engineering',
        headcount: 4,
        totalPayrollUsd: 345_600,
        // Sorted: 11,400 · 34,200 · 100,000 · 200,000 → median = (34,200 + 100,000) / 2
        usd: { min: 11_400, median: 67_100, average: 86_400, max: 200_000 },
        local: null,
      },
      {
        department: 'Sales',
        headcount: 1,
        totalPayrollUsd: 300_000,
        usd: { min: 300_000, median: 300_000, average: 300_000, max: 300_000 },
        local: { currency: 'USD', min: 300_000, median: 300_000, average: 300_000, max: 300_000 },
      },
    ]);
  });
});

describe('GET /api/insights/by-job-title', () => {
  it('answers "what do we pay this role in this country" in local currency', async () => {
    const response = await request(await appWithTeam()).get(
      '/api/insights/by-job-title?country=IN',
    );

    expect(response.body).toEqual([
      {
        jobTitle: 'Software Engineer',
        headcount: 2,
        totalPayrollUsd: 45_600,
        usd: { min: 11_400, median: 22_800, average: 22_800, max: 34_200 },
        local: {
          currency: 'INR',
          min: 1_000_000,
          median: 2_000_000,
          average: 2_000_000,
          max: 3_000_000,
        },
      },
    ]);
  });

  it('compares each role across all countries in USD', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/by-job-title');

    expect(
      response.body.map((row: { jobTitle: string; headcount: number }) => [
        row.jobTitle,
        row.headcount,
      ]),
    ).toEqual([
      ['Account Executive', 1],
      ['Software Engineer', 4],
    ]);
  });
});

describe('GET /api/insights/distribution', () => {
  it('counts employees per $25k band, listing empty bands and capping the top band', async () => {
    const response = await request(await appWithTeam()).get('/api/insights/distribution');

    expect(response.body).toHaveLength(11);
    expect(response.body[0]).toEqual({ minUsd: 0, maxUsd: 25_000, headcount: 1 }); // 11,400
    expect(response.body[1]).toEqual({ minUsd: 25_000, maxUsd: 50_000, headcount: 1 }); // 34,200
    expect(response.body[2]).toEqual({ minUsd: 50_000, maxUsd: 75_000, headcount: 0 });
    expect(response.body[4]).toMatchObject({ minUsd: 100_000, headcount: 1 }); // exactly 100,000 → lower bound is inclusive
    expect(response.body[8]).toMatchObject({ minUsd: 200_000, headcount: 1 });
    expect(response.body[10]).toEqual({ minUsd: 250_000, maxUsd: null, headcount: 1 }); // 300,000 → "250k+"
  });

  it('applies the filters', async () => {
    const response = await request(await appWithTeam()).get(
      '/api/insights/distribution?country=IN',
    );

    const total = response.body.reduce(
      (sum: number, band: { headcount: number }) => sum + band.headcount,
      0,
    );
    expect(total).toBe(2);
  });
});
