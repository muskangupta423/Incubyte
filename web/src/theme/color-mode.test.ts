import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPreferredColorMode } from './color-mode';

function prefersDarkSystemTheme(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: prefersDark, media: query }));
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('getPreferredColorMode', () => {
  it("uses the user's saved choice first", () => {
    prefersDarkSystemTheme(true);
    localStorage.setItem('acme-color-mode', 'light');

    expect(getPreferredColorMode()).toBe('light');
  });

  it('falls back to the operating-system preference', () => {
    prefersDarkSystemTheme(true);

    expect(getPreferredColorMode()).toBe('dark');
  });

  it('ignores an unexpected saved value', () => {
    prefersDarkSystemTheme(false);
    localStorage.setItem('acme-color-mode', 'purple');

    expect(getPreferredColorMode()).toBe('light');
  });
});
