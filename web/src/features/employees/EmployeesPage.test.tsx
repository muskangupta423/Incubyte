import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee, makeEmployees } from './test-data';

function useFakeApi(employees = makeEmployees(60)) {
  const api = employeeApiHandlers(employees);
  server.use(...api.handlers);
  return api;
}

/** The last item, failing the test clearly if there is none. */
function last<T>(items: T[]): T {
  const item = items.at(-1);
  if (item === undefined) throw new Error('Expected at least one item');
  return item;
}

/** Body rows of the employee table (the first row group is the header). */
function rows() {
  return within(last(screen.getAllByRole('rowgroup'))).getAllByRole('row');
}

describe('Employees page', () => {
  it('shows employees with salary in local currency and USD', async () => {
    useFakeApi([makeEmployee()]);
    renderRoute('/employees');

    expect(screen.getByRole('status')).toHaveTextContent('Loading employees…');
    const row = await screen.findByRole('row', { name: /Asha Rao/ });

    expect(row).toHaveTextContent('EMP-00001 · asha.rao@acme.test');
    expect(row).toHaveTextContent('Software Engineer');
    expect(row).toHaveTextContent('India');
    expect(row).toHaveTextContent('₹2,500,000');
    expect(row).toHaveTextContent('≈ $28,500');
    expect(row).toHaveTextContent('Apr 1, 2022');
  });

  it('pages through results, keeping the page in the URL', async () => {
    const api = useFakeApi();
    const { user, router } = renderRoute('/employees');
    await screen.findByText('Showing 1–25 of 60');

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Showing 26–50 of 60')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(api.requests.at(-1)?.get('page')).toBe('2');
  });

  it('disables "Previous" on the first page and "Next" on the last', async () => {
    useFakeApi(makeEmployees(3));
    renderRoute('/employees');

    await screen.findByText('Page 1 of 1');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('changes the number of rows per page', async () => {
    useFakeApi();
    const { user } = renderRoute('/employees?page=2');
    await screen.findByText('Showing 26–50 of 60');

    await user.selectOptions(screen.getByLabelText('Rows per page'), '50');

    // Back to page 1 with the new size.
    expect(await screen.findByText('Showing 1–50 of 60')).toBeInTheDocument();
  });

  it('searches only after typing pauses, and starts again from page 1', async () => {
    const api = useFakeApi([
      ...makeEmployees(30),
      makeEmployee({ id: 99, fullName: 'Priya Sharma', employeeCode: 'EMP-00099' }),
    ]);
    const { user, router } = renderRoute('/employees?page=2');
    await screen.findByText('Showing 26–31 of 31');

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'priya');

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0]).toHaveTextContent('Priya Sharma');
    expect(router.state.location.search).toBe('?search=priya');
    // One request for the whole word, not one per letter.
    const searches = api.requests.map((params) => params.get('search')).filter(Boolean);
    expect(searches).toEqual(['priya']);
  });

  it('filters by country and can clear all filters', async () => {
    useFakeApi([
      makeEmployee({ id: 1, fullName: 'Asha Rao', country: 'IN' }),
      makeEmployee({ id: 2, fullName: 'John Smith', country: 'US', currency: 'USD' }),
    ]);
    const { user, router } = renderRoute('/employees');
    await screen.findByRole('row', { name: /John Smith/ });
    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    expect(clearButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Country'), 'United States');

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0]).toHaveTextContent('John Smith');
    expect(router.state.location.search).toBe('?country=US');

    await user.click(clearButton);

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(screen.getByLabelText('Country')).toHaveValue('');
    expect(router.state.location.search).toBe('');
  });

  it('loads department and job title options for the filters', async () => {
    useFakeApi();
    renderRoute('/employees');

    const department = screen.getByLabelText('Department');
    expect(await within(department).findByRole('option', { name: 'Sales' })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Job title')).getByRole('option', { name: 'Account Executive' }),
    ).toBeInTheDocument();
  });

  it('sorts by a column, highest salary first, then toggles the order', async () => {
    const api = useFakeApi();
    const { user } = renderRoute('/employees');
    const salaryHeader = await screen.findByRole('columnheader', { name: /Annual salary/ });
    expect(salaryHeader).not.toHaveAttribute('aria-sort');

    await user.click(within(salaryHeader).getByRole('button'));

    await waitFor(() => expect(salaryHeader).toHaveAttribute('aria-sort', 'descending'));
    expect(api.requests.at(-1)?.get('sortBy')).toBe('annualSalary');
    expect(api.requests.at(-1)?.get('sortOrder')).toBe('desc');

    await user.click(within(salaryHeader).getByRole('button'));

    await waitFor(() => expect(salaryHeader).toHaveAttribute('aria-sort', 'ascending'));
  });

  it('restores search, filters and sort from a shared link', async () => {
    const api = useFakeApi();
    renderRoute('/employees?search=emp&country=IN&sortBy=hireDate&sortOrder=desc&page=2');

    await screen.findByText(/Showing/);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('emp');
    expect(screen.getByLabelText('Country')).toHaveValue('IN');
    expect(screen.getByRole('columnheader', { name: /Hire date/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(Object.fromEntries(api.requests[0] ?? [])).toMatchObject({
      search: 'emp',
      country: 'IN',
      sortBy: 'hireDate',
      sortOrder: 'desc',
      page: '2',
    });
  });

  it('explains when no employees match, with a way out', async () => {
    useFakeApi([makeEmployee()]);
    const { user } = renderRoute('/employees?country=US');

    expect(await screen.findByText('No employees match these filters')).toBeInTheDocument();

    // The empty state has its own "Clear filters" button (after the one in the filter bar).
    await user.click(last(screen.getAllByRole('button', { name: 'Clear filters' })));

    expect(await screen.findByRole('row', { name: /Asha Rao/ })).toBeInTheDocument();
  });

  it('shows the error and lets the user try again', async () => {
    let shouldFail = true;
    server.use(
      ...employeeApiHandlers([makeEmployee()]).handlers.slice(0, 1),
      http.get('*/api/employees', () =>
        shouldFail
          ? HttpResponse.json(
              { error: { message: 'Something went wrong. Please try again.' } },
              { status: 500 },
            )
          : HttpResponse.json({
              items: [makeEmployee()],
              page: 1,
              pageSize: 25,
              totalItems: 1,
              totalPages: 1,
            }),
      ),
    );
    const { user } = renderRoute('/employees');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load employees");
    expect(alert).toHaveTextContent('Something went wrong. Please try again.');

    shouldFail = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('row', { name: /Asha Rao/ })).toBeInTheDocument();
  });
});
