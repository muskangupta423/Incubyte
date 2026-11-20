import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { employeeApiHandlers } from '../features/employees/test-data';
import { renderRoute } from '../test/render';
import { server } from '../test/server';

// The Employees page loads data; these tests only need it to answer.
beforeEach(() => {
  server.use(...employeeApiHandlers([]).handlers);
});

describe('app routes', () => {
  it('opens the Employees page by default', async () => {
    const { router } = renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Employees' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/employees');
  });

  it('marks the current page in the main navigation', async () => {
    renderRoute('/employees');

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('aria-current', 'page');
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Insights' }));
    expect(screen.getByRole('link', { name: 'Insights' })).not.toHaveAttribute('aria-current');
  });

  it('navigates to the Insights page (loaded on demand)', async () => {
    const { user } = renderRoute('/employees');

    await user.click(await screen.findByRole('link', { name: 'Insights' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows a helpful page for unknown addresses', async () => {
    renderRoute('/no-such-page');

    expect(await screen.findByRole('alert')).toHaveTextContent('Page not found');
    expect(screen.getByRole('link', { name: 'Go to employees' })).toHaveAttribute(
      'href',
      '/employees',
    );
  });
});
