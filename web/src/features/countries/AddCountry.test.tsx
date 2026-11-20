import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee } from '../employees/test-data';

function useFakeApi() {
  const api = employeeApiHandlers([makeEmployee()]); // Asha Rao, India
  server.use(...api.handlers);
  return api;
}

async function openAddEmployee() {
  const result = renderRoute('/employees');
  await screen.findByRole('row', { name: /Asha Rao/ });
  await result.user.click(screen.getByRole('button', { name: 'Add employee' }));
  const form = await screen.findByRole('dialog', { name: 'Add employee' });
  return { ...result, form };
}

describe('adding a country from the employee form', () => {
  it('adds a country with a new currency, asks for its rate, and selects it', async () => {
    useFakeApi();
    const { user, form } = await openAddEmployee();
    const country = within(form).getByLabelText('Country');

    await user.selectOptions(country, '+ Add another country');
    const dialog = await screen.findByRole('dialog', { name: 'Add a country' });
    await user.selectOptions(within(dialog).getByLabelText('Country'), 'Kenya');

    expect(within(dialog).getByLabelText('Country')).toHaveAccessibleDescription(
      'Paid in Kenyan Shilling (KES)',
    );
    await user.type(within(dialog).getByLabelText('Exchange rate: 1 KES = ? USD'), '0.0077');
    await user.click(within(dialog).getByRole('button', { name: 'Add country' }));

    // Back on the employee form, with Kenya chosen and the salary in shillings.
    expect(await within(form).findByLabelText('Annual salary (KES)')).toBeInTheDocument();
    expect(country).toHaveValue('KE');
    expect(within(country).getByRole('option', { name: 'Kenya' })).toBeInTheDocument();
  });

  it('does not ask for a rate when another country already uses the currency', async () => {
    useFakeApi();
    const { user, form } = await openAddEmployee();

    await user.selectOptions(within(form).getByLabelText('Country'), '+ Add another country');
    const dialog = await screen.findByRole('dialog', { name: 'Add a country' });
    await user.selectOptions(within(dialog).getByLabelText('Country'), 'France'); // euro, like Germany

    expect(within(dialog).queryByLabelText(/Exchange rate/)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add country' }));

    expect(await within(form).findByLabelText('Annual salary (EUR)')).toBeInTheDocument();
  });

  it('only offers countries that are not set up yet, and needs a rate for a new currency', async () => {
    useFakeApi();
    const { user, form } = await openAddEmployee();

    await user.selectOptions(within(form).getByLabelText('Country'), '+ Add another country');
    const dialog = await screen.findByRole('dialog', { name: 'Add a country' });
    const country = within(dialog).getByLabelText('Country');

    expect(within(country).queryByRole('option', { name: 'India' })).not.toBeInTheDocument();
    await user.selectOptions(country, 'Kenya');
    await user.click(within(dialog).getByRole('button', { name: 'Add country' }));

    expect(
      within(dialog).getByLabelText('Exchange rate: 1 KES = ? USD'),
    ).toHaveAccessibleDescription(expect.stringContaining('Enter a rate greater than 0'));
  });

  it('keeps the chosen country when adding one is cancelled', async () => {
    useFakeApi();
    const { user, form } = await openAddEmployee();
    const country = within(form).getByLabelText('Country');
    await user.selectOptions(country, 'India');

    await user.selectOptions(country, '+ Add another country');
    const dialog = await screen.findByRole('dialog', { name: 'Add a country' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(country).toHaveValue('IN');
  });
});

describe('country filter', () => {
  it('lists only countries that have employees', async () => {
    useFakeApi(); // one employee, in India
    renderRoute('/employees');
    await screen.findByRole('row', { name: /Asha Rao/ });

    const options = within(screen.getByLabelText('Country')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['All countries', 'India']);
  });
});
