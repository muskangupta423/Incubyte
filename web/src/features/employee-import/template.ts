import { countryName, IMPORT_COLUMNS, type Country } from '@acme/shared';
import { utils, writeFile } from 'xlsx';

/**
 * Downloads an .xlsx with the expected columns and one example row, plus a second sheet listing
 * the countries that are set up (others must be added in the app first).
 */
export function downloadTemplate(countries: readonly Country[]) {
  const employees = utils.aoa_to_sheet([
    IMPORT_COLUMNS.map((column) => column.header),
    [
      '',
      'Priya Sharma',
      'priya.sharma@acme.test',
      'Software Engineer',
      'Engineering',
      'India',
      2400000,
      '2026-11-02',
    ],
  ]);
  employees['!cols'] = IMPORT_COLUMNS.map(() => ({ wch: 22 }));

  const countryList = utils.aoa_to_sheet([
    ['Country', 'Code', 'Currency'],
    ...countries.map((country) => [countryName(country.code), country.code, country.currency]),
  ]);
  countryList['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 10 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, employees, 'Employees');
  utils.book_append_sheet(workbook, countryList, 'Countries');
  writeFile(workbook, 'acme-employees-template.xlsx');
}
