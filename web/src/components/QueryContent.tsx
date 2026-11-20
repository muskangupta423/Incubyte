import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

interface QueryContentProps<T> {
  query: UseQueryResult<T>;
  loadingLabel: string;
  errorTitle: string;
  children: (data: T) => ReactNode;
}

/**
 * Loading → error (with "Try again") → content, for one server request.
 * Used by every dashboard section so they all behave the same way.
 */
export function QueryContent<T>({
  query,
  loadingLabel,
  errorTitle,
  children,
}: QueryContentProps<T>) {
  if (query.isPending) return <LoadingState label={loadingLabel} />;
  if (query.isError) {
    return (
      <ErrorState
        title={errorTitle}
        message={query.error.message}
        action={<Button onClick={() => void query.refetch()}>Try again</Button>}
      />
    );
  }
  return <>{children(query.data)}</>;
}
