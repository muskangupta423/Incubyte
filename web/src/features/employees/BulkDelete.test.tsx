import { MAX_BULK_DELETE } from '@acme/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';
import { setScreenSize } from '../../test/screen-size';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee, makeEmployees } from './test-data';

function useFakeApi(employees = makeEmployees(60)) {
  const api = employeeApiHandlers(employees);
  server.use(...api.handlers);
  return api;
}

const team = () => [
  makeEmployee({ id: 1, fullName: 'Asha Rao', employeeCode: 'EMP-00001' }),
  makeEmployee({ id: 2, fullName: 'Ben Ito', employeeCode: 'EMP-00002' }),
  makeEmployee({ id: 3, fullName: 'Cara Diaz', employeeCode: 'EMP-00003' }),
];

/** Body rows of the employee table (the first row group is the header). */
const rows = () =>
  within(screen.getAllByRole('rowgroup').at(-1) ?? document.body).getAllByRole('row');

const selectionBar = () => screen.queryByRole('region', { name: 'Selected employees' });
const selectAll = () => screen.getByRole('checkbox', { name: 'Select all employees on this page' });

describe('bulk delete', () => {
  it('deletes the ticked employees after one confirmation', async () => {
    const api = useFakeApi(team());
    const { user } = renderRoute('/employees');
    await screen.findByRole('row', { name: /Asha Rao/ });
    expect(selectionBar()).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select Asha Rao' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Cara Diaz' }));

    expect(selectionBar()).toHaveTextContent('2 selected');
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    const dialog = await screen.findByRole('dialog', { name: 'Delete 2 employees?' });
    expect(within(dialog).getByRole('list', { name: 'Employees to delete' })).toHaveTextContent(
      'Asha Rao (EMP-00001)Cara Diaz (EMP-00003)',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Delete 2 employees' }));

    expect(await screen.findByText('2 employees deleted')).toBeInTheDocument();
    expect(api.changes).toEqual([{ method: 'BULK_DELETE', ids: [1, 3] }]);
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Asha Rao/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('row', { name: /Ben Ito/ })).toBeInTheDocument();
    expect(selectionBar()).not.toBeInTheDocument();
  });

  it('selects every row on the page, and shows a partly-ticked box when some are unticked', async () => {
    useFakeApi(); // 60 employees, 25 per page
    const { user } = renderRoute('/employees');
    await screen.findByText('Showing 1–25 of 60');

    await user.click(selectAll());

    expect(selectionBar()).toHaveTextContent('25 selected');
    expect(selectAll()).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select Employee 1' }));

    expect(selectionBar()).toHaveTextContent('24 selected');
    expect(selectAll()).not.toBeChecked();
    expect(selectAll()).toHaveProperty('indeterminate', true);

    // The confirmation names the first five and counts the rest.
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));
    const names = within(await screen.findByRole('dialog')).getByRole('list', {
      name: 'Employees to delete',
    });
    expect(within(names).getAllByRole('listitem')).toHaveLength(6);
    expect(names).toHaveTextContent('and 19 more');
  });

  it('keeps ticks across pages, and deletes everyone ticked on any page', async () => {
    const api = useFakeApi(); // 60 employees, 25 per page
    const { user } = renderRoute('/employees');
    await screen.findByText('Showing 1–25 of 60');
    await user.click(screen.getByRole('checkbox', { name: 'Select Employee 1' }));

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Showing 26–50 of 60');
    await user.click(screen.getByRole('checkbox', { name: 'Select Employee 30' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Employee 31' }));

    // The bar makes clear that some ticked people are not on screen.
    expect(selectionBar()).toHaveTextContent('3 selected · 2 on this page');

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await screen.findByText('Showing 1–25 of 60');
    expect(screen.getByRole('checkbox', { name: 'Select Employee 1' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Delete selected' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete 3 employees?' });
    expect(within(dialog).getByRole('list', { name: 'Employees to delete' })).toHaveTextContent(
      'Employee 1 (EMP-00001)Employee 30 (EMP-00030)Employee 31 (EMP-00031)',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Delete 3 employees' }));

    expect(await screen.findByText('3 employees deleted')).toBeInTheDocument();
    expect(api.changes).toEqual([{ method: 'BULK_DELETE', ids: [1, 30, 31] }]);
    await waitFor(() => expect(selectionBar()).not.toBeInTheDocument());
  });

  it('keeps ticks across searches, so people can be collected one search at a time', async () => {
    const api = useFakeApi(team());
    const { user } = renderRoute('/employees');
    const search = await screen.findByRole('searchbox', { name: 'Search' });

    await user.type(search, 'asha');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Asha Rao' }));
    await user.clear(search);
    await user.type(search, 'cara');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Cara Diaz' }));
    await waitFor(() => expect(rows()).toHaveLength(1));

    expect(selectionBar()).toHaveTextContent('2 selected · 1 on this page');

    await user.click(screen.getByRole('button', { name: 'Delete selected' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete 2 employees' }),
    );

    expect(await screen.findByText('2 employees deleted')).toBeInTheDocument();
    expect(api.changes).toEqual([{ method: 'BULK_DELETE', ids: [1, 3] }]);
  });

  it('keeps ticks when sorting or filtering', async () => {
    useFakeApi([
      ...team(),
      makeEmployee({ id: 4, fullName: 'Dan Lee', country: 'US', currency: 'USD' }),
    ]);
    const { user } = renderRoute('/employees');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Ben Ito' }));

    await user.click(
      within(screen.getByRole('columnheader', { name: /Hire date/ })).getByRole('button'),
    );
    await user.selectOptions(screen.getByLabelText('Country'), 'United States');

    await waitFor(() => expect(rows()).toHaveLength(1)); // only Dan
    expect(selectionBar()).toHaveTextContent('1 selected · 0 on this page');
    await user.selectOptions(screen.getByLabelText('Country'), 'India');
    expect(await screen.findByRole('checkbox', { name: 'Select Ben Ito' })).toBeChecked();
  });

  it(`stops at ${MAX_BULK_DELETE} ticked employees and says why`, async () => {
    useFakeApi(makeEmployees(MAX_BULK_DELETE + 100));
    const { user } = renderRoute('/employees?pageSize=100');
    await screen.findByText(/Showing 1–100/);

    // Tick five full pages: exactly the limit.
    for (let page = 1; page <= 5; page += 1) {
      await user.click(selectAll());
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText(new RegExp(`Showing ${page * 100 + 1}–`));
    }
    expect(selectionBar()).toHaveTextContent(`${MAX_BULK_DELETE} selected`);

    await user.click(selectAll());

    expect(
      await screen.findByText(`You can select up to ${MAX_BULK_DELETE} employees at a time`),
    ).toBeInTheDocument();
    expect(selectAll()).not.toBeChecked();
    expect(selectionBar()).toHaveTextContent(`${MAX_BULK_DELETE} selected · 0 on this page`);
  });

  it('can clear the selection without deleting', async () => {
    const api = useFakeApi(team());
    const { user } = renderRoute('/employees');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Ben Ito' }));

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(selectionBar()).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Ben Ito' })).not.toBeChecked();
    expect(api.changes).toEqual([]);
  });

  it('keeps the dialog and the selection when deleting fails', async () => {
    useFakeApi(team());
    server.use(
      http.post('*/api/employees/bulk-delete', () =>
        HttpResponse.json(
          { error: { message: 'Something went wrong. Please try again.' } },
          { status: 500 },
        ),
      ),
    );
    const { user } = renderRoute('/employees');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Ben Ito' }));
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete 1 employee?' });

    await user.click(within(dialog).getByRole('button', { name: 'Delete 1 employee' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(selectionBar()).toHaveTextContent('1 selected');
  });

  it('says so when some of the selected employees were already deleted by someone else', async () => {
    const api = useFakeApi(team());
    const { user } = renderRoute('/employees');
    await user.click(await screen.findByRole('checkbox', { name: 'Select Asha Rao' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Ben Ito' }));
    // Ben is deleted elsewhere before this user confirms.
    server.use(
      http.post('*/api/employees/bulk-delete', () => HttpResponse.json({ deletedCount: 1 })),
    );
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete 2 employees' }),
    );

    expect(
      await screen.findByText('1 employee deleted. 1 employee had already been removed.'),
    ).toBeInTheDocument();
    expect(api.changes).toEqual([]);
  });

  it('offers the last page when the current page no longer exists (e.g. all its rows deleted)', async () => {
    useFakeApi(); // 3 pages
    const { user, router } = renderRoute('/employees?page=5');

    expect(await screen.findByText('This page is empty')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to last page' }));

    expect(await screen.findByText('Showing 51–60 of 60')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=3');
  });

  it('lets phone users tick cards and delete them', async () => {
    setScreenSize('phone');
    useFakeApi(team());
    const { user } = renderRoute('/employees');

    await user.click(await screen.findByRole('checkbox', { name: 'Select Cara Diaz' }));

    expect(selectionBar()).toHaveTextContent('1 selected');
    expect(screen.getByText('Select all')).toBeInTheDocument();
  });
});
