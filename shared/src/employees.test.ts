import { describe, expect, it } from 'vitest';
import { employeeInputSchema, employeeListQuerySchema } from './employees';

describe('employeeListQuerySchema', () => {
  it('fills in defaults when nothing is given', () => {
    expect(employeeListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
      sortBy: 'fullName',
      sortOrder: 'asc',
    });
  });

  it('converts query-string numbers and normalises text', () => {
    const query = employeeListQuerySchema.parse({
      page: '2',
      pageSize: '50',
      search: '  asha  ',
      country: 'in',
    });

    expect(query).toMatchObject({ page: 2, pageSize: 50, search: 'asha', country: 'IN' });
  });

  it('treats empty strings as "not provided"', () => {
    const query = employeeListQuerySchema.parse({
      search: '',
      country: '',
      department: '',
      jobTitle: '',
    });

    expect(query).toEqual(employeeListQuerySchema.parse({}));
  });

  it('caps the page size at 100', () => {
    expect(employeeListQuerySchema.safeParse({ pageSize: '100' }).success).toBe(true);
    expect(employeeListQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
  });
});

describe('employeeInputSchema', () => {
  const validInput = {
    fullName: 'Asha Rao',
    email: 'asha.rao@acme.test',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'IN',
    annualSalary: 1_800_000,
    hireDate: '2022-04-01',
  };

  function errorFor(field: string, value: unknown): string | undefined {
    const result = employeeInputSchema.safeParse({ ...validInput, [field]: value });
    return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
  }

  it('ignores an employee code: codes are assigned by the system', () => {
    expect(employeeInputSchema.parse({ ...validInput, employeeCode: 'EMP-1' })).toEqual(validInput);
  });

  it('accepts a valid employee', () => {
    expect(employeeInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('normalises email, country and surrounding spaces', () => {
    const parsed = employeeInputSchema.parse({
      ...validInput,
      email: ' Asha.Rao@ACME.test',
      country: 'in',
      fullName: ' Asha Rao ',
    });

    expect(parsed).toEqual(validInput);
  });

  it.each([
    ['fullName', '   ', 'Full name is required'],
    ['fullName', undefined, 'Full name is required'],
    ['fullName', 'x'.repeat(101), 'Full name must be at most 100 characters'],
    ['email', 'asha@', 'Enter a valid email address'],
    ['country', 'FR', 'Choose a supported country'],
    ['annualSalary', 0, 'Annual salary must be greater than 0'],
    ['annualSalary', 1500.5, 'Annual salary must be a whole number'],
    ['annualSalary', '1800000', 'Annual salary must be a number'],
    ['annualSalary', 1_000_000_001, 'Annual salary looks too large — please check it'],
    ['hireDate', '01/04/2022', 'Use the format YYYY-MM-DD'],
    ['hireDate', '2022-02-30', 'Use the format YYYY-MM-DD'],
  ])('rejects %s = %j with "%s"', (field, value, message) => {
    expect(errorFor(field, value)).toBe(message);
  });
});
