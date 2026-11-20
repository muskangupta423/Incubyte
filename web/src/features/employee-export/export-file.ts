import { countryName, IMPORT_COLUMNS, type Employee, type ImportColumnKey } from '@acme/shared';
import { utils, write } from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv';

/** An invisible first character marking a file as UTF-8 text. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** Shown after the upload columns. Upload ignores them, so an export can be uploaded back as-is. */
const EXTRA_HEADERS = ['Currency', 'Annual salary (USD)'];

/** One header row, then one row per employee: the upload template's columns first, in the same order. */
export function exportTable(employees: readonly Employee[]): (string | number)[][] {
  return [
    [...IMPORT_COLUMNS.map((column) => column.header), ...EXTRA_HEADERS],
    ...employees.map((employee) => {
      const values: Record<ImportColumnKey, string | number> = {
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        email: employee.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        country: countryName(employee.country),
        annualSalary: employee.annualSalary,
        hireDate: employee.hireDate,
      };
      return [
        ...IMPORT_COLUMNS.map((column) => values[column.key]),
        employee.currency,
        employee.annualSalaryUsd,
      ];
    }),
  ];
}

export function exportFile(employees: readonly Employee[], format: ExportFormat): Blob {
  const sheet = utils.aoa_to_sheet(exportTable(employees));
  if (format === 'csv') {
    // The byte-order mark tells Excel the file is UTF-8, so accented names and currency symbols show correctly.
    return new Blob([BYTE_ORDER_MARK, utils.sheet_to_csv(sheet)], {
      type: 'text/csv;charset=utf-8',
    });
  }
  sheet['!cols'] = [...IMPORT_COLUMNS, ...EXTRA_HEADERS].map(() => ({ wch: 20 }));
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, 'Employees');
  const bytes: ArrayBuffer = write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** acme-employees-2026-11-21.xlsx */
export function exportFileName(format: ExportFormat, today = new Date()): string {
  return `acme-employees-${today.toISOString().slice(0, 10)}.${format}`;
}
