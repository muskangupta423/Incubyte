import { QueryClient } from '@tanstack/react-query';

const THIRTY_SECONDS = 30_000;

/**
 * TanStack Query keeps server data in a cache, so the same request isn't repeated and
 * screens show cached data instantly while refreshing in the background.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Salary data changes rarely; treat it as fresh for 30s to avoid needless refetches.
        staleTime: THIRTY_SECONDS,
        // One retry smooths over a network blip without making real errors slow to show.
        retry: 1,
      },
    },
  });
}
