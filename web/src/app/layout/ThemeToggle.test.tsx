import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/render';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('switches between light and dark mode and remembers the choice', async () => {
    const { user } = renderRoute('/employees');

    await user.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('acme-color-mode')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('acme-color-mode')).toBe('light');
  });

  it('can be used with the keyboard', async () => {
    const { user } = renderRoute('/employees');
    const toggle = await screen.findByRole('button', { name: 'Switch to dark mode' });

    toggle.focus();
    await user.keyboard('{Enter}');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
