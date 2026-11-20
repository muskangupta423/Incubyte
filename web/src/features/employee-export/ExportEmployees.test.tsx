import { importRowSchema } from '@acme/shared';
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { read, utils } from 'xlsx';
import { renderRoute } from '../../test/render';
import { server } from '../../test/server';
import { readSpreadsheet } from '../employee-import/read-spreadsheet';
import { employeeApiHandlers, makeEmployee } from '../employees/test-data';
import { exportFile } from './export-file';

const team = () => [
  makeEmployee({ id: 1, fullName: 'Asha Rao', employeeCode: 'EMP-00001' }),
  makeEmployee({
    id: 2,
    fullName: 'José Silva',
    employeeCode: 'EMP-00002',
    email: 'jose@acme.test',
  }),
  makeEmployee({
    id: 3,
    fullName: 'John Smith',
    employeeCode: 'EMP-00003',
    country: 'US',
    currency: 'USD',
  }),
];

/** jsdom can't download files: capture what would have been saved instead. */
function captureDownloads() {
  const saved: { name: string; file: Blob }[] = [];
  let lastBlob: Blob | undefined;
  URL.createObjectURL = (file: Blob) => {
    lastBlob = file;
    return 'blob:export';
  };
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (lastBlob) saved.push({ name: this.download, file: lastBlob });
  });
  return saved;
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function openExport(path: string) {
  const api = employeeApiHandlers(team());
  server.use(...api.handlers);
  const result = renderRoute(path);
  await screen.findAllByRole('row', { name: /EMP-0000/ });
  await result.user.click(screen.getByRole('button', { name: 'Export' }));
  const dialog = await screen.findByRole('dialog', { name: 'Export employees' });
  return { ...result, api, dialog };
}

describe('exporting employees', () => {
  it('downloads the filtered list as Excel, with the upload columns first', async () => {
    const saved = captureDownloads();
    const { user, api, dialog } = await openExport('/employees?country=IN&sortOrder=desc');
    expect(dialog).toHaveTextContent(
      'Exports 2 employees — everyone matching your current search and filters',
    );

    await user.click(within(dialog).getByRole('button', { name: 'Excel (.xlsx)' }));

    expect(await screen.findByText('2 employees exported')).toBeInTheDocument();
    // Same filters and sort as the list, without paging.
    expect(Object.fromEntries(api.requests.at(-1) ?? [])).toEqual({
      country: 'IN',
      sortBy: 'fullName',
      sortOrder: 'desc',
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]?.name).toMatch(/^acme-employees-\d{4}-\d{2}-\d{2}\.xlsx$/);
    const workbook = read(await saved[0]?.file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets.Employees;
    if (!sheet) throw new Error('No Employees sheet');
    expect(utils.sheet_to_json(sheet, { header: 1 })).toEqual([
      [
        'Employee code',
        'Full name',
        'Email',
        'Job title',
        'Department',
        'Country',
        'Annual salary',
        'Hire date',
        'Currency',
        'Annual salary (USD)',
      ],
      [
        'EMP-00001',
        'Asha Rao',
        'asha.rao@acme.test',
        'Software Engineer',
        'Engineering',
        'India',
        2500000,
        '2022-04-01',
        'INR',
        28500,
      ],
      [
        'EMP-00002',
        'José Silva',
        'jose@acme.test',
        'Software Engineer',
        'Engineering',
        'India',
        2500000,
        '2022-04-01',
        'INR',
        28500,
      ],
    ]);
  });

  it('downloads CSV that Excel opens as UTF-8, so accented names survive', async () => {
    const saved = captureDownloads();
    const { user, dialog } = await openExport('/employees');
    expect(dialog).toHaveTextContent('Exports 3 employees — all employees');

    await user.click(within(dialog).getByRole('button', { name: 'CSV (.csv)' }));

    await screen.findByText('3 employees exported');
    const bytes = new Uint8Array(await (saved[0]?.file ?? new Blob()).arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // the UTF-8 byte-order mark
    const text = new TextDecoder().decode(bytes.slice(3));
    expect(text.split('\n')[0]).toBe(
      'Employee code,Full name,Email,Job title,Department,Country,Annual salary,Hire date,Currency,Annual salary (USD)',
    );
    expect(text).toContain('EMP-00002,José Silva,jose@acme.test');
  });
});

describe('export → upload round trip', () => {
  it('produces a file the upload reads back into valid rows', async () => {
    const file = new File([exportFile(team(), 'xlsx')], 'export.xlsx');

    const result = await readSpreadsheet(file);

    if (!result.ok) throw new Error(result.message);
    expect(result.rows).toHaveLength(3);
    // The same check the API runs on every uploaded row (it ignores the extra rowNumber).
    for (const row of result.rows) expect(importRowSchema.safeParse(row).success).toBe(true);
    expect(result.rows[2]).toMatchObject({
      rowNumber: 4,
      employeeCode: 'EMP-00003',
      country: 'United States',
    });
  });
});
