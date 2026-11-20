import { useState } from 'react';

export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'acme-color-mode';

/** The user's saved choice, otherwise their operating-system preference. */
export function getPreferredColorMode(): ColorMode {
  const saved = readSavedColorMode();
  if (saved) return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Applies a mode by setting <html data-theme="...">; GlobalStyle swaps the colour variables. */
export function applyColorMode(mode: ColorMode): void {
  document.documentElement.dataset.theme = mode;
}

export function useColorMode() {
  const [mode, setMode] = useState<ColorMode>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  function toggleColorMode() {
    const nextMode: ColorMode = mode === 'dark' ? 'light' : 'dark';
    applyColorMode(nextMode);
    saveColorMode(nextMode);
    setMode(nextMode);
  }

  return { mode, toggleColorMode };
}

// Storage can be unavailable (private mode, blocked cookies). The toggle still works for the
// current visit; we just can't remember it, so failures are deliberately non-fatal.
function readSavedColorMode(): ColorMode | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function saveColorMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    // See note above: remembering the choice is a convenience, not a requirement.
    console.warn('Could not save the colour mode preference', error);
  }
}
