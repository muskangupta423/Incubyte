import { Link } from 'react-router';
import { ErrorState } from '../components/ErrorState';

export function NotFoundPage() {
  return (
    <ErrorState
      title="Page not found"
      message="The page you were looking for doesn't exist."
      action={<Link to="/employees">Go to employees</Link>}
    />
  );
}
