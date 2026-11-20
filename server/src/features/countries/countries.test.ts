import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAppWith, createEmployeeFactory } from '../employees/test-fixtures';

/** The seed sets up 8 countries (see reference-data.ts). */
async function seededApp() {
  return (await createAppWith([])).app;
}

const newHireIn = (country: string) => ({
  fullName: 'Wanjiru Kamau',
  email: 'wanjiru.kamau@acme.test',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country,
  annualSalary: 4_000_000,
  hireDate: '2026-11-02',
});

describe('GET /api/countries', () => {
  it('lists the countries that are set up, A→Z by name, with their currency', async () => {
    const response = await request(await seededApp()).get('/api/countries');

    expect(response.status).toBe(200);
    expect(response.body.map((country: { code: string }) => country.code)).toEqual([
      'AU',
      'BR',
      'CA',
      'DE',
      'IN',
      'SG',
      'GB',
      'US', // Australia … United Kingdom, United States
    ]);
    expect(response.body).toContainEqual({ code: 'IN', currency: 'INR' });
  });
});

describe('POST /api/countries', () => {
  it('adds a country with a new currency and its exchange rate, so employees can be added there', async () => {
    const app = await seededApp();

    const response = await request(app)
      .post('/api/countries')
      .send({ code: 'ke', usdRate: 0.0077 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ code: 'KE', currency: 'KES' });
    const hired = await request(app).post('/api/employees').send(newHireIn('KE'));
    expect(hired.status).toBe(201);
    expect(hired.body).toMatchObject({ currency: 'KES', annualSalaryUsd: 30_800 }); // 4,000,000 × 0.0077
  });

  it('reuses the existing rate when the currency is already used (and ignores any rate sent)', async () => {
    const employee = createEmployeeFactory();
    const { app } = await createAppWith([
      employee({ country: 'DE', currency: 'EUR', annual_salary: 100_000 }),
    ]);

    const response = await request(app).post('/api/countries').send({ code: 'FR', usdRate: 99 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ code: 'FR', currency: 'EUR' });
    // The German employee's USD salary is unchanged: the EUR rate was not overwritten.
    const germans = await request(app).get('/api/employees?country=DE');
    expect(germans.body.items[0].annualSalaryUsd).toBe(116_000); // 100,000 × 1.16 (seed rate)
  });

  it('asks for the exchange rate when the currency is new', async () => {
    const response = await request(await seededApp())
      .post('/api/countries')
      .send({ code: 'KE' });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'usdRate', message: 'Enter how many US dollars 1 KES is worth' },
    ]);
  });

  it('rejects a country that is already set up with 409', async () => {
    const response = await request(await seededApp())
      .post('/api/countries')
      .send({ code: 'IN', usdRate: 0.012 });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('India is already set up.');
  });

  it.each([
    [{ code: 'XX', usdRate: 1 }, 'code'],
    [{ code: 'KE', usdRate: -1 }, 'usdRate'],
  ])('rejects invalid input %j with a 400 naming the field', async (body, field) => {
    const response = await request(await seededApp())
      .post('/api/countries')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe(field);
  });
});
