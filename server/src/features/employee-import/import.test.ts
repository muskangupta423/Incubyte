import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppWith, createEmployeeFactory } from '../employees/test-fixtures';

let employee: ReturnType<typeof createEmployeeFactory>;

beforeEach(() => {
  employee = createEmployeeFactory();
});

/** A spreadsheet row as the browser sends it (row 1 is the header, so data starts at row 2). */
function row(rowNumber: number, overrides: Record<string, unknown> = {}) {
  return {
    rowNumber,
    employeeCode: '',
    fullName: `New Person ${rowNumber}`,
    email: `new${rowNumber}@acme.test`,
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'India',
    annualSalary: '2,400,000',
    hireDate: '2026-11-02',
    ...overrides,
  };
}

async function existingTeam() {
  return createAppWith([
    employee({ full_name: 'Ann Lee', email: 'ann@acme.test' }), // EMP-00001
    employee({ full_name: 'Ben Ito', email: 'ben@acme.test' }), // EMP-00002
  ]);
}

describe('POST /api/employees/import/check', () => {
  it('reports how many rows would be added and updated, saving nothing', async () => {
    const { app } = await existingTeam();

    const response = await request(app)
      .post('/api/employees/import/check')
      .send({ rows: [row(2), row(3, { employeeCode: 'emp-00002', email: 'ben@acme.test' })] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ toCreate: 1, toUpdate: 1, errors: [], errorCount: 0 });
    expect((await request(app).get('/api/employees')).body.totalItems).toBe(2);
  });

  it('lists every problem with its spreadsheet row and column', async () => {
    const { app } = await existingTeam();

    const response = await request(app)
      .post('/api/employees/import/check')
      .send({
        rows: [
          row(2, { annualSalary: '0', hireDate: '01/11/2026' }),
          row(3, { country: 'Kenya' }), // real, but not set up
          row(4, { employeeCode: 'EMP-09999' }), // no such employee
          row(5, { email: 'ann@acme.test' }), // belongs to Ann
          row(6),
          row(7, { email: 'new6@acme.test' }), // same as row 6
        ],
      });

    expect(response.body.toCreate).toBe(1); // only row 6 is fine
    expect(response.body.errorCount).toBe(6);
    expect(response.body.errors).toEqual([
      { rowNumber: 2, column: 'Annual salary', message: 'Annual salary must be greater than 0' },
      { rowNumber: 2, column: 'Hire date', message: 'Use the format YYYY-MM-DD' },
      {
        rowNumber: 3,
        column: 'Country',
        message: "Kenya isn't set up yet — add it from the Add employee form first",
      },
      {
        rowNumber: 4,
        column: 'Employee code',
        message: 'No employee has this code — leave it empty to add a new employee',
      },
      { rowNumber: 5, column: 'Email', message: 'Already used by EMP-00001' },
      { rowNumber: 7, column: 'Email', message: 'Also used on row 6' },
    ]);
  });

  it('caps the listed problems but still counts them all', async () => {
    const { app } = await existingTeam();
    const rows = Array.from({ length: 150 }, (_, index) => row(index + 2, { annualSalary: '-1' }));

    const response = await request(app).post('/api/employees/import/check').send({ rows });

    expect(response.body.errors).toHaveLength(100);
    expect(response.body.errorCount).toBe(150);
  });

  it.each([
    [{ rows: [] }, 'The file has no employees in it'],
    [
      { rows: Array.from({ length: 10_001 }, (_, index) => ({ rowNumber: index + 2 })) },
      'A file can have at most 10,000 employees',
    ],
  ])('rejects an empty or oversized file', async (body, message) => {
    const { app } = await existingTeam();

    const response = await request(app).post('/api/employees/import/check').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].message).toBe(message);
  });
});

describe('POST /api/employees/import', () => {
  it('adds new employees with the next codes, in file order, and updates existing ones', async () => {
    const { app } = await existingTeam();

    const response = await request(app)
      .post('/api/employees/import')
      .send({
        rows: [
          row(2, { fullName: 'Cara Diaz' }),
          row(3, {
            employeeCode: 'EMP-00001',
            fullName: 'Ann Lee-Smith',
            email: 'ann@acme.test',
            annualSalary: 150000,
            country: 'US',
          }),
          row(4, { fullName: 'Dev Shah' }),
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ created: 2, updated: 1 });
    const list = await request(app).get('/api/employees?sortBy=employeeCode');
    expect(
      list.body.items.map((item: { employeeCode: string; fullName: string; currency: string }) => [
        item.employeeCode,
        item.fullName,
        item.currency,
      ]),
    ).toEqual([
      ['EMP-00001', 'Ann Lee-Smith', 'USD'],
      ['EMP-00002', 'Ben Ito', 'USD'],
      ['EMP-00003', 'Cara Diaz', 'INR'],
      ['EMP-00004', 'Dev Shah', 'INR'],
    ]);
    // The next employee added by hand continues after the imported codes.
    const next = await request(app)
      .post('/api/employees')
      .send({
        ...row(9),
        rowNumber: undefined,
        employeeCode: undefined,
        country: 'IN',
        annualSalary: 1,
      });
    expect(next.body.employeeCode).toBe('EMP-00005');
  });

  it('saves nothing when any row has a problem', async () => {
    const { app } = await existingTeam();

    const response = await request(app)
      .post('/api/employees/import')
      .send({ rows: [row(2), row(3, { email: 'not-an-email' })] });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'row 3: Email', message: 'Enter a valid email address' },
    ]);
    expect((await request(app).get('/api/employees')).body.totalItems).toBe(2);
  });

  it('handles a full-size file of 10,000 new employees in one go', async () => {
    const { app } = await createAppWith([]);
    const rows = Array.from({ length: 10_000 }, (_, index) => row(index + 2));

    const response = await request(app).post('/api/employees/import').send({ rows });

    expect(response.body).toEqual({ created: 10_000, updated: 0 });
    const last = await request(app).get(
      '/api/employees?sortBy=employeeCode&sortOrder=desc&pageSize=1',
    );
    expect(last.body.items[0].employeeCode).toBe('EMP-10000');
  });
});
