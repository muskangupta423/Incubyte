import type { Employee } from '@acme/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppWith, createEmployeeFactory } from './test-fixtures';
import type { SeedEmployee } from '../../db/seed/generate-employees';

let employee: ReturnType<typeof createEmployeeFactory>;

async function appWith(employees: SeedEmployee[]) {
  return (await createAppWith(employees)).app;
}

function names(body: { items: Employee[] }): string[] {
  return body.items.map((item) => item.fullName);
}

describe('GET /api/employees', () => {
  beforeEach(() => {
    employee = createEmployeeFactory();
  });

  describe('pagination', () => {
    it('returns the first 25 employees and the totals by default', async () => {
      const app = await appWith(Array.from({ length: 30 }, () => employee()));

      const response = await request(app).get('/api/employees');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ page: 1, pageSize: 25, totalItems: 30, totalPages: 2 });
      expect(response.body.items).toHaveLength(25);
    });

    it('returns the requested page and page size', async () => {
      const app = await appWith(Array.from({ length: 30 }, () => employee()));

      const response = await request(app).get(
        '/api/employees?page=3&pageSize=10&sortBy=employeeCode',
      );

      expect(response.body).toMatchObject({ page: 3, pageSize: 10, totalItems: 30, totalPages: 3 });
      expect(response.body.items[0].employeeCode).toBe('EMP-00021');
    });

    it('returns no items, but the real totals, for a page past the end', async () => {
      const app = await appWith([employee(), employee()]);

      const response = await request(app).get('/api/employees?page=5');

      expect(response.body).toMatchObject({ items: [], totalItems: 2, totalPages: 1 });
    });

    it('returns an empty first page when nothing matches', async () => {
      const app = await appWith([employee()]);

      const response = await request(app).get('/api/employees?country=DE');

      expect(response.body).toMatchObject({ items: [], totalItems: 0, totalPages: 0 });
    });
  });

  it('returns each employee with the salary in local currency and in USD', async () => {
    const app = await appWith([
      employee({
        full_name: 'Priya Sharma',
        email: 'priya.sharma@acme.test',
        country: 'IN',
        currency: 'INR',
        annual_salary: 2_000_000,
        job_title: 'QA Engineer',
        hire_date: '2021-06-15',
      }),
    ]);

    const response = await request(app).get('/api/employees');

    expect(response.body.items[0]).toEqual({
      id: 1,
      employeeCode: 'EMP-00001',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@acme.test',
      jobTitle: 'QA Engineer',
      department: 'Engineering',
      country: 'IN',
      currency: 'INR',
      annualSalary: 2_000_000,
      annualSalaryUsd: 22_800, // 2,000,000 × 0.0114 (seed exchange rate)
      hireDate: '2021-06-15',
    });
  });

  describe('search', () => {
    it.each([
      ['part of a name, in any letter case', 'SHAR'],
      ['part of an email', 'priya.s'],
      ['an employee code', 'EMP-00002'],
    ])('finds employees by %s', async (_description, search) => {
      const app = await appWith([
        employee({ full_name: 'Asha Rao', email: 'asha.rao@acme.test' }),
        employee({ full_name: 'Priya Sharma', email: 'priya.sharma@acme.test' }),
      ]);

      const response = await request(app).get('/api/employees').query({ search });

      expect(names(response.body)).toEqual(['Priya Sharma']);
    });

    it('treats % and _ as normal characters, not wildcards', async () => {
      const app = await appWith([
        employee({ full_name: 'Ann_Lee', email: 'ann_lee@acme.test' }),
        employee({ full_name: 'Annie Lee', email: 'annie.lee@acme.test' }),
      ]);

      const response = await request(app).get('/api/employees').query({ search: 'ann_' });

      expect(names(response.body)).toEqual(['Ann_Lee']);
    });
  });

  describe('filters', () => {
    const team = () => [
      employee({ full_name: 'US Engineer', country: 'US' }),
      employee({
        full_name: 'US Recruiter',
        country: 'US',
        department: 'Human Resources',
        job_title: 'Recruiter',
      }),
      employee({
        full_name: 'IN Engineer',
        country: 'IN',
        currency: 'INR',
        annual_salary: 2_000_000,
      }),
    ];

    it('filters by country (code in any letter case)', async () => {
      const app = await appWith(team());

      const response = await request(app).get('/api/employees?country=in');

      expect(names(response.body)).toEqual(['IN Engineer']);
    });

    it('filters by department', async () => {
      const app = await appWith(team());

      const response = await request(app)
        .get('/api/employees')
        .query({ department: 'Human Resources' });

      expect(names(response.body)).toEqual(['US Recruiter']);
    });

    it('combines filters with AND', async () => {
      const app = await appWith(team());

      const response = await request(app)
        .get('/api/employees')
        .query({ country: 'US', jobTitle: 'Software Engineer' });

      expect(names(response.body)).toEqual(['US Engineer']);
      expect(response.body.totalItems).toBe(1);
    });

    it('ignores empty filter values', async () => {
      const app = await appWith(team());

      const response = await request(app).get('/api/employees?country=&department=&search=');

      expect(response.body.totalItems).toBe(3);
    });
  });

  describe('sorting', () => {
    const people = () => [
      employee({ full_name: 'Bea', annual_salary: 90_000, hire_date: '2019-01-01' }),
      employee({ full_name: 'Al', annual_salary: 120_000, hire_date: '2023-01-01' }),
      employee({ full_name: 'Cy', annual_salary: 90_000, hire_date: '2015-01-01' }),
    ];

    it('sorts by name A→Z by default', async () => {
      const app = await appWith(people());

      const response = await request(app).get('/api/employees');

      expect(names(response.body)).toEqual(['Al', 'Bea', 'Cy']);
    });

    it('sorts by salary, highest first, keeping equal salaries in a stable order', async () => {
      const app = await appWith(people());

      const response = await request(app).get('/api/employees?sortBy=annualSalary&sortOrder=desc');

      expect(names(response.body)).toEqual(['Al', 'Bea', 'Cy']);
    });

    it('sorts by hire date, oldest first', async () => {
      const app = await appWith(people());

      const response = await request(app).get('/api/employees?sortBy=hireDate');

      expect(names(response.body)).toEqual(['Cy', 'Bea', 'Al']);
    });

    it('sorts by employee code in number order, in both directions', async () => {
      const app = await appWith([
        employee({ employee_code: 'EMP-99999', full_name: 'Third' }),
        employee({ employee_code: 'EMP-100000', full_name: 'Fourth' }),
        employee({ employee_code: 'EMP-00002', full_name: 'Second' }),
        employee({ employee_code: 'EMP-00001', full_name: 'First' }),
      ]);

      const ascending = await request(app).get('/api/employees?sortBy=employeeCode');
      const descending = await request(app).get(
        '/api/employees?sortBy=employeeCode&sortOrder=desc',
      );

      expect(names(ascending.body)).toEqual(['First', 'Second', 'Third', 'Fourth']);
      expect(names(descending.body)).toEqual(['Fourth', 'Third', 'Second', 'First']);
    });
  });

  describe('invalid input', () => {
    it.each([
      ['page=0', 'page'],
      ['page=abc', 'page'],
      ['pageSize=101', 'pageSize'],
      ['sortBy=email; DROP TABLE employees', 'sortBy'],
      ['sortOrder=up', 'sortOrder'],
      ['country=India', 'country'],
    ])('rejects %s with a 400 naming the field', async (queryString, field) => {
      const app = await appWith([employee()]);

      const response = await request(app).get(`/api/employees?${queryString}`);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Some of the values you sent are not valid.');
      expect(response.body.error.details).toEqual([{ field, message: expect.any(String) }]);
    });
  });
});

describe('GET /api/employees/export', () => {
  beforeEach(() => {
    employee = createEmployeeFactory();
  });

  it('returns everyone matching the search and filters, in the list order, without paging', async () => {
    const app = await appWith([
      ...Array.from({ length: 30 }, (_, index) =>
        employee({
          full_name: `Indian ${String(index).padStart(2, '0')}`,
          country: 'IN',
          currency: 'INR',
        }),
      ),
      employee({ full_name: 'American', country: 'US' }),
    ]);

    const response = await request(app).get('/api/employees/export?country=IN&sortOrder=desc');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(30); // more than one page of 25
    expect(names({ items: response.body })[0]).toBe('Indian 29');
    expect(response.body[0]).toMatchObject({ country: 'IN', currency: 'INR' });
  });

  it('rejects invalid filters, like the list does', async () => {
    const app = await appWith([employee()]);

    const response = await request(app).get('/api/employees/export?sortBy=password');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('sortBy');
  });
});
