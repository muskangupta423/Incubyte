import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { ToastProvider } from '../components/toast/ToastProvider';
import { GlobalStyle } from '../theme/GlobalStyle';
import { theme } from '../theme/theme';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/**
 * App-wide providers. Shared by the real app and by tests, so tests render with the same setup.
 * The query client is passed in so each test can use its own, isolated cache.
 */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
