import { useRouteError } from 'react-router';
import { ErrorState } from '../components/ErrorState';

/** Last-resort screen if a page crashes while rendering. Details go to the console, not the user. */
export function AppErrorPage() {
  const error = useRouteError();
  console.error('Unexpected error while rendering a page', error);

  return (
    <ErrorState
      title="Something went wrong"
      message="Please reload the page. If the problem continues, contact support."
      action={<a href="/employees">Reload</a>}
    />
  );
}
