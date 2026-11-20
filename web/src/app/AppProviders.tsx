import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '../theme/GlobalStyle';
import { theme } from '../theme/theme';

/** App-wide providers. Shared by the real app and by tests, so tests render with the same setup. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
