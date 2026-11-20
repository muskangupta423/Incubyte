import { describe, expect, it } from 'vitest';
import { importRowSchema, REQUIRED_IMPORT_COLUMNS } from './import';

const row = {
  employeeCode: '',
  fullName: 'Wanjiru Kamau',
  email: 'Wanjiru.Kamau@acme.test',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'India',
  annualSalary: '2,400,000',
  hireDate: '2026-11-02',
};

describe('import row', () => {
  it('accepts spreadsheet-style values: country names, numbers as text, an empty code', () => {
    expect(importRowSchema.parse(row)).toEqual({
      employeeCode: undefined,
      fullName: 'Wanjiru Kamau',
      email: 'wanjiru.kamau@acme.test',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      country: 'IN',
      annualSalary: 2_400_000,
      hireDate: '2026-11-02',
    });
  });

  it('normalises an employee code to update an existing employee', () => {
    expect(importRowSchema.parse({ ...row, employeeCode: ' emp-00042 ' }).employeeCode).toBe(
      'EMP-00042',
    );
  });

  it.each([
    ['employeeCode', '42', 'Use a code like EMP-00042, or leave it empty for a new employee'],
    ['country', 'Indai', 'Choose a country from the list'],
    ['annualSalary', 'lots', 'Annual salary must be a number'],
    ['annualSalary', '', 'Annual salary must be a number'],
  ])('reports %s = %j as "%s"', (field, value, message) => {
    const result = importRowSchema.safeParse({ ...row, [field]: value });
    expect(result.error?.issues).toEqual([expect.objectContaining({ path: [field], message })]);
  });

  it('requires every column except the employee code', () => {
    expect(REQUIRED_IMPORT_COLUMNS).toEqual([
      'fullName',
      'email',
      'jobTitle',
      'department',
      'country',
      'annualSalary',
      'hireDate',
    ]);
  });
});
