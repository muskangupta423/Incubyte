import type { EmployeeInput } from '@acme/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAppWith, createEmployeeFactory } from './test-fixtures';

const newHire: EmployeeInput = {
  employeeCode: 'EMP-20001',
  fullName: 'Meera Iyer',
  email: 'meera.iyer@acme.test',
  jobTitle: 'Product Designer',
  department: 'Product',
  country: 'IN',
  annualSalary: 2_400_000,
  hireDate: '2026-11-02',
};

let employee: ReturnType<typeof createEmployeeFactory>;

beforeEach(() => {
  employee = createEmployeeFactory();
});

describe('GET /api/employees/:id', () => {
  it('returns one employee', async () => {
    const { app } = await createAppWith([employee({ full_name: 'Asha Rao' })]);

    const response = await request(app).get('/api/employees/1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 1, fullName: 'Asha Rao' });
  });

  it('returns 404 for an unknown id', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).get('/api/employees/999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Employee 999 was not found.');
  });

  it('returns 400 for an id that is not a number', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).get('/api/employees/abc');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('id');
  });
});

describe('POST /api/employees', () => {
  it('creates the employee, paid in the currency of their country', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).post('/api/employees').send(newHire);

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/employees/${response.body.id}`);
    expect(response.body).toEqual({
      ...newHire,
      id: expect.any(Number),
      currency: 'INR',
      annualSalaryUsd: 27_360, // 2,400,000 × 0.0114
    });
  });

  it('cleans up the input before saving', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app)
      .post('/api/employees')
      .send({
        ...newHire,
        employeeCode: ' emp-20001 ',
        fullName: '  Meera Iyer ',
        email: 'Meera.Iyer@ACME.test',
        country: 'in',
      });

    expect(response.body).toMatchObject({
      employeeCode: 'EMP-20001',
      fullName: 'Meera Iyer',
      email: 'meera.iyer@acme.test',
      country: 'IN',
    });
  });

  it('makes the new employee appear in the list', async () => {
    const { app } = await createAppWith([employee()]);

    await request(app).post('/api/employees').send(newHire);

    const list = await request(app).get('/api/employees').query({ search: 'Meera' });
    expect(list.body.totalItems).toBe(1);
  });

  it('lists every invalid field at once', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app)
      .post('/api/employees')
      .send({ ...newHire, fullName: ' ', email: 'not-an-email', annualSalary: -5, country: 'FR' });

    expect(response.status).toBe(400);
    expect(
      response.body.error.details.map((detail: { field: string }) => detail.field).sort(),
    ).toEqual(['annualSalary', 'country', 'email', 'fullName']);
  });

  it.each([
    ['employee code', { employeeCode: 'EMP-00001' }, 'employeeCode'],
    ['email (in any letter case)', { email: 'PERSON1@acme.test' }, 'email'],
  ])('rejects a duplicate %s with 409', async (_description, duplicate, field) => {
    const { app } = await createAppWith([employee()]);

    const response = await request(app)
      .post('/api/employees')
      .send({ ...newHire, ...duplicate });

    expect(response.status).toBe(409);
    expect(response.body.error.details).toEqual([{ field, message: response.body.error.message }]);
  });

  it('rejects a body that is not valid JSON', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app)
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('{"fullName": ');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Request body is not valid JSON.');
  });
});

describe('PUT /api/employees/:id', () => {
  it('replaces the employee and re-derives the currency when the country changes', async () => {
    const { app } = await createAppWith([employee({ full_name: 'Asha Rao' })]);

    const response = await request(app)
      .put('/api/employees/1')
      .send({ ...newHire, country: 'DE', annualSalary: 70_000 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      fullName: 'Meera Iyer',
      country: 'DE',
      currency: 'EUR',
    });
  });

  it('records when the employee was last updated', async () => {
    const { app, db } = await createAppWith([employee()]);
    await db.execute(`UPDATE employees SET updated_at = '2000-01-01T00:00:00.000Z'`);

    await request(app).put('/api/employees/1').send(newHire);

    const result = await db.execute('SELECT updated_at FROM employees WHERE id = 1');
    expect(result.rows[0]?.updated_at).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('allows saving an employee with their own unchanged email and code', async () => {
    const { app } = await createAppWith([employee()]);

    const response = await request(app)
      .put('/api/employees/1')
      .send({ ...newHire, employeeCode: 'EMP-00001', email: 'person1@acme.test' });

    expect(response.status).toBe(200);
  });

  it("rejects taking another employee's email with 409", async () => {
    const { app } = await createAppWith([employee(), employee()]);

    const response = await request(app)
      .put('/api/employees/2')
      .send({ ...newHire, email: 'person1@acme.test' });

    expect(response.status).toBe(409);
  });

  it('returns 404 for an unknown id', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).put('/api/employees/999').send(newHire);

    expect(response.status).toBe(404);
  });

  it('validates the body before looking up the employee', async () => {
    const { app } = await createAppWith([employee()]);

    const response = await request(app).put('/api/employees/1').send({});

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/employees/:id', () => {
  it('deletes the employee', async () => {
    const { app } = await createAppWith([employee(), employee()]);

    const response = await request(app).delete('/api/employees/1');

    expect(response.status).toBe(204);
    expect((await request(app).get('/api/employees/1')).status).toBe(404);
    expect((await request(app).get('/api/employees')).body.totalItems).toBe(1);
  });

  it('returns 404 for an unknown id', async () => {
    const { app } = await createAppWith([]);

    const response = await request(app).delete('/api/employees/999');

    expect(response.status).toBe(404);
  });
});
