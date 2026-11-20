import type { ImportCheckResult, ImportRequest } from '@acme/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { utils, write } from 'xlsx';
import { renderRoute } from '../../test/render';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee } from '../employees/test-data';

const HEADERS = [
  'Employee code',
  'Full name',
  'Email',
  'Job title',
  'Department',
  'Country',
  'Annual salary',
  'Hire date',
];

/** A real .xlsx file, built the way Excel would store it. */
function xlsxFile(rows: (string | number)[][], name = 'team.xlsx') {
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), 'Employees');
  const bytes: ArrayBuffer = write(workbook, { type: 'array', bookType: 'xlsx' });
  return new File([bytes], name);
}

/** Records what the dialog sends, and answers with the given check result. */
function useImportApi(checkResult: ImportCheckResult) {
  const sent: { check: ImportRequest['rows'][]; save: ImportRequest['rows'][] } = {
    check: [],
    save: [],
  };
  server.use(
    ...employeeApiHandlers([makeEmployee()]).handlers,
    http.post('*/api/employees/import/check', async ({ request }) => {
      sent.check.push(((await request.json()) as ImportRequest).rows);
      return HttpResponse.json(checkResult);
    }),
    http.post('*/api/employees/import', async ({ request }) => {
      sent.save.push(((await request.json()) as ImportRequest).rows);
      return HttpResponse.json({ created: checkResult.toCreate, updated: checkResult.toUpdate });
    }),
  );
  return sent;
}

const READY: ImportCheckResult = { toCreate: 1, toUpdate: 1, errors: [], errorCount: 0 };

async function openUpload() {
  const result = renderRoute('/employees');
  await screen.findByRole('row', { name: /Asha Rao/ });
  await result.user.click(screen.getByRole('button', { name: 'Upload' }));
  const dialog = await screen.findByRole('dialog', { name: 'Upload employees' });
  return { ...result, dialog, fileInput: within(dialog).getByLabelText('Choose file') };
}

describe('uploading employees', () => {
  it('reads an Excel file, shows what will happen, and imports it', async () => {
    const sent = useImportApi(READY);
    const { user, dialog, fileInput } = await openUpload();
    const importButton = within(dialog).getByRole('button', { name: /^Import/ });
    expect(importButton).toBeDisabled();

    await user.upload(
      fileInput,
      xlsxFile([
        HEADERS,
        [
          '',
          'Wanjiru Kamau',
          'wanjiru@acme.test',
          'Engineer',
          'Engineering',
          'India',
          2400000,
          46328,
        ],
        [], // a blank row is skipped, but row numbers stay as in the file
        [
          'EMP-00001',
          'Asha Rao',
          'asha.rao@acme.test',
          'Lead',
          'Engineering',
          'IN',
          '2,900,000',
          '2022-04-01',
        ],
      ]),
    );

    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      '2 rows ready: 1 new, 1 updates.',
    );
    expect(sent.check).toEqual([
      [
        {
          rowNumber: 2,
          employeeCode: '',
          fullName: 'Wanjiru Kamau',
          email: 'wanjiru@acme.test',
          jobTitle: 'Engineer',
          department: 'Engineering',
          country: 'India',
          annualSalary: 2400000,
          hireDate: '2026-11-02', // Excel's day number 46328
        },
        {
          rowNumber: 4,
          employeeCode: 'EMP-00001',
          fullName: 'Asha Rao',
          email: 'asha.rao@acme.test',
          jobTitle: 'Lead',
          department: 'Engineering',
          country: 'IN',
          annualSalary: '2,900,000',
          hireDate: '2022-04-01',
        },
      ],
    ]);

    await user.click(within(dialog).getByRole('button', { name: 'Import 2 employees' }));

    expect(await screen.findByText('2 employees imported: 1 added, 1 updated')).toBeInTheDocument();
    expect(sent.save).toEqual(sent.check);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reads a CSV file, keeping values as typed', async () => {
    const sent = useImportApi(READY);
    const { user, dialog, fileInput } = await openUpload();
    const csv = [
      'full name,EMAIL,Job Title,department,country,annual salary,hire date',
      'Wanjiru Kamau,wanjiru@acme.test,Engineer,Engineering,India,2400000,2026-11-02',
    ].join('\n');

    await user.upload(fileInput, new File([csv], 'team.csv', { type: 'text/csv' }));

    await within(dialog).findByRole('status');
    // Headers match ignoring case and spaces; the optional Employee code column may be left out.
    expect(sent.check[0]).toEqual([
      {
        rowNumber: 2,
        fullName: 'Wanjiru Kamau',
        email: 'wanjiru@acme.test',
        jobTitle: 'Engineer',
        department: 'Engineering',
        country: 'India',
        annualSalary: '2400000',
        hireDate: '2026-11-02',
      },
    ]);
  });

  it('lists the problems the check finds, and does not allow importing', async () => {
    useImportApi({
      toCreate: 1,
      toUpdate: 0,
      errors: [
        { rowNumber: 3, column: 'Annual salary', message: 'Annual salary must be greater than 0' },
        { rowNumber: 5, column: 'Country', message: "Kenya isn't set up yet" },
      ],
      errorCount: 12,
    });
    const { user, dialog, fileInput } = await openUpload();

    await user.upload(
      fileInput,
      xlsxFile([HEADERS, ['', 'A', 'a@acme.test', 'X', 'Y', 'IN', 1, '2026-01-01']]),
    );

    const problems = await within(dialog).findByRole('alert');
    expect(problems).toHaveTextContent('12 problems to fix. Nothing has been imported');
    expect(
      within(problems)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Row 3 · Annual salary: Annual salary must be greater than 0',
      "Row 5 · Country: Kenya isn't set up yet",
      '…and 10 more',
    ]);
    expect(within(dialog).getByRole('button', { name: /^Import/ })).toBeDisabled();
  });

  it.each([
    [
      'a file without required columns',
      xlsxFile([
        ['Full name', 'Email'],
        ['A', 'a@acme.test'],
      ]),
      'The file is missing these columns: Job title, Department, Country, Annual salary, Hire date.',
    ],
    ['a file with only headers', xlsxFile([HEADERS]), 'The file has no employees in it.'],
    [
      'another file type',
      new File(['hello'], 'team.pdf'),
      'Choose an Excel (.xlsx) or CSV (.csv) file.',
    ],
  ])('explains %s, without sending anything', async (_case, file, message) => {
    const sent = useImportApi(READY);
    const { dialog, fileInput } = await openUpload();

    // A change event, not user.upload: upload() would quietly drop a file that doesn't match
    // the input's accept=".xlsx,.csv" — but people can still pick "All files" or drag one in.
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(message);
    expect(sent.check).toEqual([]);
  });
});
