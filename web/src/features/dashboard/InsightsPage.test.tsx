import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';
import { setScreenSize } from '../../test/screen-size';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee } from '../employees/test-data';
import { insightsApiHandlers } from './test-data';

function useFakeApi() {
  const api = insightsApiHandlers();
  server.use(...api.handlers);
  return api;
}

beforeEach(() => {
  // Country and department filter options come from the employees API (countries with employees).
  server.use(
    ...employeeApiHandlers([
      makeEmployee({ id: 1, country: 'IN' }),
      makeEmployee({ id: 2, country: 'US', currency: 'USD' }),
    ]).handlers,
  );
});

/** The value shown under a stat card's label (cards are <dt>/<dd> pairs, roles "term"/"definition"). */
async function statValue(label: string) {
  const terms = await screen.findAllByRole('term');
  return terms.find((term) => term.textContent === label)?.nextElementSibling ?? null;
}

function section(name: string) {
  return screen.getByRole('region', { name });
}

describe('Insights page', () => {
  it('shows headline figures for the whole organisation', async () => {
    useFakeApi();
    renderRoute('/insights');

    expect(await statValue('Employees')).toHaveTextContent('10,000');
    expect(await statValue('Total annual payroll')).toHaveTextContent('$713.8M');
    expect(await statValue('Typical salary (median)')).toHaveTextContent('$63,800');
    expect(await statValue('Average salary')).toHaveTextContent('$64,800');
    expect(
      screen.getByText('USD figures use exchange rates as of Nov 1, 2026.'),
    ).toBeInTheDocument();
  });

  it('answers each question in a sentence and lists the chart values', async () => {
    useFakeApi();
    renderRoute('/insights');

    const countries = await screen.findByRole('region', {
      name: 'Typical pay by country (median, USD)',
    });
    expect(countries).toHaveTextContent(
      'Typical pay is highest in United States ($102,000) and lowest in India ($28,534).',
    );
    // Same numbers as the chart, available to screen readers.
    expect(within(countries).getByText('India: $28,534')).toBeInTheDocument();

    expect(
      await screen.findByRole('region', { name: 'Salary distribution (USD)' }),
    ).toHaveTextContent('The most common salary range is $25K–$50K: 6,000 employees (60%).');
    expect(
      await screen.findByRole('region', { name: 'Share of payroll by department' }),
    ).toHaveTextContent('Engineering accounts for 80% of payroll and 40% of employees.');
  });

  it('lists pay by job title in USD, highest typical (median) pay first', async () => {
    useFakeApi();
    renderRoute('/insights');

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Engineering Manager');
    expect(rows[1]).toHaveTextContent('$120,000');
    expect(rows[2]).toHaveTextContent('Software Engineer');
    expect(
      within(table).getByRole('columnheader', { name: 'Typical (median)' }),
    ).toBeInTheDocument();
    expect(section('Pay by job title')).toHaveTextContent(
      'In USD, across all countries. Highest typical pay first.',
    );
  });

  it('applies a country filter to every section and switches to local currency', async () => {
    const api = useFakeApi();
    const { user, router } = renderRoute('/insights');
    await screen.findByRole('table');

    await user.selectOptions(screen.getByLabelText('Country'), 'India');

    await waitFor(() => expect(section('Pay by job title')).toHaveTextContent('In INR, in India.'));
    expect(within(screen.getByRole('table')).getByText('₹2,400,000')).toBeInTheDocument();
    expect(await statValue('Typical salary (median)')).toHaveTextContent('$28,534');
    expect((await statValue('Typical salary (median)'))?.nextElementSibling).toHaveTextContent(
      '₹2,503,000',
    );
    expect(router.state.location.search).toBe('?country=IN');

    // All five endpoints were asked for India's figures.
    const indiaRequests = api.requests.filter((url) => url.searchParams.get('country') === 'IN');
    expect(new Set(indiaRequests.map((url) => url.pathname))).toEqual(
      new Set([
        '/api/insights/summary',
        '/api/insights/by-country',
        '/api/insights/by-department',
        '/api/insights/by-job-title',
        '/api/insights/distribution',
      ]),
    );
  });

  it('explains when no employees match the filters', async () => {
    useFakeApi();
    server.use(
      http.get('*/api/insights/summary', () =>
        HttpResponse.json({ stats: null, exchangeRatesAsOf: '2026-11-01' }),
      ),
    );
    renderRoute('/insights?department=Legal');

    expect(await screen.findByText('No employees match these filters')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps the rest of the dashboard working when one section fails', async () => {
    useFakeApi();
    server.use(
      http.get('*/api/insights/by-country', () =>
        HttpResponse.json(
          { error: { message: 'Something went wrong. Please try again.' } },
          { status: 500 },
        ),
      ),
    );
    renderRoute('/insights');

    expect(await screen.findByText("Couldn't load pay by country")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});

describe('Insights page on a phone', () => {
  it('shows active filters as chips instead of a "Clear filters" button', async () => {
    setScreenSize('phone');
    useFakeApi();
    const { user, router } = renderRoute('/insights?country=IN');
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Country filter: India' }));

    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Country')).toHaveValue('');
  });
});
