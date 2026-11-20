import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';
import { server } from '../../test/server';
import { employeeApiHandlers, makeEmployee } from './test-data';

function useFakeApi() {
  const api = employeeApiHandlers([makeEmployee()]);
  server.use(...api.handlers);
  return api;
}

async function openPage() {
  const result = renderRoute('/employees');
  await screen.findByRole('row', { name: /Asha Rao/ });
  return result;
}

describe('adding an employee', () => {
  it('saves a valid employee, confirms it, and shows them in the list', async () => {
    const api = useFakeApi();
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });
    const code = within(dialog).getByLabelText('Employee code');
    expect(code).toHaveAttribute('readonly');
    expect(code).toHaveAccessibleDescription('The next free code is assigned when you save');

    await user.type(within(dialog).getByLabelText('Full name'), 'Meera Iyer');
    await user.type(within(dialog).getByLabelText('Email'), 'Meera.Iyer@acme.test');
    await user.type(within(dialog).getByLabelText('Hire date'), '2026-11-02');
    await user.type(within(dialog).getByLabelText('Job title'), 'Product Designer');
    await user.type(within(dialog).getByLabelText('Department'), 'Product');
    await user.selectOptions(within(dialog).getByLabelText('Country'), 'India');
    expect(within(dialog).getByText('Paid in INR')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Annual salary (INR)'), '2400000');

    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Meera Iyer added as EMP-00002')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Sent already cleaned up by the shared schema (trimmed, lower-cased email). No code: the API assigns it.
    expect(api.changes).toEqual([
      {
        method: 'POST',
        body: {
          fullName: 'Meera Iyer',
          email: 'meera.iyer@acme.test',
          hireDate: '2026-11-02',
          jobTitle: 'Product Designer',
          department: 'Product',
          country: 'IN',
          annualSalary: 2_400_000,
        },
      },
    ]);
    expect(await screen.findByRole('row', { name: /Meera Iyer/ })).toBeInTheDocument();
  });

  it('shows what is wrong, next to each field, without sending anything', async () => {
    const api = useFakeApi();
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });
    await user.type(within(dialog).getByLabelText('Email'), 'not-an-email');
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    const fullName = within(dialog).getByLabelText('Full name');
    expect(fullName).toHaveAttribute('aria-invalid', 'true');
    expect(fullName).toHaveAccessibleDescription('Full name is required');
    expect(within(dialog).getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address',
    );
    // The hint and the error are both read out with the field.
    expect(within(dialog).getByLabelText('Country')).toHaveAccessibleDescription(
      'The currency is set from the country Choose a country',
    );
    expect(api.changes).toEqual([]);
  });

  it('shows a duplicate email reported by the server under the email field', async () => {
    useFakeApi();
    const message = 'Another employee already uses this email address.';
    server.use(
      http.post('*/api/employees', () =>
        HttpResponse.json(
          { error: { message, details: [{ field: 'email', message }] } },
          { status: 409 },
        ),
      ),
    );
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });
    await user.type(within(dialog).getByLabelText('Full name'), 'Asha Rao');
    await user.type(within(dialog).getByLabelText('Email'), 'asha.rao@acme.test');
    await user.type(within(dialog).getByLabelText('Hire date'), '2026-11-02');
    await user.type(within(dialog).getByLabelText('Job title'), 'Engineer');
    await user.type(within(dialog).getByLabelText('Department'), 'Engineering');
    await user.selectOptions(within(dialog).getByLabelText('Country'), 'India');
    await user.type(within(dialog).getByLabelText('Annual salary (INR)'), '100000');
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    await waitFor(() =>
      expect(within(dialog).getByLabelText('Email')).toHaveAccessibleDescription(message),
    );
    expect(screen.getByRole('dialog', { name: 'Add employee' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    useFakeApi();
    const { user } = await openPage();
    const addButton = screen.getByRole('button', { name: 'Add employee' });

    await user.click(addButton);
    // The browser fires "cancel" when Escape is pressed on a modal <dialog>.
    fireEvent(await screen.findByRole('dialog'), new Event('cancel', { cancelable: true }));

    // Closing finishes after the closing animation, so wait for it.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(addButton).toHaveFocus();
  });
});

describe('editing an employee', () => {
  it('opens the form filled in, and saves the changes', async () => {
    const api = useFakeApi();
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Edit Asha Rao' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Asha Rao' });
    expect(within(dialog).getByLabelText('Full name')).toHaveValue('Asha Rao');
    expect(within(dialog).getByLabelText('Employee code')).toHaveValue('EMP-00001');
    expect(within(dialog).getByLabelText('Employee code')).toHaveAttribute('readonly');
    expect(within(dialog).getByLabelText('Country')).toHaveValue('IN');

    const salary = within(dialog).getByLabelText('Annual salary (INR)');
    await user.clear(salary);
    await user.type(salary, '2750000');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Changes to Asha Rao saved')).toBeInTheDocument();
    expect(api.changes).toEqual([
      { method: 'PUT', id: 1, body: expect.objectContaining({ annualSalary: 2_750_000 }) },
    ]);
    expect(await screen.findByRole('row', { name: /₹2,750,000/ })).toBeInTheDocument();
  });
});

describe('deleting an employee', () => {
  it('asks for confirmation and does nothing when cancelled', async () => {
    const api = useFakeApi();
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Delete Asha Rao' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete employee?' });
    expect(dialog).toHaveTextContent(
      'Asha Rao (EMP-00001) and their salary record will be permanently deleted.',
    );

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.changes).toEqual([]);
  });

  it('deletes after confirmation and updates the list', async () => {
    const api = useFakeApi();
    const { user } = await openPage();

    await user.click(screen.getByRole('button', { name: 'Delete Asha Rao' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('Asha Rao deleted')).toBeInTheDocument();
    expect(api.changes).toEqual([{ method: 'DELETE', id: 1 }]);
    expect(await screen.findByText('No employees yet')).toBeInTheDocument();
  });
});
