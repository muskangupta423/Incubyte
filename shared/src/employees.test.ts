import { describe, expect, it } from 'vitest';
import { employeeListQuerySchema } from './employees';

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
